import type { Locale } from "@/i18n/routing";

export const LANG_COOKIE = "asa_lang";

/** Remember the visitor's explicit choice for a year; nginx reads it on "/" (playbook §1). */
export function rememberLocale(locale: Locale) {
  try {
    document.cookie = `${LANG_COOKIE}=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    localStorage.setItem(LANG_COOKIE, locale);
  } catch {
    /* storage may be blocked — the URL prefix still carries the locale */
  }
}

/** Path of the same page in another locale (static export: /<locale>/...). */
export function switchLocalePath(pathname: string, to: Locale): string {
  const rest = pathname.replace(/^\/(en|es|pl|ru)(?=\/|$)/, "");
  return `/${to}${rest || "/"}`;
}
