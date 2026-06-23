"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { smoothScrollTo } from "@/lib/scroll-store";

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

export function BeautySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const [activeId, setActiveId] = useState(HAIR_OPTIONS[0].id);
  const [hairColor, setHairColor] = useState(HAIR_COLORS[0].value);
  const [intensity, setIntensity] = useState(70);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [saturation, setSaturation] = useState(120);
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  const activeOption =
    HAIR_OPTIONS.find((option) => option.id === activeId) ?? HAIR_OPTIONS[0];
  const canColorHair = Boolean(activeOption.layerSrc);
  const activeColor =
    HAIR_COLORS.find((c) => c.value === hairColor)?.label ?? "Personalizado";

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobileViewport(query.matches);

    update();

    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", update);
      return () => query.removeEventListener("change", update);
    }

    query.addListener(update);
    return () => query.removeListener(update);
  }, []);

  // Taller track than before → the scroll reveals scrub through more slowly.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
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

  if (isMobileViewport) {
    return (
      <section
        ref={sectionRef}
        id="beleza"
        aria-labelledby="beauty-title"
        className="relative min-h-[100svh] overflow-hidden bg-[#f1ebe3] pb-8 pt-[calc(env(safe-area-inset-top)+6.25rem)] text-[#1b1614]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/beauty-marble-bg.webp"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-white/20"
        />

        <div className="container-rail relative z-10 flex flex-col gap-3">
          <div className={`${GLASS} rounded-[1.75rem] p-2`}>
            <div className="relative h-[44svh] min-h-[19rem] max-h-[25rem] overflow-hidden rounded-[1.35rem] bg-white/18">
              <div className="absolute left-2 top-2 z-20 flex flex-col gap-2">
                {HAIR_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    aria-label={`Visual ${option.label}`}
                    aria-pressed={activeOption.id === option.id}
                    title={option.label}
                    onClick={() => setActiveId(option.id)}
                    className="group relative h-12 w-12 overflow-hidden rounded-full bg-white transition"
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
                      className="h-full w-full object-cover object-[50%_22%]"
                    />
                  </button>
                ))}
              </div>

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
                  className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    activeId === option.id ? "opacity-100" : "opacity-0"
                  }`}
                />
              ))}

              {activeOption.layerSrc && (
                <div
                  aria-hidden="true"
                  style={{
                    ...(hairTintStyle ?? {}),
                    WebkitMaskSize: "cover",
                    maskSize: "cover",
                    WebkitMaskPosition: "center",
                    maskPosition: "center",
                  }}
                  className="absolute inset-0 h-full w-full transition-opacity duration-700"
                />
              )}

              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/45 to-transparent" />
            </div>
          </div>

          <article className={`${GLASS} rounded-[1.75rem] p-5`}>
            <p
              className="font-mono text-[0.68rem] uppercase tracking-[0.26em]"
              style={{ color: ACCENT }}
            >
              Para segmentos de beleza
            </p>
            <h2
              id="beauty-title"
              className="mt-3 text-balance text-3xl font-semibold leading-[1.02] tracking-tightest"
            >
              Troque o visual e veja a transformação.
            </h2>
            <p className="mt-3 text-pretty text-sm leading-6 text-black/62">
              Potencialize salões, clínicas estéticas e marcas de beleza com um
              provador visual simples, rápido e fácil de tocar.
            </p>

            <div className="mt-5 rounded-2xl border border-white/70 bg-white/45 p-4 backdrop-blur">
              <div className="flex items-center justify-between gap-4">
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-black/55">
                  Tom aplicado
                </p>
                <p className="text-xs font-medium" style={{ color: ACCENT }}>
                  {canColorHair ? activeColor : "Escolha um corte"}
                </p>
              </div>

              <div className="mt-4 grid grid-cols-[repeat(7,minmax(0,1fr))] gap-2.5">
                {HAIR_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    aria-label={`Tom ${color.label}`}
                    title={color.label}
                    disabled={!canColorHair}
                    onClick={() => setHairColor(color.value)}
                    className="aspect-square rounded-full transition disabled:cursor-not-allowed disabled:opacity-35"
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
                  onClick={() => setShowAdvanced((value) => !value)}
                  disabled={!canColorHair}
                  aria-label="Roda de cores avançada"
                  title="Roda de cores"
                  className="aspect-square rounded-full border-2 border-white bg-[conic-gradient(from_90deg,#f43f5e,#f97316,#facc15,#22c55e,#06b6d4,#2563eb,#a855f7,#f43f5e)] shadow-[0_0_0_1px_rgba(0,0,0,0.15)] transition disabled:cursor-not-allowed disabled:opacity-35"
                />
              </div>

              <label className="mt-5 block text-sm font-medium text-black/58">
                Intensidade
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={intensity}
                  disabled={!canColorHair}
                  onChange={(event) => setIntensity(Number(event.target.value))}
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
                        className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-white shadow-inner"
                        style={{ backgroundColor: hairColor }}
                        aria-label="Selecionar cor exata"
                      >
                        <input
                          type="color"
                          value={hairColor}
                          disabled={!canColorHair}
                          onChange={(event) => setHairColor(event.target.value)}
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
                        onChange={(event) =>
                          setSaturation(Number(event.target.value))
                        }
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
                        onChange={(event) =>
                          setBrightness(Number(event.target.value))
                        }
                        className="disabled:opacity-35"
                        style={{ accentColor: ACCENT }}
                      />
                    </label>
                  </div>
                </motion.div>
              )}
            </div>

            <button
              type="button"
              onClick={() => smoothScrollTo("#contato")}
              className="mt-5 rounded-full px-6 py-3 text-sm font-medium text-white shadow-lg transition hover:brightness-110"
              style={{ backgroundColor: ACCENT }}
            >
              Quero algo assim
            </button>
          </article>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      id="beleza"
      aria-labelledby="beauty-title"
      className="relative min-h-[100svh] bg-[#07101f] text-[#1b1614] md:min-h-[300vh]"
    >
      <motion.div
        style={{
          opacity: reduce || isMobileViewport ? 1 : sceneOpacity,
          filter: reduce || isMobileViewport ? "none" : sceneFilter,
        }}
        className="relative flex min-h-[100svh] items-start overflow-hidden pb-6 pt-[calc(env(safe-area-inset-top)+6.25rem)] md:sticky md:top-0 md:h-[100svh] md:items-center md:py-0"
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

        <div className="container-rail relative z-10 grid w-full grid-cols-[minmax(0,1.25fr)_minmax(8rem,0.75fr)] items-start gap-2.5 py-0 md:grid-cols-[0.92fr_1.08fr] md:items-center md:gap-8 md:py-16 lg:gap-12">
          {/* ───── Model card (transparent glass, emphasised, integrated) ───── */}
          <BeautyReveal
            progress={scrollYProgress}
            start={0.04}
            end={0.32}
            reduce={reduce || isMobileViewport}
            className="order-1 w-full min-w-0 md:max-w-none"
          >
            <div className={`relative ${GLASS} rounded-[1.35rem] p-1.5 sm:p-6 md:rounded-[2rem]`}>
              <div className="hidden items-center justify-center gap-2 pb-4 md:flex">
                <span className="rounded-full bg-white/70 px-4 py-1.5 text-xs font-medium tracking-wide text-[#1b1614] shadow-sm">
                  Estilo atual:{" "}
                  <span style={{ color: ACCENT }}>{activeOption.label}</span>
                </span>
              </div>

              <div className="relative flex items-stretch gap-3 sm:gap-5">
                {/* Hairstyle picker — circular, vertical. */}
                <div className="absolute left-1.5 top-1.5 z-20 flex flex-col justify-center gap-1.5 sm:gap-3 md:static">
                  {HAIR_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      aria-label={`Visual ${option.label}`}
                      aria-pressed={activeOption.id === option.id}
                      title={option.label}
                      onClick={() => setActiveId(option.id)}
                      className="group relative h-10 w-10 overflow-hidden rounded-full bg-white transition sm:h-[4.25rem] sm:w-[4.25rem]"
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
                <div className="relative mx-auto aspect-[4/5] h-[70svh] max-h-[36rem] w-full flex-1 overflow-hidden rounded-[1.15rem] bg-white/20 md:aspect-[3/4] md:h-auto md:max-h-none md:rounded-[1.5rem] md:bg-gradient-to-b md:from-white/85 md:to-white/35">
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
                      className={`absolute inset-0 h-full w-full object-cover object-bottom transition-opacity duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] md:object-contain ${
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
          <article className={`order-2 h-[70svh] max-h-[36rem] min-w-0 overflow-y-auto ${GLASS} rounded-[1.35rem] p-3 sm:p-10 md:h-auto md:max-h-none md:max-w-none md:overflow-visible md:rounded-[2rem]`}>
            <BeautyReveal
              progress={scrollYProgress}
              start={0.1}
              end={0.32}
              reduce={reduce || isMobileViewport}
            >
              <p
                className="font-mono text-[0.58rem] uppercase tracking-[0.22em] sm:text-xs sm:tracking-[0.3em]"
                style={{ color: ACCENT }}
              >
                Para segmentos de beleza
              </p>
            </BeautyReveal>

            <BeautyReveal
              progress={scrollYProgress}
              start={0.16}
              end={0.42}
              reduce={reduce || isMobileViewport}
            >
              <h2
                id="beauty-title"
                className="mt-2 text-balance text-xl font-semibold leading-[1.04] tracking-tightest sm:mt-4 sm:text-5xl"
              >
                Troque o visual e veja a transformação.
              </h2>
            </BeautyReveal>

            <BeautyReveal
              progress={scrollYProgress}
              start={0.26}
              end={0.52}
              reduce={reduce || isMobileViewport}
            >
              <p className="mt-3 max-w-lg text-pretty text-xs leading-5 text-black/65 sm:mt-5 sm:text-lg sm:leading-7">
                Potencialize salões, clínicas estéticas e marcas de beleza. Mostre
                transformações instantâneas e deixe o cliente visualizar o novo
                visual antes do agendamento.
              </p>
            </BeautyReveal>

            {/* Tone picker (color wheel). */}
            <BeautyReveal
              progress={scrollYProgress}
              start={0.36}
              end={0.6}
              reduce={reduce || isMobileViewport}
            >
              <div className="mt-4 rounded-2xl border border-white/70 bg-white/45 p-3 backdrop-blur sm:mt-7 sm:p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-mono text-[0.56rem] uppercase tracking-[0.18em] text-black/55 sm:text-[0.65rem] sm:tracking-[0.22em]">
                    Tom aplicado
                  </p>
                  <p className="text-[0.62rem] font-medium sm:text-xs" style={{ color: ACCENT }}>
                    {canColorHair ? activeColor : "Escolha um corte"}
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-2.5">
                  {HAIR_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      aria-label={`Tom ${color.label}`}
                      title={color.label}
                      disabled={!canColorHair}
                      onClick={() => setHairColor(color.value)}
                      className="h-7 w-7 rounded-full transition disabled:cursor-not-allowed disabled:opacity-35 sm:h-8 sm:w-8"
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
                    className="relative ml-1 h-7 w-7 rounded-full border-2 border-white bg-[conic-gradient(from_90deg,#f43f5e,#f97316,#facc15,#22c55e,#06b6d4,#2563eb,#a855f7,#f43f5e)] shadow-[0_0_0_1px_rgba(0,0,0,0.15)] transition disabled:cursor-not-allowed disabled:opacity-35 sm:h-8 sm:w-8"
                  />
                </div>

                <label className="mt-3 block text-xs font-medium text-black/55 sm:mt-4">
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
                          className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-white shadow-inner sm:h-16 sm:w-16"
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
              progress={scrollYProgress}
              start={0.5}
              end={0.74}
              reduce={reduce || isMobileViewport}
            >
              <ul className="mt-4 space-y-2 sm:mt-7 sm:space-y-3">
                {[
                  "Provador de visual interativo",
                  "Portfólio que vende sozinho",
                  "Agendamento direto no clique",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-xs font-medium text-[#2b2620] sm:gap-3 sm:text-base"
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-4 w-4 shrink-0 sm:h-5 sm:w-5"
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
              progress={scrollYProgress}
              start={0.62}
              end={0.86}
              reduce={reduce || isMobileViewport}
            >
              <button
                type="button"
                onClick={() => smoothScrollTo("#contato")}
                className="mt-5 rounded-full px-5 py-2.5 text-xs font-medium text-white shadow-lg transition hover:brightness-110 sm:mt-8 sm:px-7 sm:py-3.5 sm:text-base"
                style={{ backgroundColor: ACCENT }}
              >
                Quero algo assim
              </button>
            </BeautyReveal>
          </article>
        </div>
      </motion.div>

      <motion.div
        aria-hidden="true"
        style={{ opacity: reduce || isMobileViewport ? 0 : transitionShade }}
        className="pointer-events-none absolute inset-x-0 top-0 z-30 h-56 bg-gradient-to-b from-[#07101f] via-[#07101fd9] to-transparent"
      />
    </section>
  );
}
