"use client";
import { track } from "@/lib/track";

type Item = { q: string; a: string };

/** Native <details> (works with zero JS); the click handler only tracks. */
export default function Faq({ items }: { items: Item[] }) {
  return (
    <div className="mt-8 divide-y divide-line rounded-2xl border border-line bg-surface">
      {items.map((it, i) => (
        <details key={i} className="group px-5 py-4" onToggle={(e) => (e.currentTarget as HTMLDetailsElement).open && track("faq_open", { i })}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-ink">
            <span>{it.q}</span>
            <span aria-hidden="true" className="text-accent transition-transform group-open:rotate-45">
              +
            </span>
          </summary>
          <p className="mt-3 max-w-3xl text-muted">{it.a}</p>
        </details>
      ))}
    </div>
  );
}
