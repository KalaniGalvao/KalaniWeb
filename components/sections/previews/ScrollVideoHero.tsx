"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import type { Segment } from "@/lib/site";
import { smoothScrollTo } from "@/lib/scroll-store";

// Text choreography is keyed to the VIDEO's playback time (seconds). There's a
// deliberate wait before the first phrase, then phrases reveal ONE BY ONE and
// finish near the end of the clip ("with the video length").
const TEXT_START = 0.15;
const TEXT_END = 0.92;

/** Reveals a block when the scrubbed video passes its [start,end] time window. */
function VideoReveal({
  time,
  start,
  end,
  reduce,
  className,
  children,
}: {
  time: MotionValue<number>;
  start: number;
  end: number;
  reduce: boolean | null;
  className?: string;
  children: React.ReactNode;
}) {
  const opacity = useTransform(time, [start, end], [0, 1]);
  const x = useTransform(time, [start, end], [48, 0]);
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div style={{ opacity, x }} className={className}>
      {children}
    </motion.div>
  );
}

/**
 * A hero whose background video is *scrubbed by scroll* (the section pins while
 * scroll progress maps to the video's currentTime). The footage stays full-bleed
 * (clear on the left), and the copy fades in on the right — keyed to the video's
 * own timeline so it tracks the footage, not the scrollbar.
 */
