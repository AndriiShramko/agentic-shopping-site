import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

export const dynamic = "force-static";

const SITE = "https://agentic-shopping.flyreelstudio.eu";

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(routing.locales.map((l) => [l, `${SITE}/${l}/`]));
  return routing.locales.map((l) => ({
    url: `${SITE}/${l}/`,
    lastModified: new Date("2026-09-05"),
    changeFrequency: "weekly",
    priority: l === "en" ? 1 : 0.8,
    alternates: { languages },
  }));
}
