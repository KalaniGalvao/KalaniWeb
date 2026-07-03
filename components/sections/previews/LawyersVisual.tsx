"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * "The hammer bats the gavel." A gavel swings down and strikes a sound block
 * when the preview scrolls into view, throwing an impact ring — the visual hook
 * for the advocacia (law firm) segment.
 */
export function LawyersVisual() {
  const reduce = useReducedMotion();
  const accent = "#c9a96a";

  return (
    <svg
      viewBox="0 0 400 300"
      className="h-full w-full"
      role="img"
      aria-label="Animação de um martelo de juiz batendo, simbolizando autoridade jurídica"
    >
      <defs>
        <linearGradient id="wood" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#d8b878" />
          <stop offset="100%" stopColor="#9c7a3c" />
        </linearGradient>
      </defs>

      {/* Sound block the gavel strikes. */}
      <rect x="150" y="232" width="100" height="20" rx="4" fill="url(#wood)" />
      <rect x="160" y="252" width="80" height="10" rx="3" fill="#6f5526" />

      {/* Impact ring at the contact point. */}
      <motion.circle
        cx="200"
        cy="232"
        r="40"
        fill="none"
        stroke={accent}
        strokeWidth="3"
        initial={{ scale: 0, opacity: 0 }}
        {...(!reduce && {
          whileInView: { scale: [0, 1.8], opacity: [0.9, 0] },
          transition: { duration: 0.6, delay: 0.6, ease: "easeOut" },
          viewport: { once: true, amount: 0.6 },
        })}
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
      />

      {/* The gavel, pivoting around the elbow at lower-right. */}
      <motion.g
        initial={reduce ? false : { rotate: -36 }}
        {...(!reduce && {
          whileInView: { rotate: [-36, 10, -7, 0] },
          transition: {
            duration: 1.1,
            times: [0, 0.55, 0.8, 1],
            ease: "easeInOut",
          },
          viewport: { once: true, amount: 0.6 },
        })}
        style={{ transformBox: "fill-box", transformOrigin: "78% 86%" }}
      >
        {/* Handle */}
        <rect
          x="196"
          y="120"
          width="18"
          height="120"
          rx="9"
          fill="url(#wood)"
          transform="rotate(38 205 180)"
        />
        {/* Head */}
        <rect
          x="120"
          y="92"
          width="120"
          height="40"
          rx="12"
          fill="url(#wood)"
          transform="rotate(38 180 112)"
        />
        <rect
          x="112"
          y="86"
          width="20"
          height="52"
          rx="6"
          fill="#7a5e2c"
          transform="rotate(38 122 112)"
        />
      </motion.g>
    </svg>
  );
}
