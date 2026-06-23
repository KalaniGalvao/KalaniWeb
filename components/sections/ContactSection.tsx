"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
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

    const section = canvas.closest("section");
    if (!section) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const pointer = { x: 0, y: 0, inside: false, strength: 0 };
    const trail: TrailPoint[] = [];
    const cells = new Map<string, GlyphCell>();
    const spacing = 25;
    const radius = 72;
    const trailLifetime = 1350;
    let frame = 0;
    let visible = true;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let previousFrame = 0;
    let introWaveStartedAt: number | null = null;

    const startIntroWave = (time: number) => {
      introWaveStartedAt = time;
    };

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
        if (trail.length > 46) trail.shift();
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

            context.fillStyle = `rgba(248,250,255,${Math.min(
              0.78,
              (0.05 + eased * 0.68) * strength,
            ).toFixed(3)})`;
            context.fillText(existing.glyph, x, y);
          }
        }
      };

      // Older points become dimmer and slightly tighter as they dissolve.
      trail.forEach((point) => {
        const age = Math.min(1, (time - point.createdAt) / trailLifetime);
        const decay = (1 - age) * (1 - age) * 0.6;
        drawInfluence(point.x, point.y, decay, radius * (0.78 + age * 0.08));
      });

      if (pointer.inside || pointer.strength > 0.01) {
        drawInfluence(pointer.x, pointer.y, pointer.strength, radius);
      }

      // Intro wave: glyphs remain locked to the same grid used by the hover
      // interaction. Each cell activates when the centre-out wave reaches it,
      // decodes briefly, then fades in place—nothing shoots across the screen.
      if (introWaveStartedAt != null) {
        const elapsed = time - introWaveStartedAt;
        // 2.35s to cross the grid + 1.15s for the final cells to fade.
        // The complete entrance wave therefore lasts exactly 3.5 seconds.
        const spreadDuration = 2350;
        const cellLifetime = 1150;
        const maximumDistance = Math.hypot(width / 2, height / 2);

        if (elapsed > spreadDuration + cellLifetime) {
          introWaveStartedAt = null;
        } else {
          const columns = Math.ceil(width / spacing);
          const rows = Math.ceil(height / spacing);

          for (let row = 0; row <= rows; row += 1) {
            for (let column = 0; column <= columns; column += 1) {
              const x = column * spacing + spacing / 2;
              const y = row * spacing + spacing / 2;
              const distance = Math.hypot(x - width / 2, y - height / 2);
              const arrival =
                (distance / Math.max(1, maximumDistance)) * spreadDuration;
              const localTime = elapsed - arrival;
              if (localTime < 0 || localTime > cellLifetime) continue;

              const fadeIn = Math.min(1, localTime / 200);
              const fadeOut =
                1 - Math.max(0, Math.min(1, (localTime - 330) / 820));
              const strength = fadeIn * fadeOut;
              const key = `${column}:${row}`;
              const existing = cells.get(key) ?? { glyph: "", changedAt: 0 };
              const changeInterval =
                62 + (distance / Math.max(1, maximumDistance)) * 95;

              if (
                !existing.glyph ||
                time - existing.changedAt > changeInterval
              ) {
                existing.glyph =
                  DECODER_GLYPHS[
                    Math.floor(Math.random() * DECODER_GLYPHS.length)
                  ];
                existing.changedAt = time;
                cells.set(key, existing);
              }

              context.fillStyle = `rgba(248,250,255,${(
                strength * 0.48
              ).toFixed(3)})`;
              context.fillText(existing.glyph, x, y);
            }
          }
        }
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { rootMargin: "100px" },
    );

    let contactWasVisible = false;
    const introWaveObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !contactWasVisible) {
          startIntroWave(performance.now());
        }
        contactWasVisible = entry.isIntersecting;
      },
      { threshold: 0.18 },
    );

    resize();
    observer.observe(section);
    introWaveObserver.observe(section);
    window.addEventListener("resize", resize);
    section.addEventListener("pointermove", updatePointer, { passive: true });
    section.addEventListener("pointerleave", leave);
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      introWaveObserver.disconnect();
      window.removeEventListener("resize", resize);
      section.removeEventListener("pointermove", updatePointer);
      section.removeEventListener("pointerleave", leave);
    };
  }, [disabled]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[2]"
    />
  );
}

/**
 * Direct contact section. The restrained layout keeps the contact routes easy
 * to scan while the decoder field supplies the closing visual signature.
 */
