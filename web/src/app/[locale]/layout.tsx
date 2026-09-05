import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import LangSync from "@/components/LangSync";
import ConsentBanner from "@/components/ConsentBanner";
import ClickTracker from "@/components/ClickTracker";
import { SITE } from "@/config/site";


export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const path = (l: string) => `/${l}/`;
  return {
    metadataBase: new URL(SITE),
    title: t("title"),
    description: t("description"),
    keywords: t("keywords"),
    authors: [{ name: "Andrii Shramko", url: "https://www.linkedin.com/in/andrii-shramko/" }],
    creator: "Andrii Shramko",
    alternates: {
      canonical: path(locale),
      languages: { en: "/en/", es: "/es/", pl: "/pl/", ru: "/ru/", "x-default": "/en/" },
    },
    openGraph: {
      title: t("ogTitle"),
      description: t("ogDescription"),
      url: path(locale),
      siteName: "Agentic Shopping Autopilot",
      type: "website",
      locale: { en: "en_US", es: "es_ES", pl: "pl_PL", ru: "ru_RU" }[locale as Locale],
      images: [{ url: "/og.png", width: 1200, height: 630, alt: t("ogTitle") }],
    },
    twitter: { card: "summary_large_image", title: t("ogTitle"), description: t("ogDescription"), images: ["/og.png"] },
    robots: { index: true, follow: true },
    icons: { icon: "/icon.svg" },
  };
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale as Locale);
  return (
    <NextIntlClientProvider>
      <LangSync locale={locale as Locale} />
      <ClickTracker />
      {children}
      <ConsentBanner />
    </NextIntlClientProvider>
  );
}
