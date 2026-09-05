import { defineRouting } from "next-intl/routing";

// Static export: every locale lives under its own prefix (/en/ /es/ /pl/ /ru/).
// The bare "/" is redirected by nginx from the remembered cookie or Accept-Language.
export const routing = defineRouting({
  locales: ["en", "es", "pl", "ru"],
  defaultLocale: "en",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  es: "Español",
  pl: "Polski",
  ru: "Русский",
};
