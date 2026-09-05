// Funnel analytics (owner's playbook §8). Two layers:
//  A) GA4 via gtag — loaded ONLY after consent (ConsentBanner) and only when
//     NEXT_PUBLIC_GA_ID is set at build time; otherwise a no-op.
//  B) sendBeacon to /api/event is intentionally NOT used: the static site keeps zero
//     first-party tracking without consent (privacy-by-default for an EU audience).
type GtagFn = (...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: GtagFn;
    dataLayer?: unknown[];
  }
}

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";

export type FunnelEvent =
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
  | "consent_decline";

export function track(event: FunnelEvent, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (typeof window.gtag === "function") {
    window.gtag("event", event, params ?? {});
  }
}

/** Injects gtag after consent. Idempotent. */
export function loadGa() {
  if (typeof window === "undefined" || !GA_ID) return;
  if (document.getElementById("ga4-script")) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  } as GtagFn;
  window.gtag("js", new Date());
  window.gtag("consent", "update", {
    analytics_storage: "granted",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  window.gtag("config", GA_ID, { anonymize_ip: true, send_page_view: true });
  const s = document.createElement("script");
  s.id = "ga4-script";
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
  document.head.appendChild(s);
}
