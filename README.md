# agentic-shopping.flyreelstudio.eu — landing site for Agentic Shopping Autopilot

Source of the one-page website for **[Agentic Shopping Autopilot](https://github.com/AndriiShramko/agentic-shopping-autopilot)**, the open-source layer that lets a user's own AI agent read the user's knowledge store first, then find, order and pay for goods on real e-commerce sites under a signed purchase mandate. Live: **https://agentic-shopping.flyreelstudio.eu**

The site answers the questions people ask their AI about autonomous shopping agents: can an AI agent pay for me, where does my card data live, what happens with 3-D Secure, how does the agent know my sizes without asking, how do I install it with Claude Code or Codex, and what can go wrong.

## What is in this repository

- `web/` — Next.js 15 static export (`output: "export"`), next-intl with four locales (EN default, ES, PL, RU), Tailwind 4, dark theme, GA4 that loads only after the visitor clicks Accept (Consent Mode basic: zero requests to Google before consent; the measurement id is committed in `src/lib/track.ts` and `scripts/check-ga-id.mjs` fails the build without it), JSON-LD (SoftwareApplication, Person, WebSite, FAQPage), sitemap, robots that allow AI crawlers, `llms.txt`.
- `form/` — tiny Python backend with two jobs. **Leads:** stored in a local JSONL file first, then forwarded to a Telegram bot with the message id as proof; honeypot, time-to-submit flag, per-IP rate limit, partial capture with delayed forwarding. **Metrics:** `POST /api/e` is a first-party counter — no cookie, no device id, no IP stored, allow-listed event names only — that the page calls only after the visitor accepted analytics; `GET /api/stats` returns aggregated counters and is reachable from the server itself only (`ops/stats.sh`).
- `deploy/` — Docker Compose for a shared Hetzner hub behind `nginx-proxy` + `acme-companion` (no host ports, own internal network, memory and pid limits, log rotation) and the nginx config with locale detection (cookie beats `Accept-Language`, `Accept-Language` beats the English default).

## Build and verify

```bash
cd web
npm install
NEXT_PUBLIC_TEST_COUNT=166 npm run build   # postbuild: scripts/fix-lang.mjs + scripts/check-ga-id.mjs (fails without G-2288CN6DJW)
node scripts/shots.mjs             # Playwright screenshots + heading visibility + overflow checks
python -m http.server 8123 --bind 127.0.0.1 --directory out &   # local copy for the checks below
node scripts/verify-live.mjs       # DoD: locales, switcher + cookie, form e2e (mocked), links, sticky CTA, nothing sent before consent
node scripts/ga-check.mjs          # GA4 contract: 0 Google requests before consent, granted page_view after Accept, one page_view per load, events, withdraw, decline
```

The GA4 measurement id `G-2288CN6DJW` (property "Agentic Shopping Autopilot", web stream agentic-shopping.flyreelstudio.eu) is public and lives in `web/src/lib/track.ts` — no env variable, so a release can no longer be built without it.

`out/` is what nginx serves. Locale redirect on `/` is done by nginx, not by the app, so a plain static host needs the same redirect rule or a link to `/en/`.

## Deploy (owner's hub)

```bash
(cd web && node scripts/check-ga-id.mjs) || exit 1   # guard: never ship a bundle without the GA id
tar czf dist.tgz -C web/out .
scp -P 2222 dist.tgz deploy/nginx.conf deploy/docker-compose.yml fpv@hub:~/agentic-shopping/
scp -P 2222 form/server.py fpv@hub:~/agentic-shopping/form/
ssh -p 2222 fpv@hub 'cd ~/agentic-shopping && tar xzf dist.tgz -C dist && docker compose up -d && docker restart agentic-shopping-web'
```

`nginx.conf` and `server.py` are single-file bind mounts: after replacing `server.py` also run `docker restart agentic-shopping-form`, otherwise the old file stays in the container. Back up `dist/`, `nginx.conf`, `docker-compose.yml` and `form/` to `~/_backups/asa-<date>/` before a release; rollback = copy them back and restart both containers.

`config.env` (Telegram bot token and chat id) lives only on the server with `chmod 600` and is never committed.

## Metrics

- **Every visit:** counted on the server from the hub's nginx-proxy access log (`/home/fpv/site-stats/site_stats.py`, counts stored without IP addresses) — nothing runs in the browser for that.
- **After Accept only:** Google Analytics 4 (Consent Mode basic: gtag.js is not even downloaded before consent; `config` runs after consent, so the page_view of the page where the visitor accepted is granted). Events: `cta_click {cta_id, cta_location}`, `contact_click {method}`, `github_click {link_id}`, `lang_switch {lang_to}`, `section_view {section_id}`, `form_start` / `form_step {step}` / `form_submit` / `generate_lead {form_id, lead_type, agent}` (only after the server stored the lead), `form_error {error_type}`, `copy_agent_prompt {copy_id}`, `faq_open {faq_index}`, `scroll_depth {percent}`, `exception {description}`; every event carries `site_lang`. Consent can be withdrawn with "Cookie settings" in the footer (GA disabled, `_ga` cookies deleted). The first-party counter `/api/e` also runs only after Accept.

```bash
ops/stats.sh 30                                              # /api/e counters (consenting visitors)
ssh … 'sudo python3 /home/fpv/site-stats/site_stats.py report last30'   # all visits, per vhost
```

## Translations

`web/messages/{en,es,pl,ru}.json` share one key structure. Product names, Polish UI strings, commands, file names, the receipt and code artifacts and ICU placeholders stay identical across locales; only prose is translated.

## License

Code: Apache-2.0. Site copy: CC BY 4.0.

## Contact and collaboration

- **Author:** Andrii Shramko
- **LinkedIn:** https://www.linkedin.com/in/andrii-shramko/
- **Book a call (calendar):** https://calendar.app.google/Ff729HqGk4RpzPNDA
- **Email:** zmei116@gmail.com
- **GitHub:** https://github.com/AndriiShramko

Always open to interesting people and conversations, and ready to help teams build ambitious projects — as a partner, a builder, or the person who assembles and leads the team.
