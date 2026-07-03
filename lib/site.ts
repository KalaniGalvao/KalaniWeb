/**
 * Single source of truth for brand + SEO data. Importing from one place keeps
 * <head> metadata, JSON-LD structured data, the sitemap and the UI copy in sync.
 */

export const SITE = {
  name: "BNO",
  legalName: "BNO - Build and Optimize",
  // Configure the production origin via env at deploy time; this fallback keeps
  // canonical/OG URLs absolute (required by crawlers) during local dev.
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://kalani.studio").replace(
    /\/$/,
    "",
  ),
  Idioma: ["pt-BR", "EN-US"],
  email: "kalani.profissional@gmail.com",
  whatsapp: "5512997399123",
  description:
    "Desenvolvedor Web e UX/UI design, utilizando de frameworks e linguagens atuais que garantem um retorno.",
  // Short, keyword-led tagline reused in OG image + hero eyebrow.
  tagline: "Experiências digitais que prendem a atenção.",
} as const;

/** WhatsApp deep link (prefilled message) used by every "Começar projeto" CTA. */
export const WHATSAPP_URL = `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(
  "Olá! Quero começar um projeto com a BNO.",
)}`;

/**
 * Words scattered across the "development" act, revealed one by one on scroll.
 * Order = reveal order (index 0 first). Positions live in the Development
 * component, index-matched to this array.
 */
export const DEVELOPMENT_WORDS = [
  "Retenção de atenção",
  "Engajamento",
  "Confiança",
  "Conversão",
  "Credibilidade",
  "Visibilidade",
  "Relevância",
  "Diferenciação",
  "Presença",
] as const;

export type Segment = {
  id: string;
  /** Visual side of the mini-hero; alternates down the page. */
  align: "left" | "right";
  eyebrow: string;
  title: string;
  description: string;
  highlights: string[];
  accent: string; // hex used by the preview's signature animation
};

/** The active "hero preview" segments in the content act. */
export const SEGMENTS: Segment[] = [
  {
    id: "advocacia",
    align: "left",
    eyebrow: "Autoridade que se sente no primeiro segundo",
    title: "Para escritórios de advocacia e profissionais do direito",
    description:
      "Construiremos um website que garante uma retenção e autoridade para o seu serviço, com animações, vídeos e componentes que mostram exatamente a imagem você quer passar para seus clientes.",
    highlights: [
      "Captação de casos qualificados",
      "Provas sociais e cases em destaque",
      "Agendamento de consulta sem fricção",
    ],
    accent: "#c9a96a",
  },
  {
    id: "saude",
    align: "right",
    eyebrow: "Interatividade que auxilia seu paciente",
    title: "Para profissionais da saúde",
    description:
      "Faremos modelos interativos e explicações claras e visuais para seu paciente, auxiliando-o a entender todo o procedimento ou situação a qual ele tenha dúvida.",
    highlights: [
      "Agendamento e triagem online",
      "Especialidades com clareza",
      "Acolhimento desde a primeira tela",
    ],
    accent: "#54e6b5",
  },
];

/**
 * Services shown as cards in the "What we do" section, each with its own
 * dedicated page at /servicos/{slug}. The dedicated page reuses the SAME hero
 * component as the homepage segment (video / anatomy / beauty). Source of truth
 * for the cards, the page copy, SEO and the "how we develop" + benefits blocks.
 */
export type ServiceHeroKind = "video" | "anatomy" | "beauty";

export type Service = {
  slug: string;
  hero: ServiceHeroKind;
  accent: string;
  /** Links to a SEGMENTS entry for heroes that need `segment` data. */
  segmentId?: string;
  /** Video source for the scroll-scrubbed hero. */
  videoSrc?: string;
  card: { eyebrow: string; title: string; text: string };
  page: { eyebrow: string; title: string; intro: string };
  approach: { title: string; text: string }[];
  benefits: string[];
  metaTitle: string;
  metaDescription: string;
};