export function ScrollVideoHero({
  segment,
  src,
}: {
  segment: Segment;
  src: string;
}) {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const targetTime = useRef(0);
  const rafId = useRef<number | null>(null);
  const [useMobilePlayback, setUseMobilePlayback] = useState(false);

  // Live playback time of the (scrubbed) video; drives the text reveal.
  const videoTime = useMotionValue(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    const query = window.matchMedia("(hover: none), (pointer: coarse)");
    const update = () => setUseMobilePlayback(query.matches);

    update();

    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", update);
      return () => query.removeEventListener("change", update);
    }

    query.addListener(update);
    return () => query.removeListener(update);
  }, []);

  // Prime the video so it can be seeked (iOS needs a play/pause kick) and hold
  // it on the first frame.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    let cancelled = false;

    const tryPlay = () => {
      if (!useMobilePlayback || cancelled) return;
      v.muted = true;
      v.playsInline = true;
      v.setAttribute("webkit-playsinline", "true");
      v.play().catch(() => {});
    };

    const onReady = () => {
      if (!useMobilePlayback) v.pause();
      try {
        v.currentTime = 0.04;
      } catch {
        /* not seekable yet */
      }
      tryPlay();
    };

    if (useMobilePlayback) {
      tryPlay();
      window.addEventListener("touchstart", tryPlay, { passive: true });
      window.addEventListener("scroll", tryPlay, { passive: true });
    } else {
      v.play()
        .then(() => v.pause())
        .catch(() => {});
    }
    v.addEventListener("loadedmetadata", onReady);
    v.addEventListener("canplay", tryPlay);
    return () => {
      cancelled = true;
      v.removeEventListener("loadedmetadata", onReady);
      v.removeEventListener("canplay", tryPlay);
      window.removeEventListener("touchstart", tryPlay);
      window.removeEventListener("scroll", tryPlay);
    };
  }, [useMobilePlayback]);

  // Scroll progress → target time; ease currentTime toward it for a smooth
  // scrub, mirroring the eased position into `videoTime` for the text.
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const video = videoRef.current;
    const progress = Math.max(0, Math.min(1, p));

    // iOS/Safari is inconsistent with scroll-driven currentTime updates. On
    // coarse pointers we still nudge currentTime directly, while also allowing
    // playback to continue; this prevents frozen/black frames and keeps scroll
    // feeling connected on mobile Safari.
    if (useMobilePlayback) {
      videoTime.set(progress);
      if (
        video &&
        video.duration &&
        !Number.isNaN(video.duration) &&
        video.readyState >= 1
      ) {
        try {
          video.currentTime = progress * Math.max(0, video.duration - 0.05);
        } catch {
          /* iOS can reject seeks while buffering */
        }
      }
      if (video?.paused) {
        video.play().catch(() => {});
      }
      return;
    }

    if (
      !video ||
      !video.duration ||
      Number.isNaN(video.duration) ||
      video.readyState < 2
    ) {
      return;
    }

    const nextTime = progress * Math.max(0, video.duration - 0.05);

    targetTime.current = nextTime;
    videoTime.set(progress);

    if (rafId.current !== null) return;

    const tick = () => {
      const currentVideo = videoRef.current;

      if (!currentVideo) {
        rafId.current = null;
        return;
      }

      const difference = targetTime.current - currentVideo.currentTime;

      // Higher than 0.16 so the footage doesn't fall behind the scroll.
      currentVideo.currentTime += difference * 0.32;

      if (Math.abs(difference) > 0.006) {
        rafId.current = requestAnimationFrame(tick);
      } else {
        currentVideo.currentTime = targetTime.current;
        rafId.current = null;
      }
    };

    rafId.current = requestAnimationFrame(tick);
  });

  useEffect(
    () => () => {
      if (rafId.current != null) cancelAnimationFrame(rafId.current);
    },
    [],
  );

  return (
    <section
      ref={sectionRef}
      id={segment.id}
      aria-labelledby={`${segment.id}-title`}
      // Tall track → a slow, deliberate scrub through the footage.
      className="relative min-h-[240vh]"
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden bg-black">
        {/* Scroll-scrubbed background footage. */}
       <video
  ref={videoRef}
  src={src}
  muted
  autoPlay={useMobilePlayback}
  loop={useMobilePlayback}
  playsInline
  preload="auto"
  disablePictureInPicture
  aria-hidden="true"
  className="absolute inset-0 h-full w-full object-cover opacity-95"
/>

        {/* Readability scrim — darkens the RIGHT (where the copy lives) while the
            footage stays clear on the LEFT. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-l from-[#070b16] via-[#070b16d9] to-transparent md:via-[#070b1699]"
        />

        {/* Edge blend — fades the top and bottom of the footage into the page's
            near-black so the section boundaries melt together (no hard line). */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#02030a] to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#02030a] to-transparent"
        />

        <div className="container-rail relative z-10 flex h-full items-center justify-end">
          <div className="max-w-xl text-right">
            <VideoReveal
              time={videoTime}
              start={TEXT_START}
              end={0.3}
              reduce={reduce}
            >
              <p
                className="mb-4 font-mono text-xs uppercase tracking-[0.25em]"
                style={{ color: segment.accent }}
              >
                {segment.eyebrow}
              </p>
            </VideoReveal>

            <VideoReveal
              time={videoTime}
              start={0.28}
              end={0.43}
              reduce={reduce}
            >
              <h3
                id={`${segment.id}-title`}
                className="text-balance text-3xl font-semibold leading-tight tracking-tightest text-ink-100 sm:text-5xl"
              >
                {segment.title}
              </h3>
            </VideoReveal>

            <VideoReveal
              time={videoTime}
              start={0.41}
              end={0.56}
              reduce={reduce}
            >
              <p className="ml-auto mt-5 max-w-lg text-pretty text-lg leading-relaxed text-ink-300">
                {segment.description}
              </p>
            </VideoReveal>

            <VideoReveal
              time={videoTime}
              start={0.54}
              end={0.7}
              reduce={reduce}
            >
              <ul className="mt-8 space-y-3">
                {segment.highlights.map((h) => (
                  <li
                    key={h}
                    className="flex items-center justify-end gap-3 text-ink-200"
                  >
                    {h}
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-5 w-5 shrink-0"
                      style={{ color: segment.accent }}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </li>
                ))}
              </ul>
            </VideoReveal>

            <VideoReveal
              time={videoTime}
              start={0.7}
              end={TEXT_END}
              reduce={reduce}
            >
              <div className="mt-9 flex justify-end">
                <button
                  type="button"
                  onClick={() => smoothScrollTo("#contato")}
                  className="rounded-full border px-6 py-3 font-medium text-ink-100 transition hover:bg-white/5"
                  style={{ borderColor: `${segment.accent}66` }}
                >
                  Quero algo assim
                </button>
              </div>
            </VideoReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
