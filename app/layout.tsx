/*
 * SEO decisions for the document shell:
 * - metadataBase makes every canonical/OG URL absolute (required by crawlers).
 * - lang="pt-BR" + alternates.canonical declare language and the canonical URL.
 * - robots: index/follow with max-* directives so Google may show rich previews.
 * - Organization + WebSite JSON-LD live here (site-wide) so they appear on every
 *   route; page-specific schema is injected per-page in app/page.tsx.
 * - Fonts are self-hosted via next/font (no layout shift, no extra DNS) and
 *   exposed as CSS vars consumed by Tailwind's font-sans/font-mono.
 */
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

import { SITE } from "@/lib/site";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { JsonLd } from "@/components/seo/JsonLd";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap", // perf: text paints immediately with fallback, then swaps
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    "experiência digital",
    "site imersivo",
    "animação em scroll",
    "parallax",
    "WebGL",
    "design de sites",
    "landing page",
    "transformação digital",
  ],
  authors: [{ name: SITE.legalName, url: SITE.url }],
  creator: SITE.legalName,
  publisher: SITE.legalName,
  alternates: {
    canonical: "/",
    languages: { "pt-BR": "/" },
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE.url,
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    // Resolved by app/opengraph-image.tsx (dynamically generated 1200×630).
  },
  twitter: {
    card: "summary_large_image",
    site: SITE.twitter,
    creator: SITE.twitter,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "technology",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Match the hero base so mobile browser chrome blends with the page.
  themeColor: "#070b16",
  colorScheme: "dark",
};

const organizationLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE.legalName,
  alternateName: SITE.name,
  url: SITE.url,
  description: SITE.description,
  slogan: SITE.tagline,
  sameAs: [
    "https://www.instagram.com/kalani.studio",
    "https://www.linkedin.com/company/kalani-studio",
  ],
};

const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE.name,
  url: SITE.url,
  inLanguage: "pt-BR",
  publisher: { "@type": "Organization", name: SITE.legalName },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased">
        {/* SEO: site-wide structured data, present on every route. */}
        <JsonLd data={organizationLd} />
        <JsonLd data={websiteLd} />

        {/* a11y: lets keyboard users jump past the nav straight to content. */}
        <a href="#conteudo" className="skip-link">
          Pular para o conteúdo
        </a>

        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