export const SERVICES: Service[] = [
  {
    slug: "advocacia",
    hero: "video",
    accent: "#c9a96a",
    segmentId: "advocacia",
    videoSrc: "/advocacia.mp4",
    card: {
      eyebrow: "Profissionais do Direito",
      title: "Autoridade, jus ao seu nome.",
      text: "Seu website demonstra sua capacidade e devido respeito ao se depararem com o(a) Doutor(a).",
    },
    page: {
      eyebrow: "Para escritórios de advocacia",
      title: "Autoridade que se sente no primeiro segundo",
      intro:
        "Ao entendermos a sua dor e o que você quer transmitir para seus clientes, desenvolveremos componentes de acordo, variando de banco de dados com leis relevantes, ou uma facilitação para compreensão do processo de seu cliente.",
    },
    approach: [
      {
        title: "Conversa e análise",
        text: "Analisaremos como devemos agir para transmitir a autoridade devida e quais devem ser os componentes criados para o seu ambiente digital.",
      },
      {
        title: "Execução",
        text: "Faremos os componentes correlatos para seu serviço, seja civil, trabalhista, previdenciário ou tributário — nosso projeto fica de acordo com suas vontades e necessidades, auxiliando no agendamento e na compreensão do cliente.",
      },
      {
        title: "Publicação",
        text: "Com o código finalizado e otimizado para AEO, GEO e SEO, publicamos e deixamos-o On-line, marcando um novo começo para seu trabalho.",
      },
    ],
    benefits: [
      "Captação de casos qualificados",
      "Provas sociais e cases em destaque",
      "Agendamento de consulta sem fricção",
      "Imagem de autoridade e confiança",
    ],
    metaTitle: "Sites para advocacia",
    metaDescription:
      "Experiências digitais que constroem autoridade para escritórios de advocacia — vídeo, animação e performance com SEO técnico.",
  },
  {
    slug: "saude",
    hero: "anatomy",
    accent: "#54e6b5",
    segmentId: "saude",
    card: {
      eyebrow: "Saúde & Clínicas",
      title: "Explicação na medida certa",
      text: "Modelos interativos que ajudam o paciente a entender cada procedimento.",
    },
    page: {
      eyebrow: "Para profissionais da saúde",
      title: "Clareza que acolhe o paciente",
      intro:
        "Ao entendermos a sua dor e a dos seus pacientes, desenvolveremos componentes de acordo, variando de modelos de explicação ou vídeos interativos para que seus pacientes não fiquem com dúvidas no procedimento.",
    },
    approach: [
      {
        title: "Conversa e análise",
        text: "Analisaremos o setor de atuação e quais devem ser as medidas cabíveis para assegurarmos um desenvolvimento consoante da área.",
      },
      {
        title: "Execução",
        text: "Faremos os componentes correlatos para seu serviço, seja dental, ortopédico, clínico ou cirurgião — nosso projeto fica de acordo com suas vontades e necessidades, auxiliando no agendamento e na compreensão do paciente.",
      },
      {
        title: "Publicação",
        text: "Com o código finalizado e otimizado para AEO, GEO e SEO, publicamos e deixamos-o On-line, marcando um novo começo para seu trabalho.",
      },
    ],
    benefits: [
      "Agendamento e triagem online",
      "Especialidades explicadas com clareza",
      "Acolhimento desde a primeira tela",
      "Menos dúvidas, mais consultas",
    ],
    metaTitle: "Sites para saúde e clínicas",
    metaDescription:
      "Modelos interativos e explicações visuais para profissionais da saúde — acolhimento, clareza e agendamento online.",
  },
  {
    slug: "beleza",
    hero: "beauty",
    accent: "#c25a7a",
    card: {
      eyebrow: "Beleza & Estética",
      title: "Certeza no visual e facilidade no agendamento",
      text: "Deixe o cliente visualizar o novo look e agendar sua transformação diretamente no website.",
    },
    page: {
      eyebrow: "Para segmentos de beleza",
      title: "Troque o visual e veja a transformação",
      intro:
        "Ao entendermos a sua dor e o que você quer transmitir para seus clientes, montaremos experiências interativas que asseguram agendamentos através do próprio website.",
    },
    approach: [
      {
        title: "Conversa e análise",
        text: 'Analisaremos como queremos estruturar seu "salão digital", quais são os componentes que fazem sentido, e quais não, formando um cenário digital do seu jeito.',
      },
      {
        title: "Execução",
        text: "Faremos os componentes correlatos para seu serviço, seja unhas, cabelos, sobrancelhas ou moda — nosso projeto fica de acordo com suas vontades e necessidades, auxiliando no agendamento e na visão do cliente.",
      },
      {
        title: "Publicação",
        text: "Com o código finalizado e otimizado para AEO, GEO e SEO, publicamos e deixamos-o On-line, marcando um novo começo para seu trabalho.",
      },
    ],

    benefits: [
      "Provador de visual interativo",
      "Portfólio que vende sozinho",
      "Agendamento direto no clique",
      "Marca memorável e desejável",
    ],
    metaTitle: "Sites para beleza e estética",
    metaDescription:
      "Provadores interativos e portfólio que vende para salões, clínicas estéticas e marcas de beleza — com agendamento no clique.",
  },
];

export function getService(slug: string): Service | undefined {
  return SERVICES.find((service) => service.slug === slug);
}

/** Primary nav — anchors map to section ids on the single-page experience. */
export const NAV_LINKS = [
  { href: "#inicio", label: "Início" },
  { href: "#oque-fazemos", label: "O que fazemos" },
  { href: "#desenvolvimento", label: "O desafio" },
  { href: "#saude", label: "Medicina" },
  { href: "#beleza", label: "Beleza" },
  { href: "#segmentos", label: "Segmentos" },
  { href: "#contato", label: "Contato" },
] as const;
