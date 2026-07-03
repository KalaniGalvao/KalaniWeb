"use client";

import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { smoothScrollTo } from "@/lib/scroll-store";
import { WHATSAPP_URL } from "@/lib/site";
import { useIntroProgress } from "@/lib/useIntroProgress";
import { startPageTransition } from "@/lib/viewTransition";

type HairOption = {
  id: string;
  label: string;
  src: string;
  layerSrc?: string;
};

type HairColor = { label: string; value: string };

const HAIR_OPTIONS = [
  { id: "clean", label: "Raspado", src: "/beauty-model-base.webp" },
  {
    id: "curls",
    label: "Cachos volumosos",
    src: "/beauty-hair-curly.webp",
    layerSrc: "/beauty-hair-curls-layer.webp",
  },
  {
    id: "waves",
    label: "Ondas longas",
    src: "/beauty-hair-long.webp",
    layerSrc: "/beauty-hair-long-layer.webp",
  },
  {
    id: "short",
    label: "Curto cacheado",
    src: "/beauty-hair-short.webp",
    layerSrc: "/beauty-hair-short-layer.webp",
  },
] satisfies HairOption[];

const HAIR_COLORS = [
  { label: "Natural profundo", value: "#17120f" },
  { label: "Espresso", value: "#3a241c" },
  { label: "Chocolate", value: "#6a3f2b" },
  { label: "Cobre", value: "#b96537" },
  { label: "Mel", value: "#c99445" },
  { label: "Borgonha", value: "#7b2636" },
] satisfies HairColor[];

const ACCENT = "#c25a7a";
const GLASS =
  "relative rounded-[2rem] border border-white/60 bg-white/[0.035] shadow-[inset_0_1px_0_rgba(255,255,255,0.78),inset_1px_0_0_rgba(255,255,255,0.24),0_35px_85px_-35px_rgba(50,35,40,0.24)] backdrop-blur-[2px] backdrop-saturate-125";

function BeautyReveal({
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
  children: ReactNode;
}) {
  const opacity = useTransform(progress, [start, end], [0, 1]);
  const y = useTransform(progress, [start, end], [46, 0]);
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div style={{ opacity, y }} className={className}>
      {children}
    </motion.div>
  );
}

