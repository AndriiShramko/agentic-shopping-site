import type { ReactNode } from "react";
import "@fontsource/unbounded/500.css";
import "@fontsource/unbounded/700.css";
import "@fontsource-variable/onest";
import "./globals.css";

// Root layout MUST live in app/ (build-log 2026-07-12 trap). The html lang attribute is
// "en" at build time and rewritten per locale by scripts/fix-lang.mjs after `next build`
// (static export), plus LangSync on the client for good measure.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
