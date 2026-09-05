import type { ReactNode } from "react";
import type { FunnelEvent } from "@/lib/track";

/** Server-rendered real link; ClickTracker (one delegated listener) records the funnel event. */
export default function TrackLink({ href, event, params, className, children }: { href: string; event: FunnelEvent; params?: Record<string, unknown>; className?: string; children: ReactNode }) {
  const external = /^https?:\/\//.test(href);
  return (
    <a href={href} className={className} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} data-track={event} data-track-params={params ? JSON.stringify(params) : undefined}>
      {children}
    </a>
  );
}
