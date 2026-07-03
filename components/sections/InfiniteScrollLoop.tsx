"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scrollStore } from "@/lib/scroll-store";

type Direction = "forward" | "backward";
type Stage = "idle" | "closing" | "opening";

const GLYPHS = "ᚠᚢᚦᚨᚱᚲ⌁⌘⌬⌗⋮⋰⟟⟁⧫⨳01<>/{}[]";
const GRID_COLUMNS = 24;
const GRID_ROWS = 14;
const NORMAL_PHASE_MS = 1250;
const REDUCED_PHASE_MS = 550;
const NORMAL_SETTLE_MS = 360;
const REDUCED_SETTLE_MS = 100;

const GLYPH_CELLS = Array.from(
  { length: GRID_COLUMNS * GRID_ROWS },
  (_, index) => ({
    index,
    column: index % GRID_COLUMNS,
    row: Math.floor(index / GRID_COLUMNS),
    glyph: GLYPHS[(index * 17 + Math.floor(index / 7)) % GLYPHS.length],
  }),
);

function GlyphCurtainGrid({
  stage,
  direction,
  reduced,
  phaseSeconds,
}: {
  stage: Exclude<Stage, "idle">;
  direction: Direction;
  reduced: boolean;
  phaseSeconds: number;
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const closing = stage === "closing";
  const fromBottom =
    (closing && direction === "forward") ||
    (!closing && direction === "backward");

  // Mutate only text nodes while the curtain is mounted. This creates the
  // decoding effect without re-rendering hundreds of React elements at 60fps.
  useEffect(() => {
    if (reduced) return;
    const nodes = Array.from(
      gridRef.current?.querySelectorAll<HTMLElement>("[data-loop-glyph]") ?? [],
    );
    let tick = 0;
    const timer = window.setInterval(() => {
      tick += 1;
      nodes.forEach((node, index) => {
        node.textContent =
          GLYPHS[(index * 11 + tick * 7 + Math.floor(index / 5)) % GLYPHS.length];
      });
    }, 72);
    return () => window.clearInterval(timer);
  }, [reduced, stage]);

  return (
    <div
      ref={gridRef}
      className="absolute inset-0 z-20 overflow-hidden"
      aria-hidden="true"
    >
      {GLYPH_CELLS.map((cell) => {
        const rowProgress = cell.row / Math.max(1, GRID_ROWS - 1);
        const directionalProgress = fromBottom ? 1 - rowProgress : rowProgress;
        const delay = reduced
          ? 0
          : directionalProgress * phaseSeconds * 0.38 +
            (cell.column % 4) * 0.01;

        return (
          <span
            key={cell.index}
            style={{
              left: `${((cell.column + 0.5) / GRID_COLUMNS) * 100}%`,
              top: `${((cell.row + 0.5) / GRID_ROWS) * 100}%`,
              transform: "translate(-50%, -50%)",
            }}
            className="absolute"
          >
            <motion.span
              data-loop-glyph
              initial={
                reduced
                  ? { opacity: 0 }
                  : { opacity: closing ? 0 : 0.3, y: closing ? 12 : 4 }
              }
              animate={
                reduced
                  ? { opacity: stage === "closing" ? 0.48 : 0 }
                  : {
                      opacity: closing ? [0, 1, 0.38] : [0.38, 1, 0],
                      y: closing ? [12, 0, -6] : [6, 0, -12],
                      scale: [0.76, 1.18, 0.9],
                    }
              }
              transition={{
                duration: reduced ? phaseSeconds : phaseSeconds * 0.56,
                delay,
                ease: "easeOut",
                times: reduced ? undefined : [0, 0.42, 1],
              }}
              style={{
                display: "block",
                color:
                  cell.index % 17 === 0
                    ? "rgba(232,119,73,1)"
                    : "rgba(245,248,252,.98)",
                textShadow: "0 0 12px rgba(236,241,250,.72)",
              }}
              className="font-mono text-xs sm:text-sm"
            >
              {cell.glyph}
            </motion.span>
          </span>
        );
      })}

    </div>
  );
}

function CurtainOverlay({
  stage,
  direction,
  reduced,
  phaseSeconds,
}: {
  stage: Exclude<Stage, "idle">;
  direction: Direction;
  reduced: boolean;
  phaseSeconds: number;
}) {
  const closing = stage === "closing";

  return (
    <div
      data-lenis-prevent
      aria-hidden="true"
      className="pointer-events-auto fixed inset-0 overflow-hidden"
      style={{ zIndex: 2147483647, isolation: "isolate" }}
    >
      <motion.div
        key={`backdrop-${stage}`}
        initial={{ opacity: closing ? 0 : 1 }}
        animate={{ opacity: closing ? 1 : 0 }}
        transition={{ duration: phaseSeconds, ease: [0.65, 0, 0.35, 1] }}
        className="absolute inset-0 bg-[#020306]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(201,91,55,.16),transparent_38%,rgba(0,0,0,.6)_100%)]" />
      </motion.div>

      <GlyphCurtainGrid
        key={`${stage}-${direction}`}
        stage={stage}
        direction={direction}
        reduced={reduced}
        phaseSeconds={phaseSeconds}
      />
    </div>
  );
}

/**
 * Bidirectional boundary loop hidden by a body-level glyph curtain. One
 * explicit timeline owns closing, teleporting, destination settling and
 * opening; no animation-completion events are involved.
 */
export function InfiniteScrollLoop() {
  const lockedRef = useRef(false);
  const sequenceRef = useRef(0);
  const timersRef = useRef<Set<number>>(new Set());
  const [mounted, setMounted] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [direction, setDirection] = useState<Direction>("forward");
  const reduce = useReducedMotion() === true;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const phaseMs = reduce ? REDUCED_PHASE_MS : NORMAL_PHASE_MS;
    const settleMs = reduce ? REDUCED_SETTLE_MS : NORMAL_SETTLE_MS;
    const boundary = () => Math.max(32, window.innerHeight * 0.035);
    const currentScroll = () => scrollStore.lenis?.scroll ?? window.scrollY;
    const maximumScroll = () =>
      Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const atDocumentStart = () => currentScroll() <= boundary();
    const atDocumentEnd = () =>
      maximumScroll() - currentScroll() <= boundary();

    const sleep = (milliseconds: number) =>
      new Promise<void>((resolve) => {
        const timer = window.setTimeout(() => {
          timersRef.current.delete(timer);
          resolve();
        }, milliseconds);
        timersRef.current.add(timer);
      });

    const nextPaint = () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });

    const teleport = (nextDirection: Direction) => {
      const maximum = maximumScroll();
      const target = nextDirection === "forward" ? 1 : Math.max(1, maximum - 1);

      scrollStore.velocity = 0;
      scrollStore.scrollY = target;
      scrollStore.progress = nextDirection === "forward" ? 0 : 1;

      if (scrollStore.lenis) {
        scrollStore.lenis.scrollTo(target, { immediate: true, force: true });
        scrollStore.lenis.resize();
      } else {
        window.scrollTo({ top: target, left: 0, behavior: "auto" });
      }

      window.dispatchEvent(new Event("kalani:loop-handoff"));
      ScrollTrigger.update();
    };

    const begin = async (nextDirection: Direction) => {
      if (lockedRef.current) return;
      lockedRef.current = true;
      const sequence = ++sequenceRef.current;
      setDirection(nextDirection);
      scrollStore.velocity = 0;
      scrollStore.lenis?.stop();
      setStage("closing");

      await sleep(phaseMs);
      if (sequence !== sequenceRef.current) return;

      teleport(nextDirection);
      await nextPaint();
      if (sequence !== sequenceRef.current) return;
      ScrollTrigger.refresh();
      await sleep(settleMs);
      if (sequence !== sequenceRef.current) return;

      setStage("opening");
      await sleep(phaseMs);
      if (sequence !== sequenceRef.current) return;

      setStage("idle");
      scrollStore.velocity = 0;
      scrollStore.lenis?.start();
      lockedRef.current = false;
    };

    const onWheel = (event: WheelEvent) => {
      if (lockedRef.current) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      if (event.deltaY > 0 && atDocumentEnd()) {
        event.preventDefault();
        event.stopImmediatePropagation();
        void begin("forward");
      } else if (event.deltaY < 0 && atDocumentStart()) {
        event.preventDefault();
        event.stopImmediatePropagation();
        void begin("backward");
      }
    };

    let touchStartY: number | null = null;
    const onTouchStart = (event: TouchEvent) => {
      touchStartY = event.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (event: TouchEvent) => {
      if (lockedRef.current) {
        event.preventDefault();
        return;
      }
      const currentY = event.touches[0]?.clientY;
      if (touchStartY == null || currentY == null) return;
      const delta = currentY - touchStartY;
      if (delta < -16 && atDocumentEnd()) {
        event.preventDefault();
        touchStartY = null;
        void begin("forward");
      } else if (delta > 16 && atDocumentStart()) {
        event.preventDefault();
        touchStartY = null;
        void begin("backward");
      }
    };
    const onTouchEnd = () => {
      touchStartY = null;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, [contenteditable='true']")) {
        return;
      }
      if (lockedRef.current) {
        event.preventDefault();
        return;
      }
      const forward =
        event.key === "ArrowDown" ||
        event.key === "PageDown" ||
        (event.key === " " && !event.shiftKey);
      const backward =
        event.key === "ArrowUp" ||
        event.key === "PageUp" ||
        (event.key === " " && event.shiftKey);
      if (forward && atDocumentEnd()) {
        event.preventDefault();
        void begin("forward");
      } else if (backward && atDocumentStart()) {
        event.preventDefault();
        void begin("backward");
      }
    };

    window.addEventListener("wheel", onWheel, {
      passive: false,
      capture: true,
    });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKeyDown);

    return () => {
      sequenceRef.current += 1;
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current.clear();
      window.removeEventListener("wheel", onWheel, true);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKeyDown);
      scrollStore.lenis?.start();
      lockedRef.current = false;
    };
  }, [reduce]);

  const phaseSeconds =
    (reduce ? REDUCED_PHASE_MS : NORMAL_PHASE_MS) / 1000;
  const overlay =
    stage === "idle" ? null : (
      <CurtainOverlay
        stage={stage}
        direction={direction}
        reduced={reduce}
        phaseSeconds={phaseSeconds}
      />
    );

  return (
    <>
      <div aria-hidden="true" className="h-px bg-black" />
      {mounted && overlay ? createPortal(overlay, document.body) : null}
    </>
  );
}
