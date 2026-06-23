import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// Generates /sitemap.xml. Single-page site → one canonical URL entry.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE.url,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
