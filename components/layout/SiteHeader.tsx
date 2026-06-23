"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { NAV_LINKS, SITE } from "@/lib/site";
import { smoothScrollTo } from "@/lib/scroll-store";

// Px from the top of the viewport within which the mouse reveals the nav.
const REVEAL_ZONE = 96;

export function SiteHeader() {
  const [show, setShow] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // The bar stays fully hidden and only slides down when the cursor approaches
  // the top edge of the page. Touch devices (no hover) can't aim at the edge,
  // so there we keep the bar available instead.
  useEffect(() => {
    const canHover = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;
    if (!canHover) {
      setShow(true);
      return;
    }
    const onMove = (e: PointerEvent) => setShow(e.clientY <= REVEAL_ZONE);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  // Anchors are real hrefs (work without JS); JS upgrades them to a smooth glide.
  const go = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuOpen(false);
    smoothScrollTo(href);
  };

  const visible = show || menuOpen;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-[#070b16cc] backdrop-blur-xl transition-transform duration-300 ${
        visible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <nav
        aria-label="Navegação principal"
        className="container-rail flex h-16 items-center justify-between"
      >
        <a
          href="#inicio"
          onClick={go("#inicio")}
          className="text-lg font-semibold tracking-tightest text-ink-100"
        >
          {SITE.name}
          <span className="text-clay">.</span>
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
          className="hidden rounded-full bg-clay px-5 py-2 text-sm font-medium text-cream transition hover:bg-clay-light md:inline-block"
        >
          Começar
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
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
