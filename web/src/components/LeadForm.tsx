"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { LEAD_ENDPOINT } from "@/config/site";
import { track } from "@/lib/track";

/**
 * Foolproof lead form (playbook §4): chips instead of typing, ONE free-text field (optional),
 * one contact field, consent checkbox, honeypot, time-to-submit, durable leadId, refresh-safe
 * draft, partial capture once contact + consent are valid. Any valid submission succeeds.
 */
const INTENTS = ["try", "partner", "hire", "invest", "skill", "press"] as const;
const AGENTS = ["Claude Code", "Codex", "Cursor", "Gemini CLI", "Other", "None yet"] as const;
const DRAFT_KEY = "asa.lead.draft.v1";

type Draft = { leadId: string; intent: string; agent: string; contact: string; message: string; consent: boolean };

function newId() {
  try {
    return crypto.randomUUID().replace(/-/g, "");
  } catch {
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  }
}

function loadDraft(): Draft {
  const empty: Draft = { leadId: newId(), intent: "", agent: "", contact: "", message: "", consent: false };
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return empty;
    const d = JSON.parse(raw) as Partial<Draft>;
    return { ...empty, ...d, leadId: d.leadId || empty.leadId };
  } catch {
    return empty;
  }
}

function contactLooksValid(v: string) {
  const s = v.trim();
  if (s.length < 5) return false;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)) return true; // email
  if (/^@?[a-z0-9_]{4,32}$/i.test(s)) return true; // telegram / x handle
  if (/^\+?[\d\s()-]{8,20}$/.test(s)) return true; // phone / whatsapp
  if (/linkedin\.com\/in\/[^\s/]+/i.test(s)) return true; // linkedin url
  return false;
}

export default function LeadForm() {
  const t = useTranslations("form");
  const locale = useLocale();
  const [d, setD] = useState<Draft | null>(null);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const mountRef = useRef<number>(0);
  const partialSent = useRef(false);
  const openedRef = useRef(false);

  useEffect(() => {
    mountRef.current = Date.now();
    setD(loadDraft());
  }, []);

  useEffect(() => {
    if (!d) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
    } catch {
      /* ignore */
    }
  }, [d]);

  const valid = useMemo(() => !!d && contactLooksValid(d.contact) && d.consent, [d]);

  // Partial capture: as soon as contact + consent are valid, register identity (forwarded only if abandoned).
  useEffect(() => {
    if (!d || !valid || partialSent.current) return;
    partialSent.current = true;
    void fetch(LEAD_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload(d), stage: "partial" }),
      keepalive: true,
    }).catch(() => undefined);
  }, [d, valid]);

  function payload(x: Draft) {
    return {
      leadId: x.leadId,
      intent: x.intent || "other",
      agent: x.agent,
      contact: x.contact.trim(),
      message: x.message.trim(),
      consent: x.consent,
      lang: locale,
      source: "landing",
      tts: (Date.now() - mountRef.current) / 1000,
    };
  }

  function update(patch: Partial<Draft>) {
    if (!openedRef.current) {
      openedRef.current = true;
      track("form_open");
    }
    setD((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!d || !valid || state === "sending") return;
    setState("sending");
    track("form_submit", { intent: d.intent || "other", agent: d.agent });
    try {
      const r = await fetch(LEAD_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload(d), stage: "final" }),
      });
      if (!r.ok) throw new Error(String(r.status));
      setState("done");
      track("form_success", { intent: d.intent || "other" });
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
    } catch {
      setState("error");
      track("form_error");
    }
  }

  if (!d) {
    return <div className="h-64 animate-pulse rounded-2xl border border-line bg-surface" aria-hidden="true" />;
  }

  if (state === "done") {
    return (
      <div role="status" className="rounded-2xl border border-ok/40 bg-surface p-6">
        <p className="text-lg font-semibold text-ok">{t("done.title")}</p>
        <p className="mt-2 text-muted">{t("done.text")}</p>
      </div>
    );
  }

  const chip = (active: boolean) =>
    `chip rounded-full border px-4 py-2 text-left ${active ? "border-accent bg-accent/15 text-accent-strong" : "border-border-input text-ink hover:border-accent"}`;

  return (
    <form onSubmit={submit} className="rounded-2xl border border-line bg-surface p-6 sm:p-8" noValidate>
      {/* honeypot — real users never see it */}
      <div aria-hidden="true" className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
        <label>
          website <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <fieldset className="border-0 p-0">
        <legend className="text-base font-semibold">{t("intent.label")}</legend>
        <div role="radiogroup" className="mt-3 flex flex-wrap gap-2">
          {INTENTS.map((i) => (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={d.intent === i}
              onClick={() => update({ intent: i })}
              className={chip(d.intent === i)}
            >
              {t(`intent.${i}`)}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-6 border-0 p-0">
        <legend className="text-base font-semibold">{t("agent.label")}</legend>
        <div role="radiogroup" className="mt-3 flex flex-wrap gap-2">
          {AGENTS.map((a) => (
            <button key={a} type="button" role="radio" aria-checked={d.agent === a} onClick={() => update({ agent: a })} className={chip(d.agent === a)}>
              {a === "Other" ? t("agent.other") : a === "None yet" ? t("agent.none") : a}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-6">
        <label htmlFor="contact" className="block text-base font-semibold">
          {t("contact.label")}
        </label>
        <input
          id="contact"
          name="contact"
          type="text"
          inputMode="email"
          autoComplete="email"
          placeholder={t("contact.placeholder")}
          value={d.contact}
          onChange={(e) => update({ contact: e.target.value })}
          className="mt-2 w-full rounded-lg border border-border-input bg-bg px-4 py-3 text-ink placeholder:text-muted/70 focus:border-accent"
        />
        <p className="mt-1 text-sm text-muted">{d.contact && !contactLooksValid(d.contact) ? t("contact.hint") : t("contact.help")}</p>
      </div>

      <div className="mt-6">
        <label htmlFor="message" className="block text-base font-semibold">
          {t("message.label")} <span className="font-normal text-muted">({t("message.optional")})</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={3}
          maxLength={2000}
          placeholder={t("message.placeholder")}
          value={d.message}
          onChange={(e) => update({ message: e.target.value })}
          className="mt-2 w-full rounded-lg border border-border-input bg-bg px-4 py-3 text-ink placeholder:text-muted/70 focus:border-accent"
        />
      </div>

      <label className="mt-6 flex items-start gap-3 text-sm text-muted">
        <input type="checkbox" checked={d.consent} onChange={(e) => update({ consent: e.target.checked })} className="mt-1 h-5 w-5 accent-accent" />
        <span>
          {t("consent.text")}{" "}
          <a href="#privacy" className="underline hover:text-ink">
            {t("consent.link")}
          </a>
        </span>
      </label>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button type="submit" disabled={!valid || state === "sending"} className="inline-flex min-h-12 items-center justify-center rounded-lg bg-accent px-6 text-base font-semibold text-[#1a0f05] hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50">
          {state === "sending" ? t("sending") : t("submit")}
        </button>
        <p className="text-sm text-muted">{valid ? t("ready") : t("needContact")}</p>
      </div>
      {state === "error" && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {t("error")}
        </p>
      )}
    </form>
  );
}
