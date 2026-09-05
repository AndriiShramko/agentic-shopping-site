type Item = { q: string; a: string };

/** Native <details> (works with zero JS); ClickTracker records faq_open via the toggle event. */
export default function Faq({ items }: { items: Item[] }) {
  return (
    <div className="mt-8 divide-y divide-line rounded-2xl border border-line bg-surface">
      {items.map((it, i) => (
        <details key={i} className="group px-5 py-4" data-faq={i}>
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
