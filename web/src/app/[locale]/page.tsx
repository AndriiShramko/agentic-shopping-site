import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { AUTHOR, REPO, TEST_COUNT, UPDATED, VERSION } from "@/config/site";
import { btnPrimary, btnSecondary, Card, Eyebrow, H2, Lead, Section } from "@/components/kit";
import LangSwitcher from "@/components/LangSwitcher";
import CopyBlock from "@/components/CopyBlock";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import LeadForm from "@/components/LeadForm";
import StickyCTA from "@/components/StickyCTA";
import TrackLink from "@/components/TrackLink";

type Item = { t: string; d: string };
type Step = { k: string; v: string };
type WhyRow = { t: string; p: string; artifact: string };
type Example = { request: string; found: string; bought: string; notAsked: string; status: string };
type CompareRow = { name: string; cells: string[]; highlight?: boolean };
type FaqItem = { q: string; a: string };

function Mono({ text, className = "" }: { text: string; className?: string }) {
  return <pre className={`min-w-0 max-w-full overflow-x-auto whitespace-pre rounded-xl border border-line bg-bg p-4 text-[13px] leading-relaxed text-ink ${className}`}>{text}</pre>;
}

function Page({ locale }: { locale: string }) {
  const t = useTranslations();
  const controlItems = t.raw("control.items") as Item[];
  const flowSteps = t.raw("flow.steps") as Step[];
  const flowNot = t.raw("flow.not") as string[];
  const flowCaveats = t.raw("flow.caveats") as string[];
  const whyRows = t.raw("why.rows") as WhyRow[];
  const examples = t.raw("examples.items") as Example[];
  const howSteps = t.raw("how.steps") as Item[];
  const guardRows = t.raw("guard.rows") as WhyRow[];
  const compareCols = t.raw("compare.cols") as string[];
  const compareRows = t.raw("compare.rows") as CompareRow[];
  const humanSteps = t.raw("install.humansSteps") as string[];
  const warnings = t.raw("warnings.items") as string[];
  const faq = t.raw("faq.items") as FaqItem[];
  const aboutBullets = t.raw("about.bullets") as string[];
  const shareItems = t.raw("share.items") as string[];
  const privacy = t.raw("footer.privacy") as string[];

  const anchors: [string, string][] = [
    ["#flow", t("flow.eyebrow")],
    ["#examples", t("examples.eyebrow")],
    ["#guard", t("guard.eyebrow")],
    ["#install", t("nav.install")],
    ["#warnings", t("warnings.eyebrow")],
    ["#faq", "FAQ"],
  ];

  return (
    <>
      <JsonLd locale={locale} name={t("meta.ogTitle")} description={t("meta.description")} faq={faq} />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-[#1a0f05]">
        {t("nav.skip")}
      </a>

      <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <a href={`/${locale}/`} className="flex items-center gap-2 font-semibold">
            <span aria-hidden="true" className="inline-block h-3 w-3 rounded-full bg-ok" />
            <span className="font-display text-sm sm:text-base">
              <span className="sm:hidden">ASA</span>
              <span className="hidden sm:inline">Agentic Shopping Autopilot</span>
            </span>
          </a>
          <nav aria-label="Primary" className="flex items-center gap-2 sm:gap-4">
            <TrackLink href={REPO} event="github_click" className="hidden text-sm text-muted hover:text-ink md:inline">
              {t("nav.github")}
            </TrackLink>
            <a href="#install" className="hidden text-sm text-muted hover:text-ink md:inline">
              {t("nav.install")}
            </a>
            <TrackLink href="#contact" event="cta_click" params={{ where: "header" }} className="inline-flex min-h-10 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-[#1a0f05] hover:bg-accent-strong">
              {t("nav.contact")}
            </TrackLink>
            <div className="hidden lg:block">
              <LangSwitcher compact />
            </div>
          </nav>
        </div>
        <div className="border-t border-line/60 lg:hidden">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 overflow-x-auto px-5 py-2 sm:px-8">
            <LangSwitcher compact />
            <ul className="hidden gap-4 text-xs text-muted sm:flex">
              {anchors.map(([href, label]) => (
                <li key={href}>
                  <a href={href} className="whitespace-nowrap hover:text-ink">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </header>

      <main id="main">
        {/* 1 HERO */}
        <section id="hero" className="glow">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 pb-16 pt-14 sm:px-8 sm:pt-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="rise">
              <Eyebrow>{t("hero.eyebrow")}</Eyebrow>
              <h1 className="text-4xl font-semibold sm:text-5xl lg:text-[3.6rem]">{t("hero.h1")}</h1>
              <p className="mt-6 max-w-xl text-lg text-muted sm:text-xl">{t("hero.sub")}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <TrackLink href="#install" event="cta_click" params={{ where: "hero" }} className={btnPrimary}>
                  {t("hero.ctaPrimary")}
                </TrackLink>
                <TrackLink href={REPO} event="github_click" className={btnSecondary}>
                  {t("hero.ctaSecondary")}
                </TrackLink>
              </div>
              <p className="mt-6 text-sm text-muted">{t("hero.updated", { date: UPDATED, version: VERSION, testCount: TEST_COUNT })}</p>
            </div>
            <figure className="receipt rounded-2xl p-5 sm:p-6" aria-label={t("hero.receipt.title")}>
              <div className="flex items-center justify-between gap-3">
                <p className="font-display text-sm font-semibold text-ok">{t("hero.receipt.title")}</p>
                <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-ok" />
              </div>
              <pre className="mt-4 hidden overflow-x-auto whitespace-pre text-[13px] leading-relaxed text-ink sm:block">{t("hero.receipt.desktop")}</pre>
              <pre className="mt-4 overflow-x-auto whitespace-pre text-[13px] leading-relaxed text-ink sm:hidden">{t("hero.receipt.mobile")}</pre>
              <figcaption className="mt-4 text-xs text-muted">{t("hero.receipt.caption")}</figcaption>
            </figure>
          </div>
        </section>

        {/* CONTROL STRIP */}
        <Section id="control" tone="surface" className="border-y border-line">
          <h2 className="sr-only">{t("control.title")}</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {controlItems.map((it, i) => (
              <li key={i} className="rounded-xl border border-line bg-bg p-4">
                <p className="font-semibold">{it.t}</p>
                <p className="mt-1 text-sm text-muted">{it.d}</p>
              </li>
            ))}
          </ul>
        </Section>

        {/* 2 FLOW — what actually happened */}
        <Section id="flow">
          <Eyebrow>{t("flow.eyebrow")}</Eyebrow>
          <H2>{t("flow.title")}</H2>
          <Lead>{t("flow.lead")}</Lead>
          <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <ol className="relative border-l border-line pl-6">
              {flowSteps.map((s, i) => (
                <li key={i} className="relative pb-6 last:pb-0">
                  <span aria-hidden="true" className={`absolute -left-[31px] top-1.5 h-3 w-3 rounded-full ${i === flowSteps.length - 1 ? "bg-ok" : "bg-accent"}`} />
                  <p className="font-mono text-xs uppercase tracking-wide text-accent">
                    {String(i + 1).padStart(2, "0")} · {s.k}
                  </p>
                  <p className="mt-1 text-muted">{s.v}</p>
                </li>
              ))}
            </ol>
            <div className="space-y-6">
              <Card>
                <h3 className="font-semibold text-ok">{t("flow.notTitle")}</h3>
                <ul className="mt-3 space-y-2 text-sm text-muted">
                  {flowNot.map((n, i) => (
                    <li key={i}>— {n}</li>
                  ))}
                </ul>
              </Card>
              <Card>
                <h3 className="font-semibold text-accent">{t("flow.caveatsTitle")}</h3>
                <ul className="mt-3 space-y-2 text-sm text-muted">
                  {flowCaveats.map((n, i) => (
                    <li key={i}>— {n}</li>
                  ))}
                </ul>
              </Card>
              <a href="#install" className="inline-flex text-sm font-medium text-accent-strong underline">
                {t("flow.cta")}
              </a>
            </div>
          </div>
        </Section>

        {/* 3 WHY */}
        <Section id="why" tone="surface" className="border-y border-line">
          <Eyebrow>{t("why.eyebrow")}</Eyebrow>
          <H2>{t("why.title")}</H2>
          <Lead>{t("why.lead")}</Lead>
          <div className="mt-10 space-y-8">
            {whyRows.map((r, i) => (
              <div key={i} className="grid gap-5 lg:grid-cols-2 lg:items-center">
                <div>
                  <h3 className="text-xl font-semibold">{r.t}</h3>
                  <p className="mt-2 text-muted">{r.p}</p>
                </div>
                <Mono text={r.artifact} />
              </div>
            ))}
          </div>
          <div className="mt-10">
            <TrackLink href="#install" event="cta_click" params={{ where: "why" }} className={btnPrimary}>
              {t("why.cta")}
            </TrackLink>
          </div>
        </Section>

        {/* 4 EXAMPLES */}
        <Section id="examples">
          <Eyebrow>{t("examples.eyebrow")}</Eyebrow>
          <H2>{t("examples.title")}</H2>
          <Lead>{t("examples.lead")}</Lead>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {examples.map((ex, i) => (
              <Card key={i} className="flex flex-col gap-3">
                <p className="font-display text-lg font-semibold text-ink">“{ex.request}”</p>
                <p className="text-sm">
                  <span className="text-accent">{t("examples.labels.found")}</span> <span className="text-muted">{ex.found}</span>
                </p>
                <p className="text-sm">
                  <span className="text-ok">{t("examples.labels.bought")}</span> <span className="text-muted">{ex.bought}</span>
                </p>
                <p className="text-sm">
                  <span className="text-danger">{t("examples.labels.notAsked")}</span> <span className="text-muted">{ex.notAsked}</span>
                </p>
                <p className="mt-auto pt-2 text-xs text-muted">
                  {t("examples.labels.status")} {ex.status}
                </p>
              </Card>
            ))}
          </div>
          <p className="mt-6 max-w-3xl text-sm text-muted">{t("examples.note")}</p>
        </Section>

        {/* HOW */}
        <Section id="how" tone="surface" className="border-y border-line">
          <Eyebrow>{t("how.eyebrow")}</Eyebrow>
          <H2>{t("how.title")}</H2>
          <Lead>{t("how.lead")}</Lead>
          <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {howSteps.map((s, i) => (
              <li key={i} className="rounded-xl border border-line bg-bg p-5">
                <p className="font-mono text-xs text-accent">{String(i + 1).padStart(2, "0")}</p>
                <p className="mt-2 font-semibold">{s.t}</p>
                <p className="mt-1 text-sm text-muted">{s.d}</p>
              </li>
            ))}
          </ol>
          <p className="mt-8 max-w-3xl text-sm text-muted">{t("how.human")}</p>
        </Section>

        {/* 5 GUARD — you stay in control */}
        <Section id="guard">
          <Eyebrow>{t("guard.eyebrow")}</Eyebrow>
          <H2>{t("guard.title")}</H2>
          <Lead>{t("guard.lead")}</Lead>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {guardRows.map((r, i) => (
              <Card key={i}>
                <h3 className="font-semibold">{r.t}</h3>
                <p className="mt-2 text-sm text-muted">{r.p}</p>
                {r.artifact ? <Mono text={r.artifact} className="mt-3" /> : null}
              </Card>
            ))}
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-muted">{t("guard.mandateTitle")}</h3>
              <Mono text={t("guard.mandate")} className="mt-2" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-muted">{t("guard.approvalTitle")}</h3>
              <Mono text={t("guard.approval")} className="mt-2 whitespace-pre-wrap" />
            </div>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <TrackLink href="#install" event="cta_click" params={{ where: "guard" }} className={btnPrimary}>
              {t("guard.cta")}
            </TrackLink>
            <TrackLink href={`${REPO}/blob/main/SECURITY.md`} event="github_click" className="text-sm underline hover:text-ink">
              {t("guard.link")}
            </TrackLink>
          </div>
        </Section>

        {/* 6 INSTALL */}
        <Section id="install" tone="surface" className="border-y border-line">
          <Eyebrow>{t("install.eyebrow")}</Eyebrow>
          <H2>{t("install.title")}</H2>
          <Lead>{t("install.lead")}</Lead>
          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            <Card>
              <h3 className="text-xl font-semibold">{t("install.humansTitle")}</h3>
              <p className="mt-2 text-sm text-muted">{t("install.humansLead")}</p>
              <div className="mt-4">
                <CopyBlock id="copy-commands" text={t("install.commands")} label={t("install.copy")} copied={t("install.copied")} event="copy_agent_prompt" />
              </div>
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-muted">
                {humanSteps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
              <p className="mt-3 text-sm">
                <TrackLink href={`${REPO}#quickstart-for-humans`} event="github_click" className="underline hover:text-ink">
                  {t("install.humansLink")}
                </TrackLink>
              </p>
            </Card>
            <Card className="border-accent/50">
              <h3 className="text-xl font-semibold">{t("install.agentsTitle")}</h3>
              <p className="mt-2 text-sm text-muted">{t("install.agentsLead")}</p>
              <div className="mt-4">
                <CopyBlock id="copy-prompt" text={t("install.prompt")} label={t("install.copy")} copied={t("install.copied")} />
              </div>
              <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <li>
                  <TrackLink href={`${REPO}/blob/main/AGENT_SETUP.md`} event="github_click" className="underline hover:text-ink">
                    AGENT_SETUP.md
                  </TrackLink>
                </li>
                <li>
                  <TrackLink href={`${REPO}/blob/main/AGENTS.md`} event="github_click" className="underline hover:text-ink">
                    AGENTS.md
                  </TrackLink>
                </li>
                <li>
                  <TrackLink href={`${REPO}/blob/main/skills/allegro.pl/SKILL.md`} event="github_click" className="underline hover:text-ink">
                    SKILL.md
                  </TrackLink>
                </li>
                <li>
                  <a href="/llms.txt" className="underline hover:text-ink">
                    llms.txt
                  </a>
                </li>
              </ul>
              <p className="mt-4 text-sm text-muted">{t("install.agentsNote")}</p>
            </Card>
          </div>
          <p className="mt-8 max-w-3xl text-sm text-muted">{t("install.update")}</p>
        </Section>

        {/* 7 WARNINGS */}
        <Section id="warnings">
          <Eyebrow>{t("warnings.eyebrow")}</Eyebrow>
          <H2>{t("warnings.title")}</H2>
          <Lead>{t("warnings.lead")}</Lead>
          <ol className="mt-8 grid gap-3 md:grid-cols-2">
            {warnings.map((w, i) => (
              <li key={i} className="rounded-xl border border-danger/30 bg-surface p-4 text-sm text-muted">
                <span className="mr-2 font-mono text-xs text-danger">{String(i + 1).padStart(2, "0")}</span>
                {w}
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <TrackLink href="#install" event="cta_click" params={{ where: "warnings" }} className={btnPrimary}>
              {t("warnings.cta")}
            </TrackLink>
            <p className="text-sm text-muted">
              <TrackLink href={`${REPO}/blob/main/docs/warnings.md`} event="github_click" className="underline hover:text-ink">
                {t("warnings.link")}
              </TrackLink>
              {" · "}
              <TrackLink href={`${REPO}/blob/main/SECURITY.md`} event="github_click" className="underline hover:text-ink">
                {t("warnings.security")}
              </TrackLink>
            </p>
          </div>
        </Section>

        {/* 9 COMPARE */}
        <Section id="compare" tone="surface" className="border-y border-line">
          <Eyebrow>{t("compare.eyebrow")}</Eyebrow>
          <H2>{t("compare.title")}</H2>
          <Lead>{t("compare.lead")}</Lead>
          <div className="mt-8 overflow-x-auto rounded-2xl border border-line">
            <table className="w-full min-w-[900px] border-collapse text-sm">
              <thead className="bg-surface">
                <tr>
                  {compareCols.map((c, i) => (
                    <th key={i} scope="col" className={`px-4 py-3 text-left font-semibold text-ink ${i === 0 ? "sticky left-0 bg-surface" : ""}`}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compareRows.map((r, i) => (
                  <tr key={i} className={`border-t border-line ${r.highlight ? "bg-accent/10" : ""}`}>
                    <th scope="row" className={`sticky left-0 px-4 py-3 text-left font-semibold text-ink ${r.highlight ? "bg-[#1f160f]" : "bg-bg"}`}>
                      {r.name}
                    </th>
                    {r.cells.map((c, j) => (
                      <td key={j} className="px-4 py-3 text-muted">
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 max-w-3xl text-sm text-muted">
            {t("compare.note")}{" "}
            <TrackLink href={`${REPO}/blob/main/docs/landscape.md`} event="github_click" className="underline hover:text-ink">
              {t("compare.link")}
            </TrackLink>
          </p>
        </Section>

        {/* 10 FAQ */}
        <Section id="faq">
          <H2>{t("faq.title")}</H2>
          <Faq items={faq} />
          <p className="mt-6 text-sm">
            <a href="#contact" className="underline hover:text-accent-strong">
              {t("faq.cta")}
            </a>
          </p>
        </Section>

        {/* 11 ABOUT + FORM */}
        <Section id="about" tone="surface" className="border-y border-line">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <Eyebrow>{t("about.eyebrow")}</Eyebrow>
              <H2>{t("about.title")}</H2>
              <p className="mt-4 text-muted">{t("about.text")}</p>
              <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted">
                {aboutBullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
              <p className="mt-6 text-lg font-semibold text-ink">{t("about.collab")}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <TrackLink href={AUTHOR.calendar} event="cta_click" params={{ where: "about-calendar" }} className={btnPrimary}>
                  {t("about.cta")}
                </TrackLink>
                <a href="#contact" className={btnSecondary}>
                  {t("about.ctaForm")}
                </a>
              </div>
              <dl className="mt-8 grid gap-2 text-sm">
                <div className="flex gap-3">
                  <dt className="w-28 shrink-0 text-muted">{t("about.links.author")}</dt>
                  <dd>{AUTHOR.name}</dd>
                </div>
                <div className="flex gap-3">
                  <dt className="w-28 shrink-0 text-muted">LinkedIn</dt>
                  <dd>
                    <a href={AUTHOR.linkedin} className="break-all underline hover:text-accent-strong" rel="me">
                      linkedin.com/in/andrii-shramko
                    </a>
                  </dd>
                </div>
                <div className="flex gap-3">
                  <dt className="w-28 shrink-0 text-muted">{t("about.links.calendar")}</dt>
                  <dd>
                    <a href={AUTHOR.calendar} className="break-all underline hover:text-accent-strong">
                      calendar.app.google/Ff729HqGk4RpzPNDA
                    </a>
                  </dd>
                </div>
                <div className="flex gap-3">
                  <dt className="w-28 shrink-0 text-muted">Email</dt>
                  <dd>
                    <a href={`mailto:${AUTHOR.email}`} className="underline hover:text-accent-strong">
                      {AUTHOR.email}
                    </a>
                  </dd>
                </div>
                <div className="flex gap-3">
                  <dt className="w-28 shrink-0 text-muted">GitHub</dt>
                  <dd>
                    <a href={AUTHOR.github} className="underline hover:text-accent-strong" rel="me">
                      github.com/AndriiShramko
                    </a>
                  </dd>
                </div>
              </dl>
            </div>
            <div id="contact" className="scroll-mt-24">
              <Eyebrow>{t("form.eyebrow")}</Eyebrow>
              <H2>{t("form.title")}</H2>
              <p className="mt-3 text-muted">{t("form.lead")}</p>
              <div className="mt-6">
                <LeadForm />
              </div>
            </div>
          </div>
        </Section>

        {/* 12 SHARE */}
        <Section id="share">
          <H2>{t("share.title")}</H2>
          <ul className="mt-6 grid gap-3 md:grid-cols-2">
            {shareItems.map((s, i) => (
              <li key={i} className="rounded-xl border border-line bg-surface p-4 text-sm text-muted">
                {s}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <TrackLink href={`${REPO}/issues`} event="github_click" className={btnSecondary}>
              {t("share.issue")}
            </TrackLink>
            <TrackLink href={`${REPO}/blob/main/CONTRIBUTING.md`} event="github_click" className={btnSecondary}>
              {t("share.contrib")}
            </TrackLink>
          </div>
        </Section>
      </main>

      <footer className="border-t border-line bg-surface/60">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
          <details id="privacy" className="scroll-mt-24 text-sm text-muted">
            <summary className="cursor-pointer font-semibold text-ink">{t("footer.privacyTitle")}</summary>
            <div className="mt-3 max-w-3xl space-y-2">
              {privacy.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </details>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">
              © 2026 {AUTHOR.name} · {t("footer.license")} · {t("footer.updated", { date: UPDATED })}
            </p>
            <LangSwitcher />
          </div>
          <p className="mt-4 text-sm text-muted">
            <TrackLink href={REPO} event="github_click" className="underline hover:text-ink">
              GitHub
            </TrackLink>
            {" · "}
            <TrackLink href={`${REPO}/blob/main/CHANGELOG.md`} event="github_click" className="underline hover:text-ink">
              Changelog
            </TrackLink>
            {" · "}
            <a href="/llms.txt" className="underline hover:text-ink">
              llms.txt
            </a>
            {" · "}
            <a href="/sitemap.xml" className="underline hover:text-ink">
              sitemap
            </a>
          </p>
        </div>
      </footer>
      <StickyCTA />
    </>
  );
}

export default async function LocalePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Page locale={locale} />;
}
