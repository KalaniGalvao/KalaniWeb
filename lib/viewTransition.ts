"use client";

/**
 * Client-side page transitions rendered as a branded "curtain": on navigation a
 * full-viewport panel sweeps up with the destination page's BNO wordmark, holds
 * for a beat while the route swaps behind it, then lifts away to reveal the new
 * page. This is a small external store the <PageCurtain/> component subscribes
 * to; the navigation itself is a plain `router.push` fired once the curtain is
 * fully down.
 *
 * Sequence (per run):
 *   cover  → panel rises to full cover, logo fades in
 *   (navigate behind the curtain)
 *   hold   → brief dwell so the logo registers, even if the route commits fast
 *   reveal → panel lifts off the top, logo fades out
 *
 * `finishPageTransition()` is called by SmoothScroll once the new route has
 * mounted + scrolled to the top; the reveal waits for BOTH that signal and the
 * cover/hold to finish (with a backstop so it can never hang). Reduced motion
 * skips the curtain entirely and navigates instantly.
 */

export type CurtainTheme = "advocacia" | "saude" | "beleza" | "default";
export type CurtainPhase = "idle" | "cover" | "hold" | "reveal";
export interface CurtainState {
  phase: CurtainPhase;
  theme: CurtainTheme;
  /** Bumps each run so the component can key/restart transitions if needed. */
  token: number;
}

export const CURTAIN_TIMING = {
  cover: 440,
  hold: 200,
  reveal: 540,
} as const;

const IDLE: CurtainState = { phase: "idle", theme: "default", token: 0 };

let state: CurtainState = IDLE;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}
function setState(patch: Partial<CurtainState>) {
  state = { ...state, ...patch };
  emit();
}

export function subscribeCurtain(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function getCurtainState(): CurtainState {
  return state;
}
/** Stable idle snapshot for SSR/hydration (must be a constant reference). */
export function getServerCurtainState(): CurtainState {
  return IDLE;
}

// ── orchestration ──────────────────────────────────────────────────────────
let coverTimer = 0;
let holdTimer = 0;
let revealTimer = 0;
let safetyTimer = 0;
let coverDown = false;
let routeCommitted = false;

function clearTimers() {
  window.clearTimeout(coverTimer);
  window.clearTimeout(holdTimer);
  window.clearTimeout(revealTimer);
  window.clearTimeout(safetyTimer);
}

function themeFromHref(href?: string): CurtainTheme {
  const match = href?.match(/\/servicos\/(advocacia|saude|beleza)(?:$|[/?#])/);
  return (match?.[1] as CurtainTheme) ?? "default";
}

function reveal() {
  if (state.phase === "idle" || state.phase === "reveal") return;
  setState({ phase: "reveal" });
  revealTimer = window.setTimeout(() => {
    coverDown = false;
    routeCommitted = false;
    // Park off-screen below, ready for the next run.
    setState({ phase: "idle" });
  }, CURTAIN_TIMING.reveal);
}

function maybeReveal() {
  if (coverDown && routeCommitted && state.phase === "hold") reveal();
}

export function startPageTransition(navigate: () => void, href?: string): void {
  if (typeof window === "undefined") {
    navigate();
    return;
  }
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    navigate();
    return;
  }

  clearTimers();
  coverDown = false;
  routeCommitted = false;

  setState({
    phase: "cover",
    theme: themeFromHref(href),
    token: state.token + 1,
  });

  coverTimer = window.setTimeout(() => {
    // Fully covered — swap the route behind the curtain, then dwell on the logo.
    setState({ phase: "hold" });
    navigate();
    holdTimer = window.setTimeout(() => {
      coverDown = true;
      maybeReveal();
      // Backstop: reveal even if the route-commit signal never arrives.
      safetyTimer = window.setTimeout(() => {
        routeCommitted = true;
        maybeReveal();
      }, 700);
    }, CURTAIN_TIMING.hold);
  }, CURTAIN_TIMING.cover);
}

/** Called once the new route has mounted + scrolled to the top. */
export function finishPageTransition(): void {
  routeCommitted = true;
  maybeReveal();
}
