"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scrollStore } from "@/lib/scroll-store";

/**
 * Wires Lenis (smooth scroll) to GSAP's ScrollTrigger so every pinned/scrubbed
 * animation advances on the exact frame the page scrolls — eliminating the
 * "jitter" you get when the two run on separate RAF loops.
 *
 * Under `prefers-reduced-motion`, Lenis is never created: we keep native
 * scrolling and only mirror position into the store so the rest of the app
 * (3D hero, progress UI) still reads sane values.
 *
 * INFINITE LOOP: the experience has no real end. Boundary wraps are driven by
 * INPUT INTENT (wheel / touch), not by scroll position — because the scroll
 * value is clamped at 0/max, a "scroll up at the very top" never produces a
 * Lenis event, so position-based detection can't see it. Reading the wheel/
 * touch direction at the boundary fixes that (you can loop UP from the hero
 * back to the contact section, and DOWN from contact back to the hero). The
 * jump is `immediate` on the NATIVE scroll position (Lenis scrolls the real
 * document, no transform wrapper), so it never breaks the `position: sticky`
 * pinning every section relies on. A one-frame mask in the destination colour
 * hides the content swap. Disabled under prefers-reduced-motion.
 *
 * ZOOM SAFETY: Ctrl+wheel / trackpad pinch is browser zoom — we stop Lenis for
 * the gesture so the page doesn't scroll while zooming, and suppress loop wraps
 * for a moment after any resize/zoom (and refresh measurements) so a zoom never
 * teleports you into another section.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const maskRef = useRef<HTMLDivElement>(null);

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

    // ── Infinite-loop boundary wrap ─────────────────────────────────────────
    const HERO_BG = "#070b16"; //  destination colour when looping → top (hero)
    const END_BG = "#000000"; //   destination colour when looping → end (contact)
    const FADE_MS = 460;
    const EDGE = 3; //             px tolerance for "at the boundary"
    let wrapping = false;
    // Don't allow the top→bottom wrap until the user has actually scrolled down
    // a screen once, so a stray scroll-up on first load can't teleport away.
    let armedTopWrap = false;
    // Timestamp of the last layout change (resize / zoom). Wraps are suppressed
    // briefly afterwards so a zoom-driven reflow can't trip a loop.
    let lastLayoutChange = 0;

    const atTop = () => scrollStore.scrollY <= EDGE;
    const atBottom = () => scrollStore.scrollY >= maxScroll() - EDGE;
    const canWrap = () =>
      !wrapping &&
      maxScroll() > window.innerHeight &&
      performance.now() - lastLayoutChange > 700;

    const runWrap = (to: number, color: string, jump: (y: number) => void) => {
      wrapping = true;
      const mask = maskRef.current;
      if (mask) {
        mask.style.transition = "none";
        mask.style.backgroundColor = color;
        mask.style.opacity = "1";
      }
      jump(to);
      // Commit the opaque cover this frame, THEN fade it out (double rAF so the
      // browser animates 1 → 0 instead of coalescing it away).
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (mask) {
            mask.style.transition = `opacity ${FADE_MS}ms ease`;
            mask.style.opacity = "0";
          }
        });
      });
      window.setTimeout(() => {
        wrapping = false;
      }, FADE_MS + 80);
    };

    // ── reduced motion: native scroll, NO loop (respect the preference) ──
    if (prefersReduced) {
      const onScroll = () => {
        scrollStore.scrollY = window.scrollY;
        scrollStore.velocity = 0;
        writeProgress();
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
      return () => window.removeEventListener("scroll", onScroll);
    }

    // ── touch devices: native scroll + loop via touch intent ──
    if (usesTouchInput) {
      const jumpNative = (y: number) => window.scrollTo(0, y);
      let touchStartY = 0;

      const onScroll = () => {
        scrollStore.scrollY = window.scrollY;
        scrollStore.velocity = 0;
        writeProgress();
        if (window.scrollY > window.innerHeight) armedTopWrap = true;
      };
      const onTouchStart = (e: TouchEvent) => {
        touchStartY = e.touches[0]?.clientY ?? 0;
      };
      const onTouchMove = (e: TouchEvent) => {
        if (!canWrap()) return;
        // dy > 0 → finger dragged DOWN → content pulled down → scroll-up intent.
        const dy = (e.touches[0]?.clientY ?? 0) - touchStartY;
        if (dy < -48 && atBottom()) runWrap(0, HERO_BG, jumpNative);
        else if (dy > 48 && atTop() && armedTopWrap)
          runWrap(maxScroll(), END_BG, jumpNative);
      };
      const onLayout = () => {
        lastLayoutChange = performance.now();
      };

      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("touchstart", onTouchStart, { passive: true });
      window.addEventListener("touchmove", onTouchMove, { passive: true });
      window.addEventListener("resize", onLayout);
      onScroll();
      return () => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("touchstart", onTouchStart);
        window.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("resize", onLayout);
      };
    }

    // ── desktop: Lenis smooth scroll + loop via wheel intent ──
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

    const jumpLenis = (y: number) =>
      lenis.scrollTo(y, { immediate: true, force: true });

    lenis.on("scroll", (e: { scroll: number; velocity: number }) => {
      scrollStore.scrollY = e.scroll;
      scrollStore.velocity = e.velocity;
      writeProgress();
      ScrollTrigger.update();
      if (e.scroll > window.innerHeight) armedTopWrap = true;
    });

    // Capture phase so this runs BEFORE Lenis' own wheel handler — lets us stop
    // Lenis from scrolling during a zoom gesture, and read the boundary intent.
    let zoomResume = 0;
    const onWheel = (e: WheelEvent) => {
      // Ctrl+wheel / trackpad pinch = browser zoom. Stop Lenis for the gesture
      // so the page doesn't scroll under the zoom, and never wrap.
      if (e.ctrlKey) {
        lenis.stop();
        window.clearTimeout(zoomResume);
        zoomResume = window.setTimeout(() => lenis.start(), 400);
        lastLayoutChange = performance.now();
        return;
      }
      if (!canWrap()) return;
      if (e.deltaY > 0 && atBottom()) {
        runWrap(0, HERO_BG, jumpLenis);
      } else if (e.deltaY < 0 && atTop() && armedTopWrap) {
        runWrap(maxScroll(), END_BG, jumpLenis);
      }
    };

    const onResize = () => {
      lastLayoutChange = performance.now();
      lenis.resize();
      ScrollTrigger.refresh();
    };

    window.addEventListener("wheel", onWheel, { passive: true, capture: true });
    window.addEventListener("resize", onResize);

    // Drive Lenis from GSAP's ticker (single source of truth for time).
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // Let ScrollTrigger measure against Lenis-controlled scroll height.
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

  return (
    <>
      {children}
      {/* Loop mask — flashes the destination colour for one frame at the wrap
          so the jump (end → start or start → end) is invisible, then fades out.
          Always click-through and above every section. */}
      <div
        ref={maskRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[80] opacity-0"
        style={{ backgroundColor: "#070b16" }}
      />
    </>
  );
}
