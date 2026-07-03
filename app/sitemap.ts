import type { MetadataRoute } from "next";
import { SITE, SERVICES } from "@/lib/site";

// Generates /sitemap.xml: the homepage + one entry per dedicated service page.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    {
      url: SITE.url,
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
    ...SERVICES.map((service) => ({
      url: `${SITE.url}/servicos/${service.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
