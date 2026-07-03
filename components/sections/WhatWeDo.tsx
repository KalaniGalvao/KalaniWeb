import { SERVICES } from "@/lib/site";
import { ServiceCard } from "./service/ServiceCard";

const STEPS = [
  {
    number: "01",
    title: "Bate-Papo",
    text: "Nosso primeiro passo é nos conhecermos para que possa me contar sobre você e seu negócio, o que gostaria de representar e o que gostaria de atingir. Faremos uma síntese em conjunto do modo que será estruturado seu ambiente digital, e partimos para segunda fase. Juntos.",
  },
  {
    number: "02",
    title: "Desenvolvimento",
    text: "Faremos um projeto com base em nossa estrutura, desenvolvendo e realizando feedbacks semanais para termos sempre alinhado seus gostos, seus objetivos e se a primeira versão está nos conformes de nossa visão.",
  },
  {
    number: "03",
    title: "Experiência e sensação",
    text: "Por fim, é apresentado o projeto finalizado, seu negócio em um cenário digital que fica de acordo com suas aspirações e objetivos. Com sua aprovação, colocamos o site on-line deixando-o devidamente consolidado e diferenciado no mercado.",
  },
] as const;

export function WhatWeDo() {
  return (
    <section
      id="oque-fazemos"
      aria-labelledby="what-we-do-title"
      className="relative overflow-hidden py-24 sm:py-32"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(201,111,76,0.16),transparent_34%),radial-gradient(circle_at_88%_65%,rgba(92,200,255,0.12),transparent_30%)]"
      />

      <div className="container-rail relative">
        <div className="grid gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-clay">
              Como atuamos?
            </p>
            <h2
              id="what-we-do-title"
              className="mt-5 max-w-xl text-balance text-4xl font-semibold leading-[1.03] tracking-tightest text-ink-100 sm:text-5xl lg:text-6xl"
            >
              Eficiência e representatividade
            </h2>
          </div>

          <p className="max-w-2xl text-pretty text-base leading-8 text-ink-300 sm:text-lg">
            Com frameworks atuais como Next.js e linguagens modernas como
            Typescript, React, Node otimizamos o código do seu site visando AEO
            (Answer Engine Optimization), GEO (Generative Engine Optimization) e
            SEO (Search Engine Optimization), garantindo um website do seu jeito
            e à altura do seu negócio. Veja nosso processo:
          </p>
        </div>

        <div className="relative mt-14 pb-10 md:pb-16">
          <div className="relative grid gap-5 md:grid-cols-3 md:gap-4">
            {STEPS.map((step) => (
              <article
                key={step.number}
                className="relative z-10 rounded-lg border border-white/10 bg-[#0a0f1c]/90 p-6 backdrop-blur-sm"
              >
                <p className="font-mono text-xs text-clay/80">{step.number}</p>
                <h3 className="mt-5 text-xl font-semibold text-ink-100">
                  {step.title}
                </h3>
                <p className="mt-4 text-sm leading-6 text-ink-300">
                  {step.text}
                </p>
              </article>
            ))}
          </div>

          {/* "Serviços" marker between the process cards and the service cards
              (also the scroll target for the hero's "Ver experiências" button). */}
          <div
            id="servicos"
            className="mb-4 mt-12 flex scroll-mt-24 items-center gap-4"
          >
            <span className="font-mono text-xs uppercase tracking-[0.28em] text-clay">
              Exemplos de serviços
            </span>
            <span aria-hidden="true" className="h-px flex-1 bg-white/10" />
          </div>

          <div className="grid gap-5 md:grid-cols-3 md:gap-4">
            {SERVICES.map((service) => (
              <ServiceCard key={service.slug} service={service} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
