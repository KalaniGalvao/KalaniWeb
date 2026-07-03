"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { NAV_LINKS, SITE, getService } from "@/lib/site";
import { smoothScrollTo } from "@/lib/scroll-store";

// Nav hrefs whose target section has an entrance animation to (re)play on click.
// #segmentos lands on the first hero (advocacia).
const INTRO_IDS: Record<string, string> = {
  "#saude": "saude",
  "#beleza": "beleza",
  "#segmentos": "advocacia",
};

// Per-service header theming for the dedicated /servicos/* pages. The shared nav
// + links stay intact; only the brand lockup, accent and CTA change so each page
// reads as its own space (e.g. "BNO · Medicina" + "Agendar consulta" in green).
const SERVICE_LABEL: Record<string, string> = {
  advocacia: "Advocacia",
  saude: "Medicina",
  beleza: "Beleza",
};
const SERVICE_CTA: Record<string, string> = {
  advocacia: "Agendar consulta",
  saude: "Agendar consulta",
  beleza: "Agendar horário",
};
const SERVICE_CTA_TEXT: Record<string, string> = {
  advocacia: "#0a0f1c",
  saude: "#04140f",
  beleza: "#ffffff",
};
const SERVICE_HEADER_BG: Record<string, string> = {
  advocacia: "#0b0906e6",
  saude: "#06140fe6",
  beleza: "#140810e6",
};

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const slug = pathname?.startsWith("/servicos/")
    ? pathname.split("/")[2]
    : undefined;
  const service = slug ? getService(slug) : undefined;
  const themed = Boolean(service && slug);
  const accent = service?.accent;
  const serviceLabel = slug ? SERVICE_LABEL[slug] : undefined;
  const ctaLabel = slug ? SERVICE_CTA[slug] ?? "Agendar consulta" : "Começar";
  const ctaText = slug ? SERVICE_CTA_TEXT[slug] ?? "#0a0f1c" : undefined;

  // Anchors are real hrefs (work without JS); JS upgrades them to a smooth glide.
  // On pages where the target section doesn't exist (e.g. a /servicos/* page),
  // fall back to navigating home with the hash ("/#inicio") instead of a no-op.
  const go = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuOpen(false);
    if (href.startsWith("#") && !document.querySelector(href)) {
      window.location.href = `/${href}`;
      return;
    }
    smoothScrollTo(href);
    // Replay the target section's entrance animation as we arrive at it.
    const introId = INTRO_IDS[href];
    if (introId) {
      window.setTimeout(
        () =>
          window.dispatchEvent(
            new CustomEvent("bno:intro", { detail: { id: introId } }),
          ),
        400,
      );
    }
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b border-white/5 backdrop-blur-xl ${
        themed ? "" : "bg-[#070b16cc]"
      }`}
      style={themed && slug ? { backgroundColor: SERVICE_HEADER_BG[slug] } : undefined}
    >
      <nav
        aria-label="Navegação principal"
        className="container-rail flex h-16 items-center justify-between"
      >
        <a
          href="#inicio"
          onClick={go("#inicio")}
          className="flex items-center text-lg font-semibold tracking-tightest text-ink-100"
        >
          {SITE.name}
          <span
            className={themed ? "" : "text-clay"}
            style={themed ? { color: accent } : undefined}
          >
            .
          </span>
          {serviceLabel && (
            <span className="ml-2.5 border-l border-white/20 pl-2.5 text-xs font-medium uppercase tracking-[0.18em] text-ink-300">
              {serviceLabel}
            </span>
          )}
        </a>

        <ul className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={go(link.href)}
                className="text-sm text-ink-300 transition-colors hover:text-ink-100"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <a
          href="#contato"
          onClick={go("#contato")}
          className={`hidden rounded-full px-5 py-2 text-sm font-medium transition md:inline-block ${
            themed
              ? "hover:brightness-110"
              : "bg-clay text-cream hover:bg-clay-light"
          }`}
          style={themed ? { backgroundColor: accent, color: ctaText } : undefined}
        >
          {ctaLabel}
        </a>

        {/* Mobile menu toggle */}
        <button
          type="button"
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-100 md:hidden"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
            {menuOpen ? (
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            ) : (
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            )}
          </svg>
        </button>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-b border-white/5 bg-[#070b16f2] backdrop-blur-xl md:hidden"
          >
            <ul className="container-rail flex flex-col gap-1 py-4">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={go(link.href)}
                    className="block rounded-lg px-2 py-3 text-ink-200 transition hover:bg-white/5 hover:text-ink-100"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li className="mt-2">
                <a
                  href="#contato"
                  onClick={go("#contato")}
                  className={`block rounded-full px-4 py-3 text-center text-sm font-medium ${
                    themed ? "" : "bg-clay text-cream"
                  }`}
                  style={
                    themed ? { backgroundColor: accent, color: ctaText } : undefined
                  }
                >
                  {ctaLabel}
                </a>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
