"use client";

import { useEffect, useRef } from "react";
import {
  animate,
  useMotionValue,
  useMotionValueEvent,
  type MotionValue,
} from "framer-motion";

// Sections that have already auto-played their intro in THIS page load. Module
// scope → resets on refresh (per-visit), shared across mounts.
const playedThisLoad = new Set<string>();

type Duration = number | (() => number);

/**
 * Blends a one-time "intro" auto-play with scroll, returning a MotionValue that
 * a section feeds to its reveals INSTEAD of `scrollYProgress`:
 *
 *     out = max(intro, scrollYProgress)
 *
 * `intro` animates 0 → 1 (over `durationMs`) the FIRST time the section enters
 * view this page load, or whenever a `bno:intro` event targets this `id`
 * (nav clicks — those always replay). It then HOLDS at 1, and eases back to 0
 * as soon as the user scrolls after the hold. Because `out = max(...)` and the
 * release is eased, the hand-off from auto-play to scroll is smooth (no snap)
 * and scrolling up afterwards rewinds.
 *
 * `enabled=false` (reduced motion) → `out` simply mirrors scroll.
 */
export function useIntroProgress({
  id,
  sectionRef,
  scrollYProgress,
  durationMs,
  enabled = true,
}: {
  id: string;
  sectionRef: { current: HTMLElement | null };
  scrollYProgress: MotionValue<number>;
  durationMs: Duration;
  enabled?: boolean;
}): MotionValue<number> {
  const intro = useMotionValue(0);
  const out = useMotionValue(0);
  const phaseRef = useRef<"idle" | "playing" | "held" | "released">("idle");
  const holdScrollRef = useRef(0);
  const animRef = useRef<ReturnType<typeof animate> | null>(null);
  // Read the latest duration at play() time without re-running the effect.
  const durationRef = useRef(durationMs);
  durationRef.current = durationMs;

  useMotionValueEvent(intro, "change", (v) => {
    const next = Math.max(v, scrollYProgress.get());
    if (next !== out.get()) out.set(next);
  });

  useMotionValueEvent(scrollYProgress, "change", (s) => {
    const next = Math.max(intro.get(), s);
    if (next !== out.get()) out.set(next);
    // Once the intro has settled, the first real scroll releases it (eased) so
    // scroll takes over and scrolling up rewinds.
    if (
      phaseRef.current === "held" &&
      Math.abs(s - holdScrollRef.current) > 0.015
    ) {
      phaseRef.current = "released";
      animRef.current?.stop();
      animRef.current = animate(intro, 0, {
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1],
      });
    }
  });

  useEffect(() => {
    // Keep `out` correct on mount (and when disabled it just mirrors scroll).
    out.set(Math.max(intro.get(), scrollYProgress.get()));
    if (!enabled) return;

    const play = () => {
      const raw = durationRef.current;
      const seconds = (typeof raw === "function" ? raw() : raw) / 1000;
      animRef.current?.stop();
      phaseRef.current = "playing";
      intro.set(0);
      animRef.current = animate(intro, 1, {
        duration: Math.max(0.2, seconds),
        ease: [0.16, 1, 0.3, 1],
        onComplete: () => {
          phaseRef.current = "held";
          holdScrollRef.current = scrollYProgress.get();
        },
      });
    };

    let io: IntersectionObserver | null = null;
    const el = sectionRef.current;
    if (el) {
      io = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting && !playedThisLoad.has(id)) {
            playedThisLoad.add(id);
            play();
          }
        },
        // Fires when the section crosses the viewport's vertical centre band —
        // i.e. when the visitor has actually arrived at it.
        { rootMargin: "-45% 0px -45% 0px" },
      );
      io.observe(el);
    }

    // Nav clicks replay the intro (even if already played this load).
    const onNav = (e: Event) => {
      if ((e as CustomEvent<{ id?: string }>).detail?.id === id) play();
    };
    window.addEventListener("bno:intro", onNav as EventListener);

    return () => {
      io?.disconnect();
      window.removeEventListener("bno:intro", onNav as EventListener);
      animRef.current?.stop();
    };
  }, [enabled, id, sectionRef, intro, out, scrollYProgress]);

  return out;
}
