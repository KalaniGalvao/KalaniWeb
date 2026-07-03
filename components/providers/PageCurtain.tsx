"use client";

import { useSyncExternalStore } from "react";
import {
  CURTAIN_TIMING,
  getCurtainState,
  getServerCurtainState,
  subscribeCurtain,
  type CurtainTheme,
} from "@/lib/viewTransition";
import { PageCurtainLogo } from "./PageCurtainLogo";

// Near-black panel, faintly tinted toward each page's theme so the reveal feels
// like it belongs to the destination.
const PANEL_BG: Record<CurtainTheme, string> = {
  advocacia: "#05070e",
  saude: "#04100c",
  beleza: "#120610",
  default: "#02030a",
};

/**
 * Full-viewport transition curtain. Driven entirely by the external store in
 * lib/viewTransition.ts: it sweeps up to cover on `cover`/`hold`, then lifts off
 * the top on `reveal`, parking off-screen below while `idle`. Purely decorative
 * (aria-hidden); the route change itself announces the new page.
 */
export function PageCurtain() {
  const { phase, theme } = useSyncExternalStore(
    subscribeCurtain,
    getCurtainState,
    getServerCurtainState,
  );

  const covering = phase === "cover" || phase === "hold";
  const active = phase !== "idle";

  // Parked below when idle → down to cover → up-and-away on reveal.
  const translateY =
    phase === "cover" || phase === "hold"
      ? "0%"
      : phase === "reveal"
        ? "-101%"
        : "101%";

  const duration =
    phase === "cover"
      ? CURTAIN_TIMING.cover
      : phase === "reveal"
        ? CURTAIN_TIMING.reveal
        : 0;

  // Ease-in as it covers (accelerates up), ease-out as it lifts (decelerates).
  const easing =
    phase === "reveal"
      ? "cubic-bezier(0.16, 1, 0.3, 1)"
      : "cubic-bezier(0.7, 0, 0.3, 1)";

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[120] flex items-center justify-center"
      style={{
        backgroundColor: PANEL_BG[theme],
        transform: `translateY(${translateY})`,
        transition: duration ? `transform ${duration}ms ${easing}` : "none",
        pointerEvents: active ? "auto" : "none",
        willChange: "transform",
      }}
    >
      {/* Soft themed glow behind the wordmark. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(60% 40% at 50% 50%, ${PANEL_BG[theme]}00 0%, transparent 70%)`,
          opacity: covering ? 1 : 0,
          transition: "opacity 400ms ease",
        }}
      />
      <PageCurtainLogo theme={theme} visible={covering} />
    </div>
  );
}
