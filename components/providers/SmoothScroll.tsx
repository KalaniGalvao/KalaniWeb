"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scrollStore } from "@/lib/scroll-store";
import { finishPageTransition } from "@/lib/viewTransition";

/**
 * Wires Lenis (smooth scroll) to GSAP's ScrollTrigger so every pinned/scrubbed
 * animation advances on the exact frame the page scrolls. Under
 * `prefers-reduced-motion` (or on touch) Lenis is skipped and we mirror the
 * native scroll position into the store so the rest of the app reads sane values.
 *
 * The infinite boundary loop lives in <InfiniteScrollLoop/> — this provider only
 * owns Lenis + scroll bookkeeping + per-route scroll restoration.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Per-route scroll positions so BACK/forward can restore where the user was.
  const scrollPositions = useRef<Map<string, number>>(new Map());
  const cameFromPopRef = useRef(false);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const usesTouchInput = window.matchMedia(
      "(hover: none), (pointer: coarse)",
    ).matches;

    const maxScroll = () =>
      Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const writeProgress = () => {
      const max = maxScroll() || 1;
      scrollStore.progress = Math.min(1, Math.max(0, scrollStore.scrollY / max));
    };

    // ── reduced motion / touch: native scroll, just mirror into the store ──
    if (prefersReduced || usesTouchInput) {
      const onScroll = () => {
        scrollStore.scrollY = window.scrollY;
        scrollStore.velocity = 0;
        writeProgress();
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
      return () => window.removeEventListener("scroll", onScroll);
    }

    // ── desktop: Lenis smooth scroll ──
    const lenis = new Lenis({
      duration: 1.15,
      // exponential ease-out — long, premium glide
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
    });
    scrollStore.lenis = lenis;

    // Dev-only debug handle (stripped from production builds).
    if (process.env.NODE_ENV !== "production") {
      (window as typeof window & { __lenis?: Lenis }).__lenis = lenis;
    }

    lenis.on("scroll", (e: { scroll: number; velocity: number }) => {
      scrollStore.scrollY = e.scroll;
      scrollStore.velocity = e.velocity;
      writeProgress();
      ScrollTrigger.update();
    });

    // Ctrl+wheel / trackpad pinch = browser zoom: stop Lenis for the gesture so
    // the page doesn't scroll under the zoom (capture phase → before Lenis).
    let zoomResume = 0;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      lenis.stop();
      window.clearTimeout(zoomResume);
      zoomResume = window.setTimeout(() => lenis.start(), 400);
    };
    const onResize = () => {
      lenis.resize();
      ScrollTrigger.refresh();
    };

    window.addEventListener("wheel", onWheel, { passive: true, capture: true });
    window.addEventListener("resize", onResize);

    // Drive Lenis from GSAP's ticker (single source of truth for time).
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    ScrollTrigger.refresh();

    return () => {
      window.removeEventListener("wheel", onWheel, { capture: true });
      window.removeEventListener("resize", onResize);
      window.clearTimeout(zoomResume);
      gsap.ticker.remove(raf);
      lenis.destroy();
      scrollStore.lenis = null;
    };
  }, []);

  // Distinguish BACK/forward (restore) from a fresh push (go to top).
  useEffect(() => {
    const onPop = () => {
      cameFromPopRef.current = true;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Lenis persists across route changes (it lives in the root layout), so a new
  // page would otherwise inherit the previous page's scroll. On a FORWARD nav we
  // jump to the top; on BACK/forward we restore the saved position (e.g. back to
  // the section whose button was clicked).
  useEffect(() => {
    const isBack = cameFromPopRef.current;
    cameFromPopRef.current = false;
    const target = isBack ? scrollPositions.current.get(pathname) ?? 0 : 0;

    const apply = () => {
      if (scrollStore.lenis) {
        scrollStore.lenis.scrollTo(target, { immediate: true, force: true });
      } else {
        window.scrollTo(0, target);
      }
      scrollStore.scrollY = target;
    };
    apply(); // forward → top, immediately
    const raf = requestAnimationFrame(() => {
      apply();
      // New route has committed — let the page cross-fade complete.
      finishPageTransition();
    });
    const settle = window.setTimeout(apply, 90); // re-apply after layout settles

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(settle);
      // Save where we were on the page we're leaving.
      scrollPositions.current.set(pathname, scrollStore.scrollY);
    };
  }, [pathname]);

  return <>{children}</>;
}
