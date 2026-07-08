"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { WHATSAPP_URL, type Segment } from "@/lib/site";
import { smoothScrollTo } from "@/lib/scroll-store";
import { startPageTransition } from "@/lib/viewTransition";
import { useIntroProgress } from "@/lib/useIntroProgress";

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
  ctaHref = "#contato",
  autoPlay = false,
}: {
  segment: Segment;
  src: string;
  /** "#anchor" → smooth-scroll on this page; a path ("/servicos/...") → navigate. */
  ctaHref?: string;
  /** Dedicated-page intro: play the footage + reveal copy without scrolling. */
  autoPlay?: boolean;
}) {
  const router = useRouter();
  const goToCta = () =>
    ctaHref.startsWith("#")
      ? smoothScrollTo(ctaHref)
      : startPageTransition(() => router.push(ctaHref), ctaHref);
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

  // First-visit / nav auto-play intro that hands off smoothly to the scroll
  // scrub on the main page (plays the footage forward once, then scroll takes
  // over and scrolling up rewinds). Disabled in autoPlay mode (the dedicated
  // page plays the real <video> once) and under reduced motion.
  const introProgress = useIntroProgress({
    id: segment.id,
    sectionRef,
    scrollYProgress,
    durationMs: () => (videoRef.current?.duration || 1.2) * 1000,
    enabled: !reduce && !autoPlay,
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

  // Prime the MAIN-page video so it can be seeked (iOS needs a play/pause kick)
  // and hold it on the first frame. The dedicated page (autoPlay) owns its own
  // playback in the effect below, so it opts out here.
  useEffect(() => {
    if (autoPlay) return;
    const v = videoRef.current;
    if (!v) return;
    const onReady = () => {
      if (!useMobilePlayback) v.pause();
      try {
        v.currentTime = 0.04;
      } catch {
        /* not seekable yet */
      }
    };
    if (useMobilePlayback) {
      v.play().catch(() => {});
    } else {
      v.play()
        .then(() => v.pause())
        .catch(() => {});
    }
    v.addEventListener("loadedmetadata", onReady);
    return () => v.removeEventListener("loadedmetadata", onReady);
  }, [useMobilePlayback, autoPlay]);

  // Scroll progress → target time; ease currentTime toward it for a smooth
  // scrub, mirroring the eased position into `videoTime` for the text.
  // Driven by the intro-blended progress (intro auto-play → scroll), not raw
  // scroll, so the entrance plays once then hands off to the scrub.
  useMotionValueEvent(introProgress, "change", (p) => {
    // In autoPlay mode the dedicated page drives the video from real playback.
    if (autoPlay) return;
    const video = videoRef.current;
    const progress = Math.max(0, Math.min(1, p));

    // iOS/Safari is inconsistent with scroll-driven currentTime updates. On
    // coarse pointers we let the video play normally and keep the text keyed to
    // scroll progress, which avoids the black-frame mobile failure.
    if (useMobilePlayback) {
      videoTime.set(progress);
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

  // Auto-play intro (dedicated page): the footage plays itself ONCE, from the
  // very start — but it's held on the first frame until the page-enter transition
  // has settled, so the opening isn't spent underneath the cross-page fade. The
  // copy reveals in step with the video's real playback time, then the clip stops
  // on its last frame with everything shown; scrolling moves on to the content
  // below. Reduced motion → settle straight to the closing frame, copy visible.
  useEffect(() => {
    if (!autoPlay) return;
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = 0.55;

    let cancelled = false;
    let started = false;
    let rafId = 0;

    const sync = () => {
      if (v.duration) videoTime.set(Math.min(1, v.currentTime / v.duration));
      rafId = requestAnimationFrame(sync);
    };

    // Keep it paused on the opening frame while the transition plays.
    const hold = () => {
      try {
        v.pause();
        v.currentTime = 0.04;
      } catch {
        /* not seekable yet */
      }
      videoTime.set(0);
    };

    const begin = () => {
      if (cancelled) return;
      started = true;
      if (reduce) {
        try {
          v.pause();
          v.currentTime = Math.max(0, (v.duration || 1) - 0.05);
        } catch {
          /* ignore */
        }
        videoTime.set(1);
        return;
      }
      try {
        v.currentTime = 0.04;
      } catch {
        /* ignore */
      }
      v.play().catch(() => {});
    };

    hold();
    // A late metadata event must not re-pause a clip that's already begun.
    const onMeta = () => {
      if (!started) hold();
    };
    v.addEventListener("loadedmetadata", onMeta);
    rafId = requestAnimationFrame(sync);
    // ~700ms clears the 420ms fade-in plus the held navigation promise.
    const timer = window.setTimeout(begin, reduce ? 0 : 700);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      cancelAnimationFrame(rafId);
      v.removeEventListener("loadedmetadata", onMeta);
    };
  }, [autoPlay, reduce, videoTime]);

  return (
    <section
      ref={sectionRef}
      id={segment.id}
      aria-labelledby={`${segment.id}-title`}
      // Tall track → a slow, deliberate scrub through the footage. On the
      // dedicated page (autoPlay) it's a SHORT hero (~82svh) so the next section
      // peeks in — making it obvious you've landed on a new page after the curtain.
      className={`relative ${autoPlay ? "min-h-[82svh]" : "min-h-[240vh]"}`}
    >
      <div
        className={`sticky top-0 ${
          autoPlay ? "h-[82svh]" : "h-[100svh]"
        } overflow-hidden bg-black`}
      >
        {/* Scroll-scrubbed background footage. */}
       <video
  ref={videoRef}
  src={src}
  muted
  autoPlay={useMobilePlayback && !autoPlay}
  playsInline
  preload="auto"
  disablePictureInPicture
  aria-hidden="true"
  className="absolute inset-0 h-full w-full object-cover object-center opacity-95"
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
              <div className="mt-9 flex flex-wrap items-center justify-end gap-3">
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full px-6 py-3 font-medium text-[#0a0f1c] shadow-lg transition hover:brightness-110"
                  style={{ backgroundColor: segment.accent }}
                >
                  Começar projeto
                </a>
                <button
                  type="button"
                  onClick={goToCta}
                  className="rounded-full border px-6 py-3 font-medium text-ink-100 transition hover:bg-white/5"
                  style={{ borderColor: `${segment.accent}66` }}
                >
                  Saiba mais
                </button>
              </div>
            </VideoReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
