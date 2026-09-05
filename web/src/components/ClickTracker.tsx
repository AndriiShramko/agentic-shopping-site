"use client";
import { useEffect } from "react";
import type { Locale } from "@/i18n/routing";
import { rememberLocale } from "@/lib/locale";
import { track, type FunnelEvent } from "@/lib/track";

/**
 * One delegated listener instead of many client islands (keeps hydration cheap):
 *  - <a data-track="event" data-track-params='{"where":"hero"}'>  → funnel event
 *  - <a data-lang="pl">                                          → remember locale + lang_switch
 *  - <details data-faq="3">                                      → faq_open on toggle
 */
export default function ClickTracker() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-track],[data-lang]");
      if (!el) return;
      const lang = el.dataset.lang as Locale | undefined;
      if (lang) {
        rememberLocale(lang);
        track("lang_switch", { to: lang, from: document.documentElement.lang });
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
      track(ev, { href: el.getAttribute("href") ?? undefined, ...params });
    };
    const onToggle = (e: Event) => {
      const d = e.target as HTMLDetailsElement | null;
      if (d?.tagName === "DETAILS" && d.open && d.dataset.faq !== undefined) track("faq_open", { i: Number(d.dataset.faq) });
    };
    document.addEventListener("click", onClick);
    document.addEventListener("toggle", onToggle, true);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("toggle", onToggle, true);
    };
  }, []);
  return null;
}