export function ContactSection() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress: entranceProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "start start"],
  });
  const sceneOpacity = useTransform(
    entranceProgress,
    [0, 0.48, 1],
    [0.08, 0.72, 1],
  );
  // No whole-scene blur — it read as a smudged/"blurred" section on mobile. The
  // glyph field fades in via opacity and the seam is handled by the edge melt.
  const transitionShade = useTransform(
    entranceProgress,
    [0, 0.62, 1],
    [1, 0.62, 0],
  );

  return (
    <section
      ref={sectionRef}
      id="contato"
      aria-labelledby="contact-heading"
      className="relative flex min-h-[112svh] items-center overflow-hidden bg-black md:min-h-[100svh]"
    >
      <motion.div
        aria-hidden="true"
        style={{ opacity: reduce ? 1 : sceneOpacity }}
        className="pointer-events-none absolute inset-0"
      >
        <DecoderField disabled={reduce} />

        {/* Subtle central shade keeps the copy legible while glyphs remain
            strongest in the open space around it. */}
        <div className="absolute inset-0 z-[1] bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.7)_0%,rgba(0,0,0,0.18)_45%,transparent_72%)]" />
      </motion.div>

      <motion.div
        initial={reduce ? undefined : { opacity: 0, y: 32 }}
        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        viewport={{ once: true, amount: 0.5 }}
        className="container-rail relative z-10 grid items-center gap-12 py-28 text-left md:py-24 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20"
      >
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-clay/80">
            Fale com a Kalani
          </p>
          <h2
            id="contact-heading"
            className="mt-5 text-balance text-4xl font-semibold leading-none tracking-tightest text-ink-100 sm:text-5xl lg:text-6xl"
          >
            Contate-nos<span className="text-clay">.</span>
          </h2>
          <p className="mt-6 max-w-xl text-pretty text-base leading-7 text-ink-300 sm:text-lg">
            Conte o que você deseja construir, melhorar ou transformar. Vamos
            entender o cenário e conversar sobre o próximo passo do projeto.
          </p>
        </div>

        <address className="not-italic">
          <div className="divide-y divide-white/10 border-y border-white/10">
            <a
              href={`mailto:${SITE.email}`}
              className="group flex items-center justify-between gap-6 py-6"
            >
              <span>
                <span className="block font-mono text-[0.65rem] uppercase tracking-[0.24em] text-ink-400">
                  Email
                </span>
                <span className="mt-2 block text-base text-ink-100 sm:text-lg">
                  {SITE.email}
                </span>
              </span>
              <span
                aria-hidden="true"
                className="text-2xl text-clay transition-transform group-hover:translate-x-1"
              >
                ↗
              </span>
            </a>

            <a
              href="https://wa.me/5512997382794"
              target="_blank"
              rel="noreferrer"
              className="group flex items-center justify-between gap-6 py-6"
            >
              <span>
                <span className="block font-mono text-[0.65rem] uppercase tracking-[0.24em] text-ink-400">
                  WhatsApp
                </span>
                <span className="mt-2 block text-base text-ink-100 sm:text-lg">
                  +55 12 99738-2794
                </span>
              </span>
              <span
                aria-hidden="true"
                className="text-2xl text-clay transition-transform group-hover:translate-x-1"
              >
                ↗
              </span>
            </a>

            <a
              href="https://www.instagram.com/kalani.galvao"
              target="_blank"
              rel="noreferrer"
              className="group flex items-center justify-between gap-6 py-6"
            >
              <span>
                <span className="block font-mono text-[0.65rem] uppercase tracking-[0.24em] text-ink-400">
                  Instagram
                </span>
                <span className="mt-2 block text-base text-ink-100 sm:text-lg">
                  @kalani.galvao
                </span>
              </span>
              <span
                aria-hidden="true"
                className="text-2xl text-clay transition-transform group-hover:translate-x-1"
              >
                ↗
              </span>
            </a>
          </div>
          <p className="mt-5 text-sm leading-6 text-ink-400">
            Atendimento remoto para projetos em todo o Brasil.
          </p>
        </address>
      </motion.div>

      {/* Beauty -> contact edge melt. It echoes the anatomy -> beauty blur
          while letting the pale marble dissolve into the black contact scene. */}
      <motion.div
        aria-hidden="true"
        style={{ opacity: reduce ? 0 : transitionShade }}
        className="pointer-events-none absolute inset-x-0 top-0 z-20 h-64 bg-gradient-to-b from-[#eee8e0] via-[#eee8e0cc] to-transparent"
      />
    </section>
  );
}
