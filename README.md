# agentic-shopping.flyreelstudio.eu — landing site for Agentic Shopping Autopilot

Source of the one-page website for **[Agentic Shopping Autopilot](https://github.com/AndriiShramko/agentic-shopping-autopilot)**, the open-source layer that lets a user's own AI agent read the user's knowledge store first, then find, order and pay for goods on real e-commerce sites under a signed purchase mandate. Live: **https://agentic-shopping.flyreelstudio.eu**

The site answers the questions people ask their AI about autonomous shopping agents: can an AI agent pay for me, where does my card data live, what happens with 3-D Secure, how does the agent know my sizes without asking, how do I install it with Claude Code or Codex, and what can go wrong.

## What is in this repository

- `web/` — Next.js 15 static export (`output: "export"`), next-intl with four locales (EN default, ES, PL, RU), Tailwind 4, dark theme, GA4 behind a consent gate (env-gated, zero trackers without consent), JSON-LD (SoftwareApplication, Person, WebSite, FAQPage), sitemap, robots that allow AI crawlers, `llms.txt`.
- `form/` — tiny Python backend with two jobs. **Leads:** stored in a local JSONL file first, then forwarded to a Telegram bot with the message id as proof; honeypot, time-to-submit flag, per-IP rate limit, partial capture with delayed forwarding. **Metrics:** `POST /api/e` is a first-party, cookieless counter that runs for every visitor with no consent needed — no cookie, no device id, no IP stored, allow-listed event names only; `GET /api/stats` returns aggregated counters and is reachable from the server itself only (`ops/stats.sh`).
- `deploy/` — Docker Compose for a shared Hetzner hub behind `nginx-proxy` + `acme-companion` (no host ports, own internal network, memory and pid limits, log rotation) and the nginx config with locale detection (cookie beats `Accept-Language`, `Accept-Language` beats the English default).

## Build and verify

```bash
cd web
npm install
NEXT_PUBLIC_TEST_COUNT=166 NEXT_PUBLIC_GA_ID=G-2288CN6DJW npm run build   # GA4 property "Agentic Shopping Autopilot", web stream agentic-shopping.flyreelstudio.eu
node scripts/fix-lang.mjs          # per-locale <html lang> after static export
node scripts/shots.mjs             # Playwright screenshots + heading visibility + overflow checks
node scripts/verify-live.mjs       # DoD: locales, switcher + cookie, form e2e, links, sticky CTA
node scripts/ga-check.mjs          # measurement: own counter + GA4 fire without consent, GA cookies only after Accept
```

`out/` is what nginx serves. Locale redirect on `/` is done by nginx, not by the app, so a plain static host needs the same redirect rule or a link to `/en/`.

## Deploy (owner's hub)

```bash
tar czf dist.tgz -C web/out .
scp -P 2222 dist.tgz deploy/nginx.conf deploy/docker-compose.yml fpv@hub:~/agentic-shopping/
scp -P 2222 form/server.py fpv@hub:~/agentic-shopping/form/
ssh -p 2222 fpv@hub 'cd ~/agentic-shopping && tar xzf dist.tgz -C dist && docker compose up -d && docker restart agentic-shopping-web'
```

`config.env` (Telegram bot token and chat id) lives only on the server with `chmod 600` and is never committed.

## Metrics

Two layers, both always on. The first-party counter (`/api/e`) measures every visitor without cookies or identifiers, so traffic is recorded whatever the visitor does with the cookie banner. Google Analytics 4 loads in Google Consent Mode v2: denied by default (cookieless pings, nothing stored on the device) and upgraded to granted when the visitor accepts. Read the numbers with:

```bash
ops/stats.sh 30     # aggregated page views, events, locales, referrers, viewports
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
