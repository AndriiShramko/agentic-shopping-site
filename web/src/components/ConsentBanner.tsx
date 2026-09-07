"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { GA_ID, initGa, setAnalyticsConsent, track } from "@/lib/track";

const KEY = "asa_consent";

/**
 * Cookie banner for GA4 only. Measurement itself never depends on it:
 * the first-party cookieless counter runs for everyone, and GA4 is loaded in
 * Consent Mode "denied" (no identifiers stored) until the visitor accepts.
 */
export default function ConsentBanner() {
  const t = useTranslations("consent");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    initGa();
    if (!GA_ID) return;
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(KEY);
    } catch {
      stored = null;
    }
    if (stored === "yes") setAnalyticsConsent(true);
    else if (stored !== "no") setOpen(true);
  }, []);

  if (!GA_ID || !open) return null;

  const decide = (yes: boolean) => {
    try {
      localStorage.setItem(KEY, yes ? "yes" : "no");
    } catch {
      /* ignore */
    }
    setOpen(false);
    setAnalyticsConsent(yes);
    track(yes ? "consent_accept" : "consent_decline");
  };

  return (
    <div role="dialog" aria-live="polite" aria-label={t("title")} className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl rounded-2xl border border-line bg-surface p-4 shadow-2xl sm:inset-x-auto sm:right-4">
      <p className="text-sm text-muted">
        <strong className="text-ink">{t("title")}</strong> {t("text")}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => decide(false)} className="chip rounded-full border border-border-input px-4 text-sm text-ink hover:border-accent">
          {t("decline")}
        </button>
        <button type="button" onClick={() => decide(true)} className="chip rounded-full bg-accent px-4 text-sm font-semibold text-[#1a0f05] hover:bg-accent-strong">
          {t("accept")}
        </button>
      </div>
    </div>
  );
}
