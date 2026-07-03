"use client";

import type { CurtainTheme } from "@/lib/viewTransition";

/**
 * The BNO wordmark shown on the transition curtain, themed per destination page.
 *
 * ── This is the ONE place to swap in the client-supplied art. ──
 * Drop each theme's asset in /public (e.g. /public/curtain/advocacia.svg) and
 * replace that theme's placeholder below with an <img src="/curtain/…" /> (or a
 * next/image). Everything else — timing, sweep, layering — stays the same.
 */
const ACCENT: Record<CurtainTheme, string> = {
  advocacia: "#c9a96a", // gold
  saude: "#54e6b5", // mint
  beleza: "#c25a7a", // rose
  default: "#c9a96a",
};

const LABEL: Record<CurtainTheme, string> = {
  advocacia: "Advocacia",
  saude: "Medicina",
  beleza: "Beleza",
  default: "Build & Optimize",
};

export function PageCurtainLogo({
  theme,
  visible,
}: {
  theme: CurtainTheme;
  visible: boolean;
}) {
  return (
    <div
      className="flex flex-col items-center gap-3 text-center"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? "translateY(0) scale(1)"
          : "translateY(10px) scale(0.98)",
        transition: visible
          ? "opacity 380ms ease-out 120ms, transform 560ms cubic-bezier(0.16,1,0.3,1) 120ms"
          : "opacity 220ms ease-in, transform 220ms ease-in",
      }}
    >
      <span
        className="font-sans text-6xl font-semibold tracking-tightest sm:text-7xl"
        style={{ color: ACCENT[theme] }}
      >
        BNO<span className="text-white">.</span>
      </span>
      <span className="font-mono text-[0.7rem] uppercase tracking-[0.4em] text-white/55">
        {LABEL[theme]}
      </span>
    </div>
  );
}
