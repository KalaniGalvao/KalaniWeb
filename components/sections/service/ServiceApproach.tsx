"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import type { Service } from "@/lib/site";
import { smoothScrollTo } from "@/lib/scroll-store";

/**
 * "O processo + benefícios" — the deep-dive that follows the reused segment hero
 * on each service page. Steps rise in on scroll; benefits are a checked list;
 * everything is tinted with the service accent.
 *
 * Per-service theming:
 *  • advocacia → dark navy (default).
 *  • beleza    → light "marble": the writing sits on the hero's stone.
 *  • saúde     → light "medical": pale bg + white cards with green icon badges,
 *               matching the clinical, evidence-led feel of the medicine hero.
 */

// Card icons for the medical variant, in step order (Conversa / Execução /
// Publicação). Lucide-style: message, clipboard-check, rocket.
const STEP_ICONS: ReactNode[] = [
  <path
    key="chat"
    d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
  />,
  <g key="clip">
    <rect x="8" y="3" width="8" height="4" rx="1" />
    <path d="M16 5h1a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h1" />
    <path d="m9 14 2 2 4-4" />
  </g>,
  <g key="rocket">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
  </g>,
];

export function ServiceApproach({ service }: { service: Service }) {
  const reduce = useReducedMotion();
  const variant: "dark" | "marble" | "med" =
    service.slug === "beleza"
      ? "marble"
      : service.slug === "saude"
        ? "med"
        : "dark";
  const light = variant !== "dark";

  const headingClr = light ? "text-[#12211a]" : "text-ink-100";
  const introClr =
    variant === "marble" ? "text-black/70" : light ? "text-[#42514b]" : "text-ink-300";
  const cardClr =
    variant === "marble"
      ? "border-white/70 bg-white/55 backdrop-blur-sm shadow-[0_24px_60px_-32px_rgba(50,35,40,0.4)]"
      : variant === "med"
        ? "border-black/5 bg-white shadow-[0_18px_50px_-30px_rgba(20,45,32,0.35)]"
        : "border-white/10 bg-[#0a0f1c]/80";
  const cardHeadClr = light ? "text-[#12211a]" : "text-ink-100";
  const cardBodyClr =
    variant === "marble" ? "text-black/65" : light ? "text-[#5b6a63]" : "text-ink-300";
  const dividerClr = light ? "border-black/10" : "border-white/5";
  const benefitClr =
    variant === "marble" ? "text-[#2b2620]" : light ? "text-[#3a4842]" : "text-ink-200";
  // Mint (#54e6b5) is too pale on the light medical bg → use a deeper green for
  // the accent-coloured type/icons there. Other variants keep the segment accent.
  const accentClr = variant === "med" ? "#12a074" : service.accent;

  return (
    <section
      aria-labelledby="approach-title"
      className={`relative overflow-hidden py-24 sm:py-32 ${
        variant === "med"
          ? "bg-[#eef2ef] text-[#12211a]"
          : variant === "marble"
            ? "text-[#1b1614]"
            : "bg-[#070b16]"
      }`}
    >
      {variant === "marble" ? (
        <>
          {/* Continuous marble — the writing sits on the hero's stone. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/beauty-marble-bg.webp"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover object-top"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/70 via-white/45 to-white/70"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(circle at 82% 6%, ${service.accent}1f, transparent 44%)`,
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[#070b16]"
          />
        </>
      ) : variant === "med" ? (
        <>
          {/* Soft clinical wash + faint mint glow. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(circle at 82% 4%, ${service.accent}1a, transparent 46%)`,
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[#070b16]"
          />
        </>
      ) : (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(circle at 12% 0%, ${service.accent}22, transparent 42%)`,
          }}
        />
      )}

      <div className="container-rail relative">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p
              className="font-mono text-xs uppercase tracking-[0.28em]"
              style={{ color: accentClr }}
            >
              O processo:
            </p>
            <h2
              id="approach-title"
              className={`mt-5 max-w-md text-balance text-3xl font-semibold leading-[1.05] tracking-tightest sm:text-4xl lg:text-5xl ${headingClr}`}
            >
              Escuta ativa, conversação e execução
            </h2>
            <p
              className={`mt-6 max-w-md text-pretty text-base leading-7 ${introClr}`}
            >
              {service.page.intro}
            </p>

            {variant === "med" && (
              <button
                type="button"
                onClick={() => smoothScrollTo("#contato")}
                className="mt-8 inline-flex items-center gap-2 rounded-full border border-black/15 px-6 py-3 text-sm font-medium text-[#12211a] transition hover:bg-black/[0.04]"
              >
                Saiba mais sobre o processo
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            )}
          </div>

          <ol className="space-y-4">
            {service.approach.map((step, index) => (
              <motion.li
                key={step.title}
                initial={reduce ? undefined : { opacity: 0, y: 20 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.08,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className={`flex gap-4 rounded-xl border p-6 ${cardClr}`}
              >
                {variant === "med" ? (
                  <>
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#dff5ec] text-[#12a074]">
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        {STEP_ICONS[index % STEP_ICONS.length]}
                      </svg>
                    </span>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span
                          className="font-mono text-xs"
                          style={{ color: accentClr }}
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <h3
                          className={`text-lg font-semibold ${cardHeadClr}`}
                        >
                          {step.title}
                        </h3>
                      </div>
                      <p className={`mt-1.5 text-sm leading-6 ${cardBodyClr}`}>
                        {step.text}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <span
                      className="font-mono text-sm"
                      style={{ color: service.accent }}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className={`text-lg font-semibold ${cardHeadClr}`}>
                        {step.title}
                      </h3>
                      <p className={`mt-2 text-sm leading-6 ${cardBodyClr}`}>
                        {step.text}
                      </p>
                    </div>
                  </>
                )}
              </motion.li>
            ))}
          </ol>
        </div>

        <div className={`mt-16 border-t pt-12 ${dividerClr}`}>
          <p
            className="font-mono text-xs uppercase tracking-[0.28em]"
            style={{ color: accentClr }}
          >
            Benefícios
          </p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {service.benefits.map((benefit) => (
              <li
                key={benefit}
                className={`flex items-center gap-3 text-base ${benefitClr}`}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-5 w-5 shrink-0"
                  style={{ color: accentClr }}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
