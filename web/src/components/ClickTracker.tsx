"use client";
import { useEffect } from "react";
import type { Locale } from "@/i18n/routing";
import { rememberLocale } from "@/lib/locale";
import { hasConsent, track, type FunnelEvent } from "@/lib/track";

/**
 * One delegated listener instead of many client islands (keeps hydration cheap).
 * Everything here is a no-op until the visitor accepted analytics (track() checks consent).
 *  - <a data-track="cta_click" data-track-params='{"cta_id":"hero_install","cta_location":"hero"}'> → funnel event
 *  - <a data-lang="pl">     → remember locale + lang_switch {lang_to} (beacon: a full navigation follows)
 *  - <details data-faq="3"> → faq_open {faq_index}
 *  - main section[id]       → section_view {section_id}, once per section per page
 *  - own JS errors          → exception {description, fatal:false}, max 5 per page
 * No manual page_view: gtag('config') sends exactly one per page load.
 */
export default function ClickTracker() {
  useEffect(() => {
    const marks = [25, 50, 75, 100];
    let sent = 0;
    const onScroll = () => {
      if (!hasConsent()) return;
      const h = document.documentElement;
      const pct = ((h.scrollTop + window.innerHeight) / h.scrollHeight) * 100;
      while (sent < marks.length && pct >= marks[sent]) {
        track("scroll_depth", { percent: marks[sent] });
        sent++;
      }
      if (sent >= marks.length) window.removeEventListener("scroll", onScroll);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-track],[data-lang]");
      if (!el) return;
      const lang = el.dataset.lang as Locale | undefined;
      if (lang) {
        rememberLocale(lang);
        track("lang_switch", { lang_to: lang }, { beacon: true });
        return;
      }
      const ev = el.dataset.track as FunnelEvent | undefined;
      if (!ev) return;
      let params: Record<string, unknown> = {};
      try {
        params = el.dataset.trackParams ? (JSON.parse(el.dataset.trackParams) as Record<string, unknown>) : {};
      } catch {
        /* ignore */
      }
      track(ev, params);
    };
    const onToggle = (e: Event) => {
      const d = e.target as HTMLDetailsElement | null;
      if (d?.tagName === "DETAILS" && d.open && d.dataset.faq !== undefined) track("faq_open", { faq_index: Number(d.dataset.faq) });
    };
    document.addEventListener("click", onClick);
    document.addEventListener("toggle", onToggle, true);

    // section_view: once per section; a tall section counts when it fills half of the viewport
    const seen = new Set<string>();
    let io: IntersectionObserver | undefined;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (entries) => {
          if (!hasConsent()) return;
          for (const en of entries) {
            const id = (en.target as HTMLElement).id;
            if (!en.isIntersecting || !id || seen.has(id)) continue;
            if (en.intersectionRatio < 0.5 && en.intersectionRect.height < window.innerHeight * 0.5) continue;
            seen.add(id);
            track("section_view", { section_id: id.slice(0, 40) });
          }
        },
        { threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] },
      );
      document.querySelectorAll("main section[id]").forEach((s) => io!.observe(s));
    }

    // exception: only errors of this site's own scripts, no URLs in the text
    let errors = 0;
    const report = (msg: unknown) => {
      if (errors >= 5) return;
      errors++;
      track("exception", { description: String(msg || "error").replace(/https?:\/\/\S+/g, "<url>").slice(0, 100), fatal: false });
    };
    const onError = (e: ErrorEvent) => {
      if (!e.filename || !e.filename.startsWith(location.origin)) return;
      report(e.message);
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const r = e.reason as { message?: string } | undefined;
      report(r?.message ?? r);
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick);
      document.removeEventListener("toggle", onToggle, true);
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
      io?.disconnect();
    };
  }, []);
  return null;
}
