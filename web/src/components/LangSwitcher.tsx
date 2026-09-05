import { LOCALE_NAMES, routing, type Locale } from "@/i18n/routing";

/** Four real links (no fake buttons), server-rendered; ClickTracker sets the cookie and tracks. */
export default function LangSwitcher({ locale, compact = false }: { locale: Locale; compact?: boolean }) {
  return (
    <nav aria-label="Language" className="flex flex-wrap items-center gap-1">
      {routing.locales.map((l) => {
        const active = l === locale;
        return (
          <a
            key={l}
            href={`/${l}/`}
            hrefLang={l}
            lang={l}
            aria-current={active ? "page" : undefined}
            data-testid={`lang-${l}`}
            data-lang={l}
            className={
              "chip inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium " +
              (active ? "border-accent bg-accent/15 text-accent-strong" : "border-border-input text-muted hover:border-accent hover:text-ink")
            }
          >
            {compact ? l.toUpperCase() : LOCALE_NAMES[l]}
          </a>
        );
      })}
    </nav>
  );
}
