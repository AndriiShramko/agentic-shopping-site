// Site analytics — two layers, both always on:
//
//  A) First-party, cookieless counter (`POST /api/e`, same origin). Fires for EVERY visitor
//     with no consent needed: no cookie, no device id, no IP stored, no free-form text —
//     only an allow-listed event name, the path, the locale, the referrer host and a
//     viewport bucket. This is the layer that guarantees traffic is always measured.
//
//  B) Google Analytics 4 via gtag, loaded with Google Consent Mode v2. It starts in
//     "denied" state (cookieless pings, no identifiers stored on the device) and is
//     upgraded to granted when the visitor accepts cookies in the banner.
type GtagFn = (...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: GtagFn;
    dataLayer?: unknown[];
    __asaGaLoaded?: boolean;
  }
}

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";

export type FunnelEvent =
  | "page_view"
  | "cta_click"
  | "lang_switch"
  | "copy_agent_prompt"
  | "github_click"
  | "form_open"
  | "form_step"
  | "form_submit"
  | "form_success"
  | "form_error"
  | "faq_open"
  | "example_open"
  | "consent_accept"
  | "consent_decline"
  | "scroll_depth";

/** Layer A: same-origin beacon. Never throws, never blocks the click. */
function beacon(event: FunnelEvent, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    const value = params?.where ?? params?.to ?? params?.target ?? params?.intent ?? params?.i ?? params?.percent;
    const body = JSON.stringify({
      e: event,
      p: location.pathname,
      loc: document.documentElement.lang || "",
      r: document.referrer ? new URL(document.referrer).hostname : "direct",
      w: window.innerWidth,
      v: value === undefined || value === null ? "" : String(value).slice(0, 40),
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/e", new Blob([body], { type: "application/json" }));
    } else {
      void fetch("/api/e", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
    }
  } catch {
    /* analytics must never break the page */
  }
}

export function track(event: FunnelEvent, params?: Record<string, unknown>) {
  beacon(event, params);
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", event, params ?? {});
  }
}

/**
 * Layer B bootstrap: called once on mount. Loads gtag immediately in Consent Mode
 * "denied" (cookieless), so GA4 measures traffic without waiting for the banner.
 */
export function initGa() {
  if (typeof window === "undefined" || !GA_ID || window.__asaGaLoaded) return;
  window.__asaGaLoaded = true;
  window.dataLayer = window.dataLayer || [];
  const gtag: GtagFn = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag = gtag;
  gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    wait_for_update: 500,
  });
  gtag("js", new Date());
  gtag("config", GA_ID, { anonymize_ip: true, send_page_view: true });
  const s = document.createElement("script");
  s.id = "ga4-script";
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
  document.head.appendChild(s);
}

/** Called by the banner: upgrade (Accept) or keep denied (Decline). */
export function setAnalyticsConsent(granted: boolean) {
  if (typeof window === "undefined") return;
  initGa();
  window.gtag?.("consent", "update", {
    analytics_storage: granted ? "granted" : "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
}

/** Backwards-compatible alias used by older components. */
export const loadGa = initGa;
