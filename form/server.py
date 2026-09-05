"""Lead-form backend for agentic-shopping.flyreelstudio.eu.

POST /api/lead   -> (1) append to a local JSONL store (durable, backed up with the volume)
                    (2) forward to the shared Telegram lead bot (message_id returned as proof)
                    Body may carry "stage": "partial" (identity captured early, playbook §4) or
                    "final" (default). A partial is forwarded only if no final arrives within
                    PARTIAL_DELAY_S (default 30 min) — so the operator still sees abandoned leads.
GET  /api/health -> {"ok": true, "pending_partials": n}

Design (owner's WEB-PLAYBOOK §4/§5):
- TG_BOT_TOKEN / TG_CHAT_ID only from env (config.env on the server, chmod 600, never in git).
- Honeypot field "website": silently accepted and dropped.
- Time-to-submit guard: submissions faster than 2 s are stored but flagged, not forwarded.
- In-RAM rate limit per client IP (first X-Forwarded-For hop, set by nginx-proxy).
- No PII in stdout logs (method + status only). Lead is stored FIRST (never lost if Telegram is down).
"""
from __future__ import annotations

import json
import os
import threading
import time
import uuid
import urllib.request
from collections import defaultdict, deque
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

MAX_BODY = 16 * 1024
RATE_N, RATE_WINDOW = 8, 3600.0
SITE = os.environ.get("SITE_TAG", "agentic-shopping")
DATA_DIR = Path(os.environ.get("DATA_DIR", "/data"))
LEADS_FILE = DATA_DIR / "leads.jsonl"
PARTIAL_DELAY_S = float(os.environ.get("PARTIAL_DELAY_S", "1800"))

INTENT_TYPES = {"try", "partner", "hire", "invest", "press", "skill", "other"}
_hits: dict[str, deque] = defaultdict(deque)
_lock = threading.Lock()
# leadId -> {"ts": float, "text": str}; removed when finalised or forwarded
_pending: dict[str, dict] = {}
_finalised: set[str] = set()


def _allowed(ip: str) -> bool:
    q = _hits[ip]
    now = time.time()
    while q and now - q[0] > RATE_WINDOW:
        q.popleft()
    if len(q) >= RATE_N:
        return False
    q.append(now)
    return True


def _store(record: dict) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with _lock, LEADS_FILE.open("a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")
        f.flush()
        os.fsync(f.fileno())


def send_telegram(text: str) -> int | None:
    """Returns Telegram message_id on success (proof of delivery), None on failure."""
    token = os.environ.get("TG_BOT_TOKEN", "")
    chat = os.environ.get("TG_CHAT_ID", "")
    if not token or not chat:
        return None
    req = urllib.request.Request(
        f"https://api.telegram.org/bot{token}/sendMessage",
        data=json.dumps({"chat_id": chat, "text": text, "disable_web_page_preview": True}).encode(),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=10) as r:
        resp = json.load(r)
        if resp.get("ok"):
            return resp.get("result", {}).get("message_id")
        return None


def _clean(v, n: int) -> str:
    return str(v or "").strip()[:n]


def _format(record: dict, stage: str) -> str:
    tag = f"[LEAD][site={SITE}][type={record['intent']}]" + ("[partial]" if stage == "partial" else "")
    return (
        f"{tag}\n"
        f"Name: {record['name'] or '-'}\n"
        f"Contact: {record['contact']}\n"
        f"Agent: {record['agent'] or '-'}\n"
        f"Shops/country: {record['shops'] or '-'}\n"
        f"Lang: {record['lang'] or '-'} | Source: {record['source'] or '-'}\n"
        f"Message:\n{record['message'] or '-'}"
    )


