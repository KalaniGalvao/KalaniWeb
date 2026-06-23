"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { smoothScrollTo } from "@/lib/scroll-store";
import { SITE } from "@/lib/site";

const DECODER_GLYPHS =
  "ᚠᚢᚦᚨᚱᚲᚷᚹᛃᛈᛉᛏᛒᛖᛗᛚᛟ01<>/{}[]#%&+=?";

type GlyphCell = {
  glyph: string;
  changedAt: number;
};

type TrailPoint = {
  x: number;
  y: number;
  createdAt: number;
};

/**
 * A restrained decoding field that only wakes near a fine pointer. Canvas keeps
 * the rapidly changing characters out of React's render cycle, while the DPR
 * cap and visibility observer keep the effect inexpensive.
 */
function DecoderField({ disabled }: { disabled: boolean | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || disabled) return;

    const section = canvas.parentElement;
    if (!section) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const pointer = { x: 0, y: 0, inside: false, strength: 0 };
    const trail: TrailPoint[] = [];
    const cells = new Map<string, GlyphCell>();
    const spacing = 25;
    const radius = 10;
    const trailLifetime = 1050;
    let frame = 0;
    let visible = true;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let previousFrame = 0;

    const resize = () => {
      const rect = section.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.font = '11px "Geist Mono", ui-monospace, monospace';
    };

    const updatePointer = (event: PointerEvent) => {
      const rect = section.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.inside =
        pointer.x >= 0 &&
        pointer.x <= rect.width &&
        pointer.y >= 0 &&
        pointer.y <= rect.height;

      const now = performance.now();
      const lastPoint = trail[trail.length - 1];
      if (
        pointer.inside &&
        (!lastPoint ||
          Math.hypot(pointer.x - lastPoint.x, pointer.y - lastPoint.y) > 12 ||
          now - lastPoint.createdAt > 42)
      ) {
        trail.push({ x: pointer.x, y: pointer.y, createdAt: now });
        // A hard cap protects performance during very fast, continuous moves.
        if (trail.length > 34) trail.shift();
      }
    };

    const leave = () => {
      pointer.inside = false;
    };

    const draw = (time: number) => {
      frame = requestAnimationFrame(draw);
      if (!visible || time - previousFrame < 32) return;
      previousFrame = time;

      pointer.strength +=
        ((pointer.inside ? 1 : 0) - pointer.strength) * 0.13;
      context.clearRect(0, 0, width, height);

      while (trail.length && time - trail[0].createdAt > trailLifetime) {
        trail.shift();
      }

      const drawInfluence = (
        centerX: number,
        centerY: number,
        strength: number,
        influenceRadius: number,
      ) => {
        if (strength < 0.015) return;
        const startColumn = Math.max(
          0,
          Math.floor((centerX - influenceRadius) / spacing),
        );
        const endColumn = Math.ceil((centerX + influenceRadius) / spacing);
        const startRow = Math.max(
          0,
          Math.floor((centerY - influenceRadius) / spacing),
        );
        const endRow = Math.ceil((centerY + influenceRadius) / spacing);

        for (let row = startRow; row <= endRow; row += 1) {
          for (let column = startColumn; column <= endColumn; column += 1) {
            const x = column * spacing + spacing / 2;
            const y = row * spacing + spacing / 2;
            const distance = Math.hypot(x - centerX, y - centerY);
            if (distance > influenceRadius) continue;

            const proximity = 1 - distance / influenceRadius;
            const eased = proximity * proximity;
            const key = `${column}:${row}`;
            const existing = cells.get(key) ?? { glyph: "", changedAt: 0 };
            const changeInterval = 46 + (1 - proximity) * 230;

            if (!existing.glyph || time - existing.changedAt > changeInterval) {
              existing.glyph =
                DECODER_GLYPHS[
                  Math.floor(Math.random() * DECODER_GLYPHS.length)
                ];
              existing.changedAt = time;
              cells.set(key, existing);
            }

            context.fillStyle = `rgba(244,247,255,${Math.min(
              0.5,
              (0.025 + eased * 0.4) * strength,
            ).toFixed(3)})`;
            context.fillText(existing.glyph, x, y);
          }
        }
      };

      // Older points become dimmer and slightly tighter as they dissolve.
      trail.forEach((point) => {
        const age = Math.min(1, (time - point.createdAt) / trailLifetime);
        const decay = (1 - age) * (1 - age) * 0.42;
        drawInfluence(point.x, point.y, decay, radius * (0.78 + age * 0.08));
      });

      if (pointer.inside || pointer.strength > 0.01) {
        drawInfluence(pointer.x, pointer.y, pointer.strength, radius);
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { rootMargin: "100px" },
    );

    resize();
    observer.observe(section);
    window.addEventListener("resize", resize);
    section.addEventListener("pointermove", updatePointer, { passive: true });
    section.addEventListener("pointerleave", leave);
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", resize);
      section.removeEventListener("pointermove", updatePointer);
      section.removeEventListener("pointerleave", leave);
    };
  }, [disabled]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0"
    />
  );
}

/**
 * Closing act. A bold invitation, then a "back to top" control that smoothly
 * loops the user to the hero — closing the narrative circle the brief asked for.
 */
export function CallToAction() {
  const reduce = useReducedMotion();

  return (
    <section
      id="contato"
      aria-labelledby="cta-heading"
      className="relative flex min-h-[100svh] items-center overflow-hidden bg-black"
    >
      <DecoderField disabled={reduce} />

      {/* Subtle central shade keeps the copy legible while glyphs remain
          strongest in the open space around it. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.7)_0%,rgba(0,0,0,0.18)_45%,transparent_72%)]"
      />

      <motion.div
        initial={reduce ? undefined : { opacity: 0, y: 32 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        viewport={{ once: true, amount: 0.5 }}
        className="container-rail relative z-10 py-20 text-center"
      >
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-clay/80">
          Pronto para começar?
        </p>
        <h2
          id="cta-heading"
          className="mx-auto mt-6 max-w-4xl text-balance text-3xl font-semibold leading-[1.05] tracking-tightest text-ink-100 sm:text-5xl lg:text-6xl"
        >
          Vamos transformar seu negócio em uma{" "}
          <span className="accent-text">experiência inesquecível</span>.
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-pretty text-base text-ink-300 sm:text-lg">
          Conte sua ideia. Devolvemos um protótipo navegável que prova o
          potencial do seu negócio no digital.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a
            href="mailto:contato@kalani.studio"
            className="btn-primary rounded-full px-8 py-4 font-medium"
          >
            Iniciar conversa
          </a>

          {/* The loop: smooth-scroll back to the hero. */}
          <button
            type="button"
            onClick={() => smoothScrollTo("#inicio")}
            className="btn-secondary group inline-flex items-center gap-3 rounded-full px-7 py-4 font-medium"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5 transition-transform group-hover:-translate-y-1"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
            Voltar ao início
          </button>
        </div>

        <p className="mt-16 font-mono text-xs uppercase tracking-[0.25em] text-ink-400">
          {SITE.name} — {SITE.tagline}
        </p>
      </motion.div>
    </section>
  );
}
