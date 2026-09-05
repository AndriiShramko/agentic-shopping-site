"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { track } from "@/lib/track";

/**
 * Mobile-only bottom bar (playbook §4 "CTA on every screen"; CRO research: sticky bar only after
 * the hero CTA scrolls away, hidden while the form is on screen). Desktop keeps the header CTA.
 */
export default function StickyCTA() {
  const t = useTranslations("sticky");
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("hero");
    const form = document.getElementById("contact");
    if (!hero || !form) return;
    let heroVisible = true;
    let formVisible = false;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.target === hero) heroVisible = e.isIntersecting;
          if (e.target === form) formVisible = e.isIntersecting;
        }
        setShow(!heroVisible && !formVisible);
      },
      { threshold: 0.05 },
    );
    io.observe(hero);
    io.observe(form);
    return () => io.disconnect();
  }, []);

  return (
    <div
      aria-hidden={!show}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 p-3 backdrop-blur transition-transform sm:hidden ${show ? "translate-y-0" : "translate-y-full"}`}
    >
      <div className="flex items-center gap-3">
        <p className="min-w-0 flex-1 truncate text-sm text-muted">{t("note")}</p>
        <a href="#install" tabIndex={show ? 0 : -1} onClick={() => track("cta_click", { where: "sticky" })} className="inline-flex min-h-11 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-[#1a0f05]">
          {t("cta")}
        </a>
      </div>
    </div>
  );
}
