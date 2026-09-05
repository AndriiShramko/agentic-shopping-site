"use client";
import type { ReactNode } from "react";
import { track, type FunnelEvent } from "@/lib/track";

/** Real link that also records a funnel event. External links open in a new tab. */
export default function TrackLink({ href, event, params, className, children }: { href: string; event: FunnelEvent; params?: Record<string, unknown>; className?: string; children: ReactNode }) {
  const external = /^https?:\/\//.test(href);
  return (
    <a href={href} className={className} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} onClick={() => track(event, { href, ...(params ?? {}) })}>
      {children}
    </a>
  );
}
