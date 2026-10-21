// Site analytics (WEB-TECH-BASELINE-2026 §T6, vault: 03 - Resources/Deployment/analytics/ANALYTICS-HOWTO.md).
//
// Nothing is measured from the browser until the visitor clicks "Accept analytics":
//  - no request to Google before consent: gtag.js is injected only by loadGa(), which runs
//    only after Accept (or on a later visit when the stored choice is "yes") = Consent Mode BASIC;
//  - gtag('config') runs after consent, so the page_view of the page where the visitor accepted
//    is sent GRANTED (gcs=G101) — the 2026-09-07 "advanced mode" sent it denied (G100) and the
//    GA property showed "No data received";
//  - the first-party counter POST /api/e (no cookie, no IP) is also sent only with consent
//    (EDPB 2/2023: cookieless JS still needs consent). Visits of everyone else are counted on
//    the server from the access log (hub-wide site_stats.py, no IP stored).
// One page_view per load: the automatic one from gtag('config'); never send page_view by hand.
type GtagFn = (...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: GtagFn;
    dataLayer?: unknown[];
    __asaGaLoaded?: boolean;
    [key: `ga-disable-${string}`]: boolean | undefined;
  }
}

// Public GA4 measurement id (property "Agentic Shopping Autopilot" 552923057, web stream
// agentic-shopping.flyreelstudio.eu). Committed on purpose: an env-gated id silently disappears
// when a release is built without the variable. scripts/check-ga-id.mjs (postbuild) fails the
// build if this exact id is missing from the bundle.
export const GA_ID = "G-2288CN6DJW";
export const CONSENT_KEY = "asa_consent"; // localStorage: "yes" | "no"
export const CONSENT_OPEN_EVENT = "asa:consent-open";

export type FunnelEvent =
  | "cta_click"
  | "contact_click"
  | "lang_switch"
  | "copy_agent_prompt"
  | "github_click"
  | "form_start"
  | "form_step"
  | "form_submit"
  | "generate_lead"
  | "form_error"
  | "faq_open"
  | "section_view"
  | "consent_accept"
  | "scroll_depth"
  | "exception";

export function storedConsent(): string | null {
  try {
    return localStorage.getItem(CONSENT_KEY);
  } catch {
    return null;
  }
}

export function hasConsent() {
  return typeof window !== "undefined" && !!window.__asaGaLoaded && storedConsent() === "yes";
}

function siteLang() {
  return (document.documentElement.lang || "und").slice(0, 5).toLowerCase();
}

/** First-party counter (same origin, no cookie, no IP). Only after consent. Never throws. */
function beacon(event: FunnelEvent, params: Record<string, unknown>) {
  try {
    const value = params.cta_id ?? params.link_id ?? params.lang_to ?? params.lead_type ?? params.section_id ?? params.faq_index ?? params.percent ?? params.method;
    const body = JSON.stringify({
      e: event,
      p: location.pathname,
      loc: document.documentElement.lang || "",
      r: document.referrer ? new URL(document.referrer).hostname : "direct",
      w: window.innerWidth,
      v: value === undefined || value === null ? "" : String(value).slice(0, 40),
    });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/e", new Blob([body], { type: "application/json" }));
    else void fetch("/api/e", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
  } catch {
    /* analytics must never break the page */
  }
}

/**
 * Funnel event. Does nothing before consent (no queueing either, so nothing is sent
 * retroactively). `beacon: true` for events fired right before a full navigation.
 */
export function track(event: FunnelEvent, params: Record<string, unknown> = {}, opts: { beacon?: boolean } = {}) {
  if (!hasConsent()) return;
  const p: Record<string, unknown> = { site_lang: siteLang(), ...params };
  beacon(event, p);
  if (typeof window.gtag === "function") window.gtag("event", event, opts.beacon ? { ...p, transport_type: "beacon" } : p);
}

/** Loads GA4 — call ONLY after the visitor accepted. Its config sends the granted page_view. */
export function loadGa() {
  if (typeof window === "undefined" || !GA_ID || window.__asaGaLoaded) return;
  window.__asaGaLoaded = true;
  window[`ga-disable-${GA_ID}`] = false;
  window.dataLayer = window.dataLayer || [];
  const gtag: GtagFn = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag = gtag;
  gtag("consent", "default", {
    analytics_storage: "granted",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  gtag("js", new Date());
  gtag("set", { allow_google_signals: false, allow_ad_personalization_signals: false });
  // cookie_domain = this host only (the old build put _ga on .flyreelstudio.eu, shared with every
  // neighbour site); cookie lifetime 14 months, as the privacy text says.
  gtag("config", GA_ID, { cookie_domain: location.hostname, cookie_flags: "SameSite=Lax;Secure", cookie_expires: 60 * 60 * 24 * 426, site_lang: siteLang() });
  const s = document.createElement("script");
  s.id = "ga4-script";
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
  document.head.appendChild(s);
}

/** Accept: store "yes" and start GA (or re-enable it if it was withdrawn earlier on this page). */
export function acceptConsent() {
  try {
    localStorage.setItem(CONSENT_KEY, "yes");
  } catch {
    /* ignore */
  }
  if (typeof window === "undefined") return;
  if (window.__asaGaLoaded && typeof window.gtag === "function") {
    window[`ga-disable-${GA_ID}`] = false;
    window.gtag("consent", "update", { analytics_storage: "granted" });
  } else {
    loadGa();
  }
}

/** GA cookies: ours on this host, plus the ones the pre-2026-10-21 build set on .flyreelstudio.eu. */
function deleteGaCookies() {
  const names = ["_ga", `_ga_${GA_ID.replace(/^G-/, "")}`];
  const host = location.hostname;
  const parts = host.split(".");
  const domains = ["", host, `.${host}`];
  for (let i = 1; i < parts.length - 1; i++) domains.push(`.${parts.slice(i).join(".")}`);
  for (const n of names)
    for (const d of domains) document.cookie = `${n}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${d ? `; domain=${d}` : ""}`;
}

/** Withdraw (or refuse) consent: store "no", stop GA in this page, delete its cookies. */
export function withdrawConsent() {
  try {
    localStorage.setItem(CONSENT_KEY, "no");
  } catch {
    /* ignore */
  }
  if (typeof window === "undefined") return;
  if (window.__asaGaLoaded && typeof window.gtag === "function") {
    // gtag holds events of the last ~5 s in a batch and sends it on pagehide — even after
    // ga-disable. Flush that batch (events made WITH consent) now, so nothing leaves later.
    try {
      window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: false }));
    } catch {
      /* ignore */
    }
    window.gtag("consent", "update", { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
  }
  window[`ga-disable-${GA_ID}`] = true;
  deleteGaCookies();
}

/** Footer "Cookie settings": reopen the banner. */
export function openConsentSettings() {
  window.dispatchEvent(new Event(CONSENT_OPEN_EVENT));
}
