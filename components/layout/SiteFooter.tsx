import { NAV_LINKS, SITE } from "@/lib/site";

/**
 * Server-rendered footer. Real anchor links here reinforce internal linking for
 * crawlers and give a non-JS fallback for in-page navigation.
 */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/5">
      <div className="container-rail flex flex-col items-center justify-between gap-6 py-10 md:flex-row">
        <p className="text-lg font-semibold tracking-tightest text-ink-100">
          {SITE.name}
          <span className="text-clay">.</span>
        </p>

        <nav aria-label="Rodapé">
          <ul className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-sm text-ink-300 transition-colors hover:text-ink-100"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <p className="text-sm text-ink-400">
          © {year} {SITE.legalName}
        </p>
      </div>
    </footer>
  );
}
