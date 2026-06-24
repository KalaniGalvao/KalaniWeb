"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { smoothScrollTo } from "@/lib/scroll-store";
import { SITE } from "@/lib/site";

// 3D is decorative + client-only. ssr:false keeps `window`/WebGL off the server
// and out of the first HTML payload; the textual hero below is still SSR'd.
const HeroBlocks = dynamic(() => import("@/components/three/HeroBlocks"), {
  ssr: false,
});

/**
 * Reveals a block of hero copy as the user scrolls: it slides in from the right
 * and fades up across its own [start,end] slice of the hero's scroll progress.
 * Under reduced-motion it renders statically (always visible).
 */
function Reveal({
  progress,
  start,
  end,
  reduce,
  className,
  children,
}: {
  progress: MotionValue<number>;
  start: number;
  end: number;
  reduce: boolean | null;
  className?: string;
  children: React.ReactNode;
}) {
  const opacity = useTransform(progress, [start, end], [0, 1]);
  const x = useTransform(progress, [start, end], [56, 0]);
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div style={{ opacity, x }} className={className}>
      {children}
    </motion.div>
  );
}

export function Hero() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  // Progress runs 0 → 1 across the hero's pinned stretch. On landing (0) only
  // the blocks show; the copy reveals as the user begins to scroll.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const scrimOpacity = useTransform(scrollYProgress, [0, 0.4], [0, 1]);

  return (
    <section
      ref={sectionRef}
      id="inicio"
      aria-labelledby="hero-title"
      // Tall track so the blocks stay pinned (the focus) while the copy reveals.
      className="relative min-h-[160vh]"
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* Decorative WebGL block field — full-bleed, the landing focus. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <HeroBlocks />
        </div>

        {/* Readability scrim on the RIGHT (where the copy lands), fading in with
            the text so the landing view stays pure blocks. */}
        <motion.div
          aria-hidden="true"
          style={{ opacity: reduce ? 1 : scrimOpacity }}
          className="pointer-events-none absolute inset-0 bg-gradient-to-l from-[#070b16] via-[#070b16d9] to-transparent md:via-[#070b1699]"
        />

        <div className="container-rail relative z-10 flex h-full items-center justify-end">
          <div className="max-w-xl text-right">
            <Reveal
              progress={scrollYProgress}
              start={0.08}
              end={0.3}
              reduce={reduce}
            >
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-clay/30 bg-clay/5 px-4 py-1.5 font-mono text-xs uppercase tracking-[0.2em] text-ink-200">
                <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-clay" />
                {SITE.name} · Projetos à medida
              </p>
            </Reveal>

            {/* SEO: the single <h1> of the page — primary keyword target. */}
            <Reveal
              progress={scrollYProgress}
              start={0.14}
              end={0.42}
              reduce={reduce}
            >
              <h1
                id="hero-title"
                className="text-balance text-4xl font-semibold leading-[1.05] tracking-tightest text-ink-100 sm:text-6xl lg:text-7xl"
              >
                Reestruturação Digital{" "}
                <span className="accent-text">
                  feita pensando no seu negócio
                </span>.
              </h1>
            </Reveal>

            <Reveal
              progress={scrollYProgress}
              start={0.22}
              end={0.5}
              reduce={reduce}
            >
              <p className="ml-auto mt-6 max-w-md text-pretty text-lg leading-relaxed text-ink-300 sm:text-xl">
                Faremos uma (re)estruturação digital onde primeiro conversamos
                sobre qual é a sua visão e objetivo, depois trabalhamos juntos para
                representar-lhe da forma correta em um cenário que vai além do
                físico.
              </p>
            </Reveal>

            <Reveal
              progress={scrollYProgress}
              start={0.3}
              end={0.58}
              reduce={reduce}
            >
              <div className="mt-10 flex flex-wrap items-center justify-end gap-4">
                <button
                  type="button"
                  onClick={() => smoothScrollTo("#contato")}
                  className="btn-primary rounded-full px-7 py-3.5 font-medium"
                >
                  Entrar em contato
                </button>
                <button
                  type="button"
                  onClick={() => smoothScrollTo("#segmentos")}
                  className="btn-secondary rounded-full px-7 py-3.5 font-medium"
                >
                  Ver experiências
                </button>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
