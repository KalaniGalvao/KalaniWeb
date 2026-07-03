import { SERVICES } from "@/lib/site";
import { ServiceCard } from "./ServiceCard";

/**
 * "Outros serviços" — cross-links at the foot of a service page to the OTHER
 * service pages. Same card language as the WhatWeDo services grid.
 */
export function OtherServices({ currentSlug }: { currentSlug: string }) {
  const others = SERVICES.filter((service) => service.slug !== currentSlug);

  return (
    <section
      aria-labelledby="other-services-title"
      className="relative bg-[#070b16] py-24 sm:py-28"
    >
      <div className="container-rail">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-clay">
          Outros serviços
        </p>
        <h2
          id="other-services-title"
          className="mt-4 max-w-xl text-balance text-3xl font-semibold leading-[1.05] tracking-tightest text-ink-100 sm:text-4xl"
        >
          Explore outras experiências.
        </h2>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {others.map((service) => (
            <ServiceCard key={service.slug} service={service} />
          ))}
        </div>
      </div>
    </section>
  );
}
