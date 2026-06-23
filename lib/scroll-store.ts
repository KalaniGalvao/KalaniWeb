import type Lenis from "lenis";

/**
 * Frame-loop scroll state shared between Lenis (writer) and the R3F render loop
 * (reader). It is a plain mutable singleton on purpose: the 3D hero reads it
 * every frame in `useFrame`, and routing this through React state would trigger
 * a re-render per scroll tick. Mutating an object keeps it at 60fps.
 */
export const scrollStore = {
  /** Absolute scroll offset in px. */
  scrollY: 0,
  /** Whole-document progress, 0 (top) → 1 (bottom). */
  progress: 0,
  /** Scroll velocity from Lenis; feeds extra "kick" into the wave shader. */
  velocity: 0,
  /** Active Lenis instance (null under reduced-motion / before mount). */
  lenis: null as Lenis | null,
};

/**
 * Smoothly scroll to a section. Falls back to native scrolling when Lenis is
 * absent (reduced-motion users) so in-page anchors always work.
 */
export function smoothScrollTo(target: string | number): void {
  if (scrollStore.lenis) {
    scrollStore.lenis.scrollTo(target, { duration: 1.4 });
    return;
  }
  if (typeof window === "undefined") return;
  if (typeof target === "number") {
    window.scrollTo({ top: target, behavior: "smooth" });
    return;
  }
  document.querySelector(target)?.scrollIntoView({ behavior: "smooth" });
}
