"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { GA_ID, loadGa, track } from "@/lib/track";

const KEY = "asa_consent";

/**
 * EU consent gate for GA4 (playbook §8, Consent Mode). Nothing loads before "Accept".
 * Rendered only when a GA id is configured — otherwise the site has zero trackers and no banner.
 */
export default function ConsentBanner() {
  const t = useTranslations("consent");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!GA_ID) return;
    try {
      const v = localStorage.getItem(KEY);
      if (v === "yes") loadGa();
      else if (v !== "no") setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  if (!GA_ID || !open) return null;

  const decide = (yes: boolean) => {
    try {
      localStorage.setItem(KEY, yes ? "yes" : "no");
    } catch {
      /* ignore */
    }
    setOpen(false);
    if (yes) {
      loadGa();
      track("consent_accept");
    }
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
