/**
 * Single source of truth for brand + SEO data. Importing from one place keeps
 * <head> metadata, JSON-LD structured data, the sitemap and the UI copy in sync.
 */

export const SITE = {
  name: "Kalani",
  twitter: "@kalani.studio",
  legalName: "Reestruturações Digitais",
  // Configure the production origin via env at deploy time; this fallback keeps
  // canonical/OG URLs absolute (required by crawlers) during local dev.
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://kalani.studio").replace(
    /\/$/,
    "",
  ),
  Idioma: ["pt-BR", "EN-US"],
  email: "kalani.profissional@gmail.com",
  description:
    "Desenvolvedor Web e UX/UI design, utilizando de frameworks e linguagens atuais que garantem um retorno.",
  // Short, keyword-led tagline reused in OG image + hero eyebrow.
  tagline: "Experiências digitais que prendem a atenção.",
} as const;

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

/** Primary nav — anchors map to section ids on the single-page experience. */
export const NAV_LINKS = [
  { href: "#inicio", label: "Início" },
  { href: "#oque-fazemos", label: "O que fazemos" },
  { href: "#desenvolvimento", label: "O desafio" },
  { href: "#beleza", label: "Beleza" },
  { href: "#segmentos", label: "Segmentos" },
  { href: "#contato", label: "Contato" },
] as const;
