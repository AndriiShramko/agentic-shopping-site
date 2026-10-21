"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { acceptConsent, CONSENT_OPEN_EVENT, GA_ID, loadGa, storedConsent, track, withdrawConsent } from "@/lib/track";

/**
 * GA4 consent banner (T6, Consent Mode basic). Nothing is sent to Google before "Accept":
 * gtag.js is loaded only by acceptConsent() / a stored "yes". "Decline" never loads it.
 * The footer "Cookie settings" button reopens this banner; "Decline" there withdraws consent.
 * Both buttons have the same size, border, fill and weight (equal choice).
 */
export default function ConsentBanner() {
  const t = useTranslations("consent");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!GA_ID) return;
    const stored = storedConsent();
    if (stored === "yes") loadGa();
    else if (stored !== "no") setOpen(true);
    const reopen = () => setOpen(true);
    window.addEventListener(CONSENT_OPEN_EVENT, reopen);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, reopen);
  }, []);

  if (!GA_ID || !open) return null;

  const accept = () => {
    setOpen(false);
    acceptConsent();
    track("consent_accept");
  };
  const decline = () => {
    setOpen(false);
    withdrawConsent();
  };

  const btn = "chip inline-flex min-w-32 items-center justify-center rounded-full border border-accent bg-surface-2 px-5 text-sm font-semibold text-ink hover:bg-accent/15";
  return (
    <div role="dialog" aria-live="polite" aria-label={t("title")} className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl rounded-2xl border border-line bg-surface p-4 shadow-2xl sm:inset-x-auto sm:right-4">
      <p className="text-sm text-muted">
        <strong className="text-ink">{t("title")}</strong> {t("text")}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={decline} className={btn} data-consent="reject">
          {t("decline")}
        </button>
        <button type="button" onClick={accept} className={btn} data-consent="accept">
          {t("accept")}
        </button>
      </div>
    </div>
  );
}