def _flush_partials() -> None:
    """Background: forward partials whose final never arrived."""
    while True:
        time.sleep(30)
        now = time.time()
        due = []
        with _lock:
            for lid, item in list(_pending.items()):
                if lid in _finalised:
                    _pending.pop(lid, None)
                elif now - item["ts"] >= PARTIAL_DELAY_S:
                    due.append((lid, _pending.pop(lid)))
        for lid, item in due:
            try:
                mid = send_telegram(item["text"])
            except Exception:
                mid = None
            _store({"id": lid, "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "site": SITE, "event": "partial_forwarded", "message_id": mid})


class Handler(SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args):
        print(f"{time.strftime('%H:%M:%S')} {self.command} {self.path.split('?')[0]}", flush=True)

    def do_GET(self):
        if self.path.split("?")[0] in ("/api/health", "/health"):
            return self._json(200, {"ok": True, "site": SITE, "pending_partials": len(_pending)})
        return self._json(404, {"ok": False})

    def do_POST(self):
        if self.path.split("?")[0] not in ("/api/lead", "/lead"):
            return self._json(404, {"ok": False})
        ip = self.headers.get("X-Forwarded-For", self.client_address[0]).split(",")[0].strip()
        if not _allowed(ip):
            return self._json(429, {"ok": False, "error": "rate-limited"})
        try:
            n = min(int(self.headers.get("Content-Length", 0)), MAX_BODY)
            data = json.loads(self.rfile.read(n))
            if not isinstance(data, dict):
                raise ValueError
        except Exception:
            return self._json(400, {"ok": False, "error": "bad json"})
        if data.get("website"):  # honeypot -> pretend success
            return self._json(200, {"ok": True})

        contact = _clean(data.get("contact"), 200)
        if not contact or not data.get("consent"):
            return self._json(400, {"ok": False, "error": "missing fields"})
        intent = _clean(data.get("intent"), 40).lower()
        if intent not in INTENT_TYPES:
            intent = "other"
        stage = "partial" if _clean(data.get("stage"), 10).lower() == "partial" else "final"
        try:
            tts = float(data.get("tts") or 0)
        except (TypeError, ValueError):
            tts = 0.0
        suspicious = 0 < tts < 2.0

        record = {
            "id": _clean(data.get("leadId"), 64) or uuid.uuid4().hex,
            "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "site": SITE,
            "stage": stage,
            "intent": intent,
            "name": _clean(data.get("name"), 120),
            "contact": contact,
            "agent": _clean(data.get("agent"), 60),
            "shops": _clean(data.get("shops"), 200),
            "message": _clean(data.get("message"), 2000),
            "lang": _clean(data.get("lang"), 5),
            "source": _clean(data.get("source"), 80),
            "tts": tts,
            "suspicious": suspicious,
        }
        _store(record)
        if suspicious:
            return self._json(200, {"ok": True, "stored": True})

        text = _format(record, stage)
        if stage == "partial":
            with _lock:
                if record["id"] not in _finalised:
                    _pending[record["id"]] = {"ts": time.time(), "text": text}
            return self._json(200, {"ok": True, "stored": True, "partial": True})

        with _lock:
            _finalised.add(record["id"])
            _pending.pop(record["id"], None)
        try:
            msg_id = send_telegram(text)
        except Exception:
            msg_id = None
        if msg_id is not None:
            _store({"id": record["id"], "ts": record["ts"], "site": SITE, "event": "tg_sent", "message_id": msg_id})
            return self._json(200, {"ok": True, "stored": True, "message_id": msg_id})
        # stored locally; the operator re-sends from the store if Telegram was down
        return self._json(200, {"ok": True, "stored": True, "forwarded": False})

    def _json(self, code: int, payload: dict):
        body = json.dumps(payload).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8089"))
    threading.Thread(target=_flush_partials, daemon=True).start()
    print(f"{SITE}-form on :{port} (store={LEADS_FILE}, partial delay {PARTIAL_DELAY_S:.0f}s)", flush=True)
    ThreadingHTTPServer(("0.0.0.0", port), Handler).serve_forever()
