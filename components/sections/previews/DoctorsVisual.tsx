"use client";

import { motion, useReducedMotion } from "framer-motion";

const ECG =
  "M0 150 L70 150 L95 150 L110 110 L125 195 L145 60 L165 220 L185 150 L235 150 L260 150 L275 120 L290 175 L305 150 L400 150";

/**
 * "Heart rate appears first on a dark background, shedding light." An ECG trace
 * draws across the dark card; as the pulse completes, a glow blooms and reveals
 * the scene — the hook for the saúde (healthcare) segment.
 */
export function DoctorsVisual() {
  const reduce = useReducedMotion();
  const accent = "#54e6b5";

  return (
    <div className="relative h-full w-full bg-[#03110d]">
      {/* Light that the heartbeat "sheds" as it completes. */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background: `radial-gradient(55% 55% at 50% 50%, ${accent}33, transparent 70%)`,
        }}
        initial={{ opacity: reduce ? 0.5 : 0 }}
        {...(!reduce && {
          whileInView: { opacity: 0.6 },
          transition: { duration: 0.8, delay: 1.1 },
          viewport: { once: true, amount: 0.6 },
        })}
      />

      <svg
        viewBox="0 0 400 300"
        className="relative h-full w-full"
        role="img"
        aria-label="Linha de eletrocardiograma sendo desenhada, simbolizando cuidado com a saúde"
      >
        {/* Faint monitor grid. */}
        {Array.from({ length: 9 }).map((_, i) => (
          <line
            key={`v${i}`}
            x1={i * 50}
            y1="0"
            x2={i * 50}
            y2="300"
            stroke={accent}
            strokeOpacity="0.07"
          />
        ))}

        <g transform="translate(0 75)">
          <motion.path
            d={ECG}
            fill="none"
            stroke={accent}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: `drop-shadow(0 0 6px ${accent})` }}
            initial={{ pathLength: reduce ? 1 : 0 }}
            {...(!reduce && {
              whileInView: { pathLength: 1 },
              transition: { duration: 1.4, ease: "easeInOut" },
              viewport: { once: true, amount: 0.6 },
            })}
          />
        </g>
      </svg>
    </div>
  );
}
