"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import type { Segment } from "@/lib/site";
import { smoothScrollTo } from "@/lib/scroll-store";

const group: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};
const rise: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

/**
 * Shared shell for the three segment "hero previews". Visual and copy columns
 * swap sides per `segment.align` (left → right → left) so the eye zig-zags down
 * the page. Each preview is an <article> with its own <h3>, preserving the
 * h1 → h2 → h3 outline for SEO and assistive tech.
 */
export function PreviewLayout({
  segment,
  visual,
}: {
  segment: Segment;
  visual: ReactNode;
}) {
  const reduce = useReducedMotion();
  const visualFirst = segment.align === "right";

  return (
    <article
      id={segment.id}
      aria-labelledby={`${segment.id}-title`}
      className="relative flex min-h-[100svh] items-center py-24"
    >
      <div className="container-rail grid items-center gap-12 md:grid-cols-2 md:gap-16">
        {/* Copy column */}
        <motion.div
          variants={reduce ? undefined : group}
          initial={reduce ? undefined : "hidden"}
          whileInView={reduce ? undefined : "show"}
          viewport={{ once: true, amount: 0.4 }}
          className={visualFirst ? "md:order-2" : "md:order-1"}
        >
          <motion.p
            variants={reduce ? undefined : rise}
            className="mb-4 font-mono text-xs uppercase tracking-[0.25em]"
            style={{ color: segment.accent }}
          >
            {segment.eyebrow}
          </motion.p>
          <motion.h3
            id={`${segment.id}-title`}
            variants={reduce ? undefined : rise}
            className="text-balance text-3xl font-semibold leading-tight tracking-tightest text-ink-100 sm:text-5xl"
          >
            {segment.title}
          </motion.h3>
          <motion.p
            variants={reduce ? undefined : rise}
            className="mt-5 max-w-lg text-pretty text-lg leading-relaxed text-ink-300"
          >
            {segment.description}
          </motion.p>

          <motion.ul
            variants={reduce ? undefined : rise}
            className="mt-8 space-y-3"
          >
            {segment.highlights.map((h) => (
              <li key={h} className="flex items-center gap-3 text-ink-200">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-5 w-5 shrink-0"
                  style={{ color: segment.accent }}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {h}
              </li>
            ))}
          </motion.ul>

          <motion.div variants={reduce ? undefined : rise} className="mt-9">
            <button
              type="button"
              onClick={() => smoothScrollTo("#contato")}
              className="rounded-full border px-6 py-3 font-medium text-ink-100 transition hover:bg-white/5"
              style={{ borderColor: `${segment.accent}66` }}
            >
              Quero algo assim
            </button>
          </motion.div>
        </motion.div>

        {/* Visual column — bespoke per-segment animation. */}
        <div
          className={`relative ${visualFirst ? "md:order-1" : "md:order-2"}`}
        >
          {/* Accent glow bleeding behind the card (border-less depth). */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-10 -z-10 opacity-40 blur-3xl"
            style={{
              background: `radial-gradient(50% 50% at 50% 50%, ${segment.accent}40, transparent 70%)`,
            }}
          />
          <div className="glass relative aspect-[4/3] overflow-hidden rounded-3xl">
            {visual}
          </div>
        </div>
      </div>
    </article>
  );
}
