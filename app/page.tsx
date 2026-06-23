/*
 * Homepage — a single-page narrative landing experience.
 *
 * SEO decisions:
 * - One <main id="conteudo"> (skip-link target) with a strict heading outline:
 *     h1 (Hero) → h2 per act (Development, Showcase, Contact) → h3 per segment.
 * - Page-level JSON-LD: WebPage + BreadcrumbList + ItemList of the segment
 *   services. Organization/WebSite schema is emitted site-wide in layout.tsx.
 * - All copy is server-rendered text; the only client-only/JS-gated piece is the
 *   decorative WebGL hero, so the page is fully crawlable without running JS.
 */
import { SITE, SEGMENTS } from "@/lib/site";
import { JsonLd } from "@/components/seo/JsonLd";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { BackgroundFX } from "@/components/BackgroundFX";
import { Hero } from "@/components/sections/Hero";
import { WhatWeDo } from "@/components/sections/WhatWeDo";
import { Development } from "@/components/sections/Development";
import { Showcase } from "@/components/sections/Showcase";
import { ContactSection } from "@/components/sections/ContactSection";
import { InfiniteScrollLoop } from "@/components/sections/InfiniteScrollLoop";

const webPageLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: `${SITE.name} — ${SITE.tagline}`,
  url: SITE.url,
  description: SITE.description,
  inLanguage: "pt-BR",
  isPartOf: { "@type": "WebSite", url: SITE.url, name: SITE.name },
  primaryImageOfPage: {
    "@type": "ImageObject",
    url: `${SITE.url}/opengraph-image`,
  },
};

const breadcrumbLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Início",
      item: SITE.url,
    },
  ],
};

const servicesLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Experiências digitais por segmento",
  itemListElement: SEGMENTS.map((segment, index) => ({
    "@type": "ListItem",
    position: index + 1,
    item: {
      "@type": "Service",
      name: segment.title,
      description: segment.description,
      provider: { "@type": "Organization", name: SITE.legalName },
      url: `${SITE.url}/#${segment.id}`,
    },
  })),
};

export default function HomePage() {
  return (
    <>
      {/* SEO: page-specific structured data (server-rendered into the HTML). */}
      <JsonLd data={webPageLd} />
      <JsonLd data={breadcrumbLd} />
      <JsonLd data={servicesLd} />

      <SiteHeader />
      {/* Drives the seamless, border-less background colour across all sections. */}
      <BackgroundFX />

      <main id="conteudo">
        <Hero />
        <WhatWeDo />
        <Development />
        <Showcase />
        <ContactSection />
        <InfiniteScrollLoop />
      </main>
    </>
  );
}
