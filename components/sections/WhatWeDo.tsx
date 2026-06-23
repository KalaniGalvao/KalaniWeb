const STEPS = [
  {
    number: "01",
    title: "Bate-Papo",
    text: "Primeiro conversamos sobre você e como você chegou até aqui, como gostaria de ser representado e como seu negócio funciona.",
  },
  {
    number: "02",
    title: "Desenvolvimento",
    text: "Farei um projeto com base nas nossas conversas com feedbacks regulares, montando uma página com animações dinâmicas e componentes que coincidem com a nossa visão.",
  },
  {
    number: "03",
    title: "Experiência e sensação",
    text: "Finalizado sua estrutura digital, nós iremos confirmar se tudo está devidamente representado e se a sensação que você buscava está sendo transpassada no website, para então, publicarmos ao mundo.",
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
              Como fazemos?
            </p>
            <h2
              id="what-we-do-title"
              className="mt-5 max-w-xl text-balance text-4xl font-semibold leading-[1.03] tracking-tightest text-ink-100 sm:text-5xl lg:text-6xl"
            >
              Veja abaixo exemplos de como vamos estruturar seu website.
            </h2>
          </div>

          <p className="max-w-2xl text-pretty text-base leading-8 text-ink-300 sm:text-lg">
            Utilizo de linguagens de programação e frameworks como React,
            Next.js e TypeScript para criar um ambiente digital que reflete a
            essência sua e do seu negócio, acrescentando sua identidade no seu
            negócio de uma forma clara, moderna e engajante.
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
        </div>
      </div>
    </section>
  );
}
