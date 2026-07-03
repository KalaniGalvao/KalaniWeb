/*
 * Dedicated service landing page — /servicos/{slug}.
 *
 * The HERO reuses the exact immersive component from the homepage segment
 * (scroll-scrubbed video / interactive anatomy / marble hair studio), followed
 * by "Como desenvolvemos + benefícios", "Outros serviços" and the CTA. Pages
 * are statically generated (one per SERVICES entry) and carry per-service SEO.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE, SEGMENTS, SERVICES, getService } from "@/lib/site";
import { JsonLd } from "@/components/seo/JsonLd";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ScrollVideoHero } from "@/components/sections/previews/ScrollVideoHero";
import { HumanAnatomyExplorer } from "@/components/sections/HumanAnatomyExplorer";
import { BeautySection } from "@/components/sections/BeautySection";
import { ServiceApproach } from "@/components/sections/service/ServiceApproach";
import { OtherServices } from "@/components/sections/service/OtherServices";
import { ContactSection } from "@/components/sections/ContactSection";

export function generateStaticParams() {
  return SERVICES.map((service) => ({ slug: service.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const service = getService(params.slug);
  if (!service) return {};
  const url = `${SITE.url}/servicos/${service.slug}`;
  return {
    title: service.metaTitle,
    description: service.metaDescription,
    alternates: { canonical: `/servicos/${service.slug}` },
    openGraph: {
      type: "website",
      url,
      title: `${service.metaTitle} · ${SITE.name}`,
      description: service.metaDescription,
    },
  };
}

/** Reuses the homepage segment component as the page hero. */
function ServiceHero({ slug }: { slug: string }) {
  const service = getService(slug);
  if (!service) return null;

  if (service.hero === "video") {
    const segment = SEGMENTS.find((s) => s.id === service.segmentId);
    if (!segment) return null;
    return (
      <ScrollVideoHero
        segment={segment}
        src={service.videoSrc ?? "/advocacia.mp4"}
        ctaHref="#contato"
        autoPlay
      />
    );
  }

  if (service.hero === "anatomy") {
    const segment = SEGMENTS.find((s) => s.id === service.segmentId);
    if (!segment) return null;
    return <HumanAnatomyExplorer segment={segment} ctaHref="#contato" autoPlay />;
  }

  return <BeautySection ctaHref="#contato" autoPlay />;
}

export default function ServicePage({
  params,
}: {
  params: { slug: string };
}) {
  const service = getService(params.slug);
  if (!service) notFound();

  const serviceLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.metaTitle,
    description: service.metaDescription,
    provider: { "@type": "Organization", name: SITE.legalName },
    areaServed: "BR",
    url: `${SITE.url}/servicos/${service.slug}`,
    isPartOf: { "@type": "WebSite", url: SITE.url, name: SITE.name },
  };

  return (
    <>
      <JsonLd data={serviceLd} />
      <SiteHeader />

      <main id="conteudo">
        {/* Page heading for SEO/a11y; the immersive hero below carries its own
            visual title. */}
        <h1 className="sr-only">{service.page.title}</h1>

        <ServiceHero slug={service.slug} />
        <ServiceApproach service={service} />
        <OtherServices currentSlug={service.slug} />
        {/* CTA — reuse the contact section without its homepage-only cream melt. */}
        <ContactSection showTopMelt={false} />
      </main>
    </>
  );
}
