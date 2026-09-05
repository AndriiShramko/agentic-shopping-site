"use client";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { LOCALE_NAMES, routing, type Locale } from "@/i18n/routing";
import { rememberLocale, switchLocalePath } from "@/lib/locale";
import { track } from "@/lib/track";

/** Four real links (no fake buttons): each is a full static page in that locale. */
export default function LangSwitcher({ compact = false }: { compact?: boolean }) {
  const locale = useLocale() as Locale;
  const pathname = usePathname() || `/${locale}/`;
  return (
    <nav aria-label="Language" className="flex flex-wrap items-center gap-1">
      {routing.locales.map((l) => {
        const active = l === locale;
        return (
          <a
            key={l}
            href={switchLocalePath(pathname, l)}
            hrefLang={l}
            lang={l}
            aria-current={active ? "page" : undefined}
            data-testid={`lang-${l}`}
            onClick={() => {
              rememberLocale(l);
              track("lang_switch", { from: locale, to: l });
            }}
            className={
              "chip inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium " +
              (active
                ? "border-accent bg-accent/15 text-accent-strong"
                : "border-border-input text-muted hover:border-accent hover:text-ink")
            }
          >
            {compact ? l.toUpperCase() : LOCALE_NAMES[l]}
          </a>
        );
      })}
    </nav>
  );
}
