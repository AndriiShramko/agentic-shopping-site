import { AUTHOR, REPO, SITE, UPDATED, VERSION } from "@/config/site";

type Faq = { q: string; a: string };

/** Entity clarity for search + answer engines: SoftwareApplication, Person, WebSite, FAQPage. Verified facts only. */
export default function JsonLd({ locale, name, description, faq }: { locale: string; name: string; description: string; faq: Faq[] }) {
  const url = `${SITE}/${locale}/`;
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": `${SITE}/#app`,
        name,
        description,
        url,
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Windows, macOS, Linux",
        softwareVersion: VERSION,
        dateModified: UPDATED,
        license: "https://www.apache.org/licenses/LICENSE-2.0",
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        codeRepository: REPO,
        author: { "@id": `${SITE}/#author` },
        inLanguage: locale,
      },
      {
        "@type": "Person",
        "@id": `${SITE}/#author`,
        name: AUTHOR.name,
        url: AUTHOR.linkedin,
        email: `mailto:${AUTHOR.email}`,
        sameAs: [AUTHOR.linkedin, AUTHOR.github],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE}/#website`,
        url: SITE,
        name,
        inLanguage: ["en", "es", "pl", "ru"],
        author: { "@id": `${SITE}/#author` },
        dateModified: UPDATED,
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />;
}
