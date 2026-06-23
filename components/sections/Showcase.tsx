import { SEGMENTS } from "@/lib/site";
import { ScrollVideoHero } from "./previews/ScrollVideoHero";
import { HumanAnatomyExplorer } from "./HumanAnatomyExplorer";
import { BeautySection } from "./BeautySection";

/**
 * The "content" act: the page brightens and presents the segment hero previews,
 * alternating sides. The development act flows straight into the first hero
 * (advocacia) — no intro block. Server Component; it only composes the (client)
 * preview pieces, so its structure is fully server-rendered.
 */
export function Showcase() {
  return (
    <section id="segmentos" aria-labelledby="segmentos-heading">
      {/* SEO/a11y: section heading preserved in the outline without a visible
          "what we build" intro (per the design — straight into the hero). */}
      <h2 id="segmentos-heading" className="sr-only">
        Experiências sob medida por segmento
      </h2>

      {SEGMENTS.map((segment) => {
        if (segment.id === "advocacia") {
          return (
            <ScrollVideoHero
              key={segment.id}
              segment={segment}
              src="/advocacia.mp4"
            />
          );
        }

        if (segment.id === "saude") {
          return (
            <div key={segment.id}>
              <HumanAnatomyExplorer segment={segment} />
              <BeautySection />
            </div>
          );
        }

        return null;
      })}
    </section>
  );
}
