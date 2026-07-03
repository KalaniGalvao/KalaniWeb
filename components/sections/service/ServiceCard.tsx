"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import type { Service } from "@/lib/site";
import { startPageTransition } from "@/lib/viewTransition";

/**
 * Service card with a "liquid glass" pressure effect: the pointer tilts the card
 * in 3D, a specular sheen + a highlight that tracks the cursor (`--mx/--my`)
 * play over the glass, and pressing sinks it in. Adapted (dark theme) from the
 * `.skill-cell` effect in the CV reference. Used by WhatWeDo + OtherServices.
 * Falls back to a static card under prefers-reduced-motion.
 */
function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function ServiceCard({ service }: { service: Service }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const router = useRouter();

  const tilt = (e: ReactPointerEvent<HTMLAnchorElement>) => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    el.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
    el.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
    el.style.transform = `perspective(720px) rotateX(${(-(py - 0.5) * 9).toFixed(
      2,
    )}deg) rotateY(${((px - 0.5) * 9).toFixed(2)}deg) translateZ(6px)`;
  };

  const press = () => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    el.style.transform = "perspective(720px) translateZ(-8px) scale(0.975)";
  };

  const reset = () => {
    const el = ref.current;
    if (el) el.style.transform = "";
  };

  return (
    <Link
      ref={ref}
      href={`/servicos/${service.slug}`}
      onClick={(e) => {
        // Keep modified clicks (new tab, etc.) native; curtain the rest.
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        startPageTransition(
          () => router.push(`/servicos/${service.slug}`),
          `/servicos/${service.slug}`,
        );
      }}
      onPointerMove={tilt}
      onPointerDown={press}
      onPointerUp={tilt}
      onPointerLeave={reset}
      className="service-card group relative z-10 flex flex-col rounded-lg border border-white/10 bg-[#0a0f1c]/90 p-6 backdrop-blur-sm"
    >
      <span
        aria-hidden="true"
        className="block h-1 w-10 rounded-full"
        style={{ backgroundColor: service.accent }}
      />
      <p className="mt-5 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-ink-400">
        {service.card.eyebrow}
      </p>
      <h3 className="mt-2 text-xl font-semibold text-ink-100">
        {service.card.title}
      </h3>
      <p className="mt-3 flex-1 text-sm leading-6 text-ink-300">
        {service.card.text}
      </p>
      <span
        className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium transition-all group-hover:gap-2.5"
        style={{ color: service.accent }}
      >
        Ver serviço
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </span>
    </Link>
  );
}
