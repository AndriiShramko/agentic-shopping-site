import type { ReactNode } from "react";

/** Server-safe layout primitives. No hidden-until-JS patterns. */
export function Section({ id, children, className = "", tone = "plain" }: { id?: string; children: ReactNode; className?: string; tone?: "plain" | "surface" }) {
  return (
    <section id={id} className={`scroll-mt-20 ${tone === "surface" ? "bg-surface/60" : ""} ${className}`}>
      <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">{children}</div>
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="mb-3 text-sm font-medium tracking-wide text-accent">{children}</p>;
}

export function H2({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2 id={id} className="text-3xl font-semibold sm:text-4xl">
      {children}
    </h2>
  );
}

export function Lead({ children }: { children: ReactNode }) {
  return <p className="mt-4 max-w-3xl text-lg text-muted">{children}</p>;
}

export const btnPrimary =
  "inline-flex min-h-12 items-center justify-center rounded-lg bg-accent px-6 text-base font-semibold text-[#1a0f05] hover:bg-accent-strong active:translate-y-px";
export const btnSecondary =
  "inline-flex min-h-12 items-center justify-center rounded-lg border border-border-input px-6 text-base font-semibold text-ink hover:border-accent hover:text-accent-strong";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`min-w-0 max-w-full rounded-2xl border border-line bg-surface p-6 ${className}`}>{children}</div>;
}
