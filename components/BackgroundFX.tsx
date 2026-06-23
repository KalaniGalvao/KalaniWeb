"use client";

import { useEffect } from "react";

type RGB = [number, number, number];

// Palette stops for the four narrative acts.
const HERO: RGB = [7, 11, 22]; //  hero base   (#070b16)
const DARK: RGB = [2, 3, 10]; //   development  (#02030a) — the dim
const SHOW: RGB = [11, 20, 48]; // content      (#0b1430) — the brighten
const CTA: RGB = [10, 26, 68]; //  call-to-act  (#0a1a44) — deep blue glow

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const mix = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

/**
 * Drives the page background colour from scroll position so sections melt into
 * one another with no visible divider — the core of the brief's "no borders"
 * rule. Rather than several overlapping ScrollTriggers (which fight over the
 * same value at their boundaries), we derive one deterministic colour from the
 * live positions of the section anchors, then write it to the --page-bg CSS
 * variable. Cheap (one custom-property write per frame) and always defined.
 */
export function BackgroundFX() {
  useEffect(() => {
    const root = document.documentElement;

    const topOf = (id: string) => {
      const el = document.getElementById(id);
      // Sections that don't exist never contribute to a transition.
      return el ? el.getBoundingClientRect().top : Number.POSITIVE_INFINITY;
    };

    const update = () => {
      const vh = window.innerHeight || 1;
      const devTop = topOf("desenvolvimento");
      // Brighten only once we reach the SECOND content segment (saúde). The
      // first content hero (advocacia) is a dark scroll-video, so the page must
      // stay dark through it — that makes development → advocacia a seamless
      // black-to-hero transition with no blue band in between.
      const segTop = topOf("saude");
      const ctaTop = topOf("contato");

      // Each phase advances 0→1 as a section rises from the viewport bottom.
      const tDim = clamp01((vh - devTop) / vh); // hero → dark
      const tShow = clamp01((vh - segTop) / (vh * 0.5)); // dark → content
      const tCta = clamp01((vh - ctaTop) / (vh * 0.5)); // content → CTA

      // Sequential nesting: by the time a later phase begins, the earlier one
      // has reached 1, so the held colours stay consistent on both directions.
      let c = mix(HERO, DARK, tDim);
      c = mix(c, SHOW, tShow);
      c = mix(c, CTA, tCta);

      root.style.setProperty(
        "--page-bg",
        `rgb(${Math.round(c[0])} ${Math.round(c[1])} ${Math.round(c[2])})`,
      );
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return null;
}
