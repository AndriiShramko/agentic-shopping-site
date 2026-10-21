"use client";
import { openConsentSettings } from "@/lib/track";

/** Footer link-styled button: reopens the consent banner (change or withdraw the GA4 choice). */
export default function CookieSettingsButton({ label }: { label: string }) {
  return (
    <button type="button" onClick={openConsentSettings} data-consent="settings" className="cursor-pointer underline hover:text-ink">
      {label}
    </button>
  );
}
