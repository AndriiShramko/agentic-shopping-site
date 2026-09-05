"use client";
import { useState } from "react";
import { track, type FunnelEvent } from "@/lib/track";

/** Code block with a real copy button (no fake affordances). */
export default function CopyBlock({ text, label, copied, event = "copy_agent_prompt", id }: { text: string; label: string; copied: string; event?: FunnelEvent; id?: string }) {
  const [ok, setOk] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setOk(true);
      track(event);
      setTimeout(() => setOk(false), 2500);
    } catch {
      // Clipboard blocked: select the text so the user can copy manually
      const el = document.getElementById(id ?? "copy-block");
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  }
  return (
    <div className="relative rounded-xl border border-line bg-bg">
      <pre id={id ?? "copy-block"} className="overflow-x-auto whitespace-pre-wrap break-words p-4 pr-28 text-sm leading-relaxed text-ink">
        {text}
      </pre>
      <button type="button" onClick={copy} className="chip absolute right-3 top-3 rounded-lg border border-border-input bg-surface px-3 text-sm font-medium text-ink hover:border-accent" aria-live="polite">
        {ok ? copied : label}
      </button>
    </div>
  );
}
