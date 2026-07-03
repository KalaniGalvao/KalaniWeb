"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { DEVELOPMENT_WORDS } from "@/lib/site";

/**
 * The narrative "dim" act. As the user scrolls the tall track, an inner sticky
 * panel stays put while the pain-point words appear ONE BY ONE, each in its own
 * spot scattered across the frame (not stacked). Near the end of the track they
 * fade out one by one as the panel leaves frame.
 *
 * Driven by scroll progress (not time) so the in/out is scrubbed to the user's
 * gesture; each word owns its own fade-in and fade-out window.
 */

// Scattered, deliberately asymmetric anchor points (left edge of each phrase,
// vertically centred on `top`). The FIRST word (index 0, first to appear) sits
// on the left; the rest avoid an obvious grid. Long phrases start far enough
// left that they never wrap or run off-screen.
const POSITIONS = [
  { left: "7%", top: "42%" }, // Retenção de atenção — first, left
  { left: "51%", top: "16%" }, // Engajamento
  { left: "17%", top: "27%" }, // Confiança
  { left: "69%", top: "39%" }, // Conversão
  { left: "57%", top: "56%" }, // Credibilidade
  { left: "26%", top: "71%" }, // Visibilidade
  { left: "12%", top: "60%" }, // Relevância
  { left: "53%", top: "86%" }, // Diferenciação
  { left: "10%", top: "91%" }, // Presença
] as const;

function DevWord({
  word,
  index,
  total,
  pos,
  progress,
}: {
  word: string;
  index: number;
  total: number;
  pos: { left: string; top: string };
  progress: MotionValue<number>;
}) {
  // Reveal one by one across the first ~45% of the (tall) track, then hold, then
  // fade out one at a time across the last stretch. Scaled by `total` so it
  // works for any number of words.
  const inStart = (index / total) * 0.45;
  const inEnd = inStart + 0.13;
  const outStart = 0.6 + (index / total) * 0.32;
  const outEnd = outStart + 0.12;

  const opacity = useTransform(
    progress,
    [inStart, inEnd, outStart, outEnd],
    [0, 1, 1, 0],
  );
  const y = useTransform(
    progress,
    [inStart, inEnd, outStart, outEnd],
    [26, 0, 0, -26],
  );
  const blur = useTransform(
    progress,
    [inStart, inEnd, outStart, outEnd],
    [14, 0, 0, 14],
  );
  const filter = useTransform(blur, (b) => `blur(${b}px)`);

  return (
    <li
      className="absolute"
      style={{ left: pos.left, top: pos.top, transform: "translateY(-50%)" }}
    >
      {/* Outer <li> handles vertical centring; inner span handles the animated
          transform so Framer's `y` doesn't fight the centring translate. */}
      <motion.span
        style={{ opacity, y, filter }}
        className="block whitespace-nowrap text-2xl font-bold text-ink-100 sm:text-4xl lg:text-5xl"
      >
        {word}
      </motion.span>
    </li>
  );
}

export function Development() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  return (
    <section
      ref={sectionRef}
      id="desenvolvimento"
      aria-labelledby="dev-heading"
      className="relative min-h-[360vh]"
    >
      {/* SEO: section heading keeps the h1 → h2 hierarchy intact. */}
      <h2 id="dev-heading" className="sr-only">
        O desafio de existir no digital
      </h2>

      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* Spotlight vignette behind the words. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 [background:radial-gradient(60%_55%_at_50%_50%,rgba(201,111,76,0.10),transparent_70%)]"
        />

        <p className="absolute left-1/2 top-16 -translate-x-1/2 font-mono text-xs uppercase tracking-[0.3em] text-clay/80">
          O que resolveremos:
        </p>

        <ul className="absolute inset-0">
          {DEVELOPMENT_WORDS.map((word, i) =>
            reduce ? (
              <li
                key={word}
                className="absolute"
                style={{
                  left: POSITIONS[i].left,
                  top: POSITIONS[i].top,
                  transform: "translateY(-50%)",
                }}
              >
                <span className="block whitespace-nowrap text-2xl font-bold text-ink-100 sm:text-4xl lg:text-5xl">
                  {word}
                </span>
              </li>
            ) : (
              <DevWord
                key={word}
                word={word}
                index={i}
                total={DEVELOPMENT_WORDS.length}
                pos={POSITIONS[i]}
                progress={scrollYProgress}
              />
            ),
          )}
        </ul>
      </div>
    </section>
  );
}