export function BeautySection({
  ctaHref = "#contato",
  autoPlay = false,
}: {
  /** "#anchor" → smooth-scroll on this page; a path ("/servicos/...") → navigate. */
  ctaHref?: string;
  /** Dedicated-page intro: reveal the studio upfront without scrolling. */
  autoPlay?: boolean;
} = {}) {
  const router = useRouter();
  const goToCta = () =>
    ctaHref.startsWith("#")
      ? smoothScrollTo(ctaHref)
      : startPageTransition(() => router.push(ctaHref), ctaHref);
  const sectionRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const [activeId, setActiveId] = useState(HAIR_OPTIONS[0].id);
  const [hairColor, setHairColor] = useState(HAIR_COLORS[0].value);
  const [intensity, setIntensity] = useState(70);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [saturation, setSaturation] = useState(120);

  const activeOption =
    HAIR_OPTIONS.find((option) => option.id === activeId) ?? HAIR_OPTIONS[0];
  const canColorHair = Boolean(activeOption.layerSrc);
  const activeColor =
    HAIR_COLORS.find((c) => c.value === hairColor)?.label ?? "Personalizado";

  // Taller track than before → the scroll reveals scrub through more slowly.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // First-visit / nav auto-play of the reveals on the main page (2.75s entrance),
  // then scroll takes over. Disabled on the dedicated page (autoPlay) and reduced
  // motion.
  const introProgress = useIntroProgress({
    id: "beleza",
    sectionRef,
    scrollYProgress,
    durationMs: 2750,
    enabled: !reduce && !autoPlay,
  });

  // Doctors -> beauty transition. The marble scene arrives through the same
  // soft blur/fade language used earlier in the narrative instead of cutting
  // directly from the dark anatomy stage to a bright surface.
  const { scrollYProgress: entranceProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "start start"],
  });
  const sceneOpacity = useTransform(
    entranceProgress,
    [0, 0.48, 1],
    [0.08, 0.72, 1],
  );
  const sceneBlur = useTransform(entranceProgress, [0, 1], [18, 0]);
  const sceneFilter = useTransform(sceneBlur, (value) => `blur(${value}px)`);
  const transitionShade = useTransform(
    entranceProgress,
    [0, 0.62, 1],
    [1, 0.62, 0],
  );

  const hairTintStyle: CSSProperties | undefined = activeOption.layerSrc
    ? {
        backgroundColor: hairColor,
        opacity: canColorHair
          ? intensity === 0
            ? 0
            : 0.3 + (intensity / 100) * 0.7
          : 0,
        filter: `saturate(${saturation}%) brightness(${brightness}%)`,
        mixBlendMode: "color",
        WebkitMaskImage: `url(${activeOption.layerSrc})`,
        maskImage: `url(${activeOption.layerSrc})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskPosition: "bottom center",
        maskPosition: "bottom center",
      }
    : undefined;

  return (
    <section
      ref={sectionRef}
      id="beleza"
      aria-labelledby="beauty-title"
      className={`relative min-h-[100svh] bg-[#07101f] text-[#1b1614] ${
        autoPlay ? "md:min-h-[100svh]" : "md:min-h-[300vh]"
      }`}
    >
      <motion.div
        style={{
          opacity: reduce ? 1 : sceneOpacity,
          filter: reduce ? "none" : sceneFilter,
        }}
        className="relative flex min-h-[100svh] items-start overflow-hidden pb-12 pt-[calc(env(safe-area-inset-top)+7rem)] md:sticky md:top-0 md:h-[100svh] md:items-center md:py-0"
      >
        {/* Marble surface — the whole scene sits on it. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/beauty-marble-bg.webp"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Soft light wash so the glass cards read against the stone. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_30%,rgba(255,255,255,0.35),transparent_60%),radial-gradient(circle_at_82%_22%,rgba(194,90,122,0.12),transparent_40%)]"
        />

        <div className="container-rail relative z-10 grid w-full items-start gap-5 py-0 md:grid-cols-[0.92fr_1.08fr] md:items-center md:gap-8 md:py-16 lg:gap-12">
          {/* ───── Model card (transparent glass, emphasised, integrated) ───── */}
          <BeautyReveal
            progress={introProgress}
            start={0.04}
            end={0.32}
            reduce={reduce || autoPlay}
            className="order-1 mx-auto w-full max-w-[22rem] md:max-w-none"
          >
            <div className={`relative ${GLASS} rounded-[1.5rem] p-2 sm:p-6 md:rounded-[2rem]`}>
              <div className="hidden items-center justify-center gap-2 pb-4 md:flex">
                <span className="rounded-full bg-white/70 px-4 py-1.5 text-xs font-medium tracking-wide text-[#1b1614] shadow-sm">
                  Estilo atual:{" "}
                  <span style={{ color: ACCENT }}>{activeOption.label}</span>
                </span>
              </div>

              <div className="relative flex items-stretch gap-3 sm:gap-5">
                {/* Hairstyle picker — circular, vertical. */}
                <div className="absolute left-2 top-2 z-20 flex flex-col justify-center gap-2 sm:gap-3 md:static">
                  {HAIR_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      aria-label={`Visual ${option.label}`}
                      aria-pressed={activeOption.id === option.id}
                      title={option.label}
                      onClick={() => setActiveId(option.id)}
                      className="group relative h-12 w-12 overflow-hidden rounded-full bg-white transition sm:h-[4.25rem] sm:w-[4.25rem]"
                      style={{
                        boxShadow:
                          activeOption.id === option.id
                            ? `0 0 0 2px ${ACCENT}, 0 8px 18px rgba(0,0,0,0.14)`
                            : "0 0 0 1px rgba(0,0,0,0.1)",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={option.src}
                        alt=""
                        className="h-full w-full object-cover object-[50%_22%] transition duration-300 group-hover:scale-105"
                      />
                    </button>
                  ))}
                </div>

                {/* Live model — base + crossfaded hair + recolour layer. */}
                <div className="relative mx-auto aspect-[4/5] h-[42svh] max-h-[22rem] w-full flex-1 overflow-hidden rounded-[1.25rem] bg-white/20 md:aspect-[3/4] md:h-auto md:max-h-none md:rounded-[1.5rem] md:bg-gradient-to-b md:from-white/85 md:to-white/35">
                  {HAIR_OPTIONS.map((option) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={option.id}
                      src={option.src}
                      alt={
                        option.id === activeId
                          ? "Modelo de beleza com visual selecionável"
                          : ""
                      }
                      aria-hidden={option.id !== activeId}
                      draggable={false}
                      className={`absolute inset-0 h-full w-full object-contain object-bottom transition-opacity duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                        activeId === option.id ? "opacity-100" : "opacity-0"
                      }`}
                    />
                  ))}
                  {activeOption.layerSrc && (
                    <div
                      aria-hidden="true"
                      style={hairTintStyle}
                      className="absolute inset-0 h-full w-full transition-opacity duration-700"
                    />
                  )}
                </div>
              </div>
            </div>
          </BeautyReveal>

          {/* ─────────────────── Copy panel (glass) ─────────────────── */}
          <article className={`order-2 mx-auto w-full max-w-[22rem] ${GLASS} rounded-[1.5rem] p-5 sm:p-10 md:max-w-none md:rounded-[2rem]`}>
            <BeautyReveal
              progress={introProgress}
              start={0.1}
              end={0.32}
              reduce={reduce || autoPlay}
            >
              <p
                className="font-mono text-xs uppercase tracking-[0.3em]"
                style={{ color: ACCENT }}
              >
                Para segmentos de beleza
              </p>
            </BeautyReveal>

            <BeautyReveal
              progress={introProgress}
              start={0.16}
              end={0.42}
              reduce={reduce || autoPlay}
            >
              <h2
                id="beauty-title"
                className="mt-4 text-balance text-3xl font-semibold leading-[1.04] tracking-tightest sm:text-5xl"
              >
                Troque o visual e veja a transformação.
              </h2>
            </BeautyReveal>

            <BeautyReveal
              progress={introProgress}
              start={0.26}
              end={0.52}
              reduce={reduce || autoPlay}
            >
              <p className="mt-4 max-w-lg text-pretty text-sm leading-6 text-black/65 sm:mt-5 sm:text-lg sm:leading-7">
                Potencialize salões, clínicas estéticas e marcas de beleza. Mostre
                transformações instantâneas e deixe o cliente visualizar o novo
                visual antes do agendamento.
              </p>
            </BeautyReveal>

            {/* Tone picker (color wheel). */}
            <BeautyReveal
              progress={introProgress}
              start={0.36}
              end={0.6}
              reduce={reduce || autoPlay}
            >
              <div className="mt-5 rounded-2xl border border-white/70 bg-white/45 p-4 backdrop-blur sm:mt-7">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-black/55">
                    Tom aplicado
                  </p>
                  <p className="text-xs font-medium" style={{ color: ACCENT }}>
                    {canColorHair ? activeColor : "Escolha um corte"}
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2.5">
                  {HAIR_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      aria-label={`Tom ${color.label}`}
                      title={color.label}
                      disabled={!canColorHair}
                      onClick={() => setHairColor(color.value)}
                      className="h-8 w-8 rounded-full transition disabled:cursor-not-allowed disabled:opacity-35"
                      style={{
                        backgroundColor: color.value,
                        boxShadow:
                          hairColor === color.value
                            ? `0 0 0 2px ${ACCENT}, 0 0 0 4px #fff`
                            : "0 0 0 1px rgba(0,0,0,0.15)",
                      }}
                    />
                  ))}

                  <button
                    type="button"
                    onClick={() => setShowAdvanced((v) => !v)}
                    disabled={!canColorHair}
                    aria-label="Roda de cores avançada"
                    title="Roda de cores"
                    className="relative ml-1 h-8 w-8 rounded-full border-2 border-white bg-[conic-gradient(from_90deg,#f43f5e,#f97316,#facc15,#22c55e,#06b6d4,#2563eb,#a855f7,#f43f5e)] shadow-[0_0_0_1px_rgba(0,0,0,0.15)] transition disabled:cursor-not-allowed disabled:opacity-35"
                  />
                </div>

                <label className="mt-4 block text-xs font-medium text-black/55">
                  Intensidade
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={intensity}
                    disabled={!canColorHair}
                    onChange={(e) => setIntensity(Number(e.target.value))}
                    className="mt-2 block w-full disabled:opacity-35"
                    style={{ accentColor: ACCENT }}
                  />
                </label>

                {showAdvanced && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 grid gap-3 border-t border-black/10 pt-4">
                      <div className="flex items-center gap-3">
                        <label
                          className="relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-white shadow-inner"
                          style={{ backgroundColor: hairColor }}
                          aria-label="Selecionar cor exata"
                        >
                          <input
                            type="color"
                            value={hairColor}
                            disabled={!canColorHair}
                            onChange={(e) => setHairColor(e.target.value)}
                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                          />
                        </label>
                        <input
                          type="text"
                          value={hairColor}
                          readOnly
                          className="min-w-0 flex-1 rounded-lg border border-black/10 bg-white/70 px-3 py-2 font-mono text-xs uppercase text-black/65"
                        />
                      </div>
                      <label className="grid gap-1.5 text-xs font-medium text-black/55">
                        Saturação
                        <input
                          type="range"
                          min={60}
                          max={180}
                          value={saturation}
                          disabled={!canColorHair}
                          onChange={(e) => setSaturation(Number(e.target.value))}
                          className="disabled:opacity-35"
                          style={{ accentColor: ACCENT }}
                        />
                      </label>
                      <label className="grid gap-1.5 text-xs font-medium text-black/55">
                        Brilho
                        <input
                          type="range"
                          min={70}
                          max={145}
                          value={brightness}
                          disabled={!canColorHair}
                          onChange={(e) => setBrightness(Number(e.target.value))}
                          className="disabled:opacity-35"
                          style={{ accentColor: ACCENT }}
                        />
                      </label>
                    </div>
                  </motion.div>
                )}
              </div>
            </BeautyReveal>

            <BeautyReveal
              progress={introProgress}
              start={0.5}
              end={0.74}
              reduce={reduce || autoPlay}
            >
              <ul className="mt-5 space-y-3 sm:mt-7">
                {[
                  "Provador de visual interativo",
                  "Portfólio que vende sozinho",
                  "Agendamento direto no clique",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 text-sm font-medium text-[#2b2620] sm:text-base"
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-5 w-5 shrink-0"
                      style={{ color: ACCENT }}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </BeautyReveal>

            <BeautyReveal
              progress={introProgress}
              start={0.62}
              end={0.86}
              reduce={reduce || autoPlay}
            >
              <div className="mt-6 flex flex-wrap gap-3 sm:mt-8">
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full px-6 py-3 text-sm font-medium text-white shadow-lg transition hover:brightness-110 sm:px-7 sm:py-3.5 sm:text-base"
                  style={{ backgroundColor: ACCENT }}
                >
                  Começar projeto
                </a>
                <button
                  type="button"
                  onClick={goToCta}
                  className="rounded-full border px-6 py-3 text-sm font-medium text-[#2b2620] transition hover:bg-black/5 sm:px-7 sm:py-3.5 sm:text-base"
                  style={{ borderColor: `${ACCENT}66` }}
                >
                  Saiba mais
                </button>
              </div>
            </BeautyReveal>
          </article>
        </div>
      </motion.div>

      <motion.div
        aria-hidden="true"
        style={{ opacity: reduce ? 0 : transitionShade }}
        className="pointer-events-none absolute inset-x-0 top-0 z-30 h-56 bg-gradient-to-b from-[#07101f] via-[#07101fd9] to-transparent"
      />
    </section>
  );
}
