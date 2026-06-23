"use client";

import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Segment } from "@/lib/site";
import { smoothScrollTo } from "@/lib/scroll-store";

type LayerId = "body" | "skeleton" | "organs";

type AnatomyPart = {
  id: string;
  label: string;
  description: string;
  marker: { x: number; y: number };
  transform?: string;
  paths: string[];
};

type AnatomyLayer = {
  id: LayerId;
  tab: string;
  heading: string;
  image: string;
  alt: string;
  /**
   * Registration transform (source-space): maps this layer's figure onto the
   * body layer's figure so the model occupies the SAME position on every
   * layer. Derived from matching skull-center → feet anchors between images.
   * Applied to the <image> and its hotspots together, so they stay glued.
   */
  align: { s: number; tx: number; ty: number };
  parts: AnatomyPart[];
};

/**
 * Soft elliptical window (source-space, body-layer coordinates) around the
 * registered figure. Overlay layers (skeleton/órgãos) are masked to this
 * region, so the surrounding park ALWAYS comes from the base body image —
 * the scene never changes, only the figure inside the window does.
 */
const FIGURE = { cx: 1150, cy: 565, r: 500, squeeze: 0.62 };

/*
 * All coordinates are in the 1536×1024 source-image space. The BODY layer's
 * geometry was measured from the actual pixels (canvas analysis of the figure
 * silhouette: head top y=251, face center x≈1176, crotch y≈592, shoe soles
 * y≈888), so the hotspots sit exactly on the model.
 */

/** Ellipse as an SVG path (two arcs). */
const ellipsePath = (cx: number, cy: number, rx: number, ry: number) =>
  `M${cx - rx} ${cy} a${rx} ${ry} 0 1 0 ${rx * 2} 0 a${rx} ${ry} 0 1 0 ${-rx * 2} 0 Z`;

/** Rounded "limb" capsule between two points — organic, never a box. */
const capsule = (x1: number, y1: number, x2: number, y2: number, r: number) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * r;
  const ny = (dx / len) * r;
  const f = (n: number) => Math.round(n * 10) / 10;
  return [
    `M${f(x1 + nx)} ${f(y1 + ny)}`,
    `L${f(x2 + nx)} ${f(y2 + ny)}`,
    `A${r} ${r} 0 0 1 ${f(x2 - nx)} ${f(y2 - ny)}`,
    `L${f(x1 - nx)} ${f(y1 - ny)}`,
    `A${r} ${r} 0 0 1 ${f(x1 + nx)} ${f(y1 + ny)}`,
    "Z",
  ].join(" ");
};

// Maps corrected skeleton-space hotspots onto the base body image.
const SKELETON_TO_BODY = "translate(125 97) scale(0.85)";
const skeletonPoint = (x: number, y: number) => ({
  x: x * 0.85 + 125,
  y: y * 0.85 + 97,
});

/*
 * Coordinates re-measured with POSITIVE color detection (skin / beige sweater /
 * navy jeans / white sneakers), which is immune to the figure's shadow that
 * biased the first not-green pass: face cx 1178 (box 1150–1206, y286–356),
 * raised palm cx 1082 cy 363, torso beige 1140–1254, pants 1108–1232 (top 552,
 * ankles 812), shoe soles end ≈ y870, hanging hand cx 1242 cy 585.
 */
const BODY_PARTS: AnatomyPart[] = [
  {
    id: "head",
    label: "Cabeça",
    description: "Região que abriga encéfalo, olhos, ouvidos, nariz e boca.",
    marker: skeletonPoint(1237, 230),
    transform: SKELETON_TO_BODY,
    paths: [
      "M1201 213 C1205 185 1220 178 1239 179 C1261 180 1274 198 1272 228 C1270 255 1256 274 1237 274 C1216 273 1200 250 1201 213 Z",
      "M1216 248 C1228 261 1248 261 1260 248 L1255 280 C1247 290 1227 290 1219 280 Z",
    ],
  },
  {
    id: "neck",
    label: "Pescoço",
    description: "Liga a cabeça ao tórax.",
    marker: skeletonPoint(1237, 314),
    transform: SKELETON_TO_BODY,
    paths: [capsule(1236, 274, 1237, 352, 18)],
  },
  {
    id: "chest",
    label: "Tórax",
    description: "Região onde ficam coração e pulmões.",
    marker: skeletonPoint(1237, 369),
    transform: SKELETON_TO_BODY,
    paths: [
      "M1168 298 C1190 283 1210 286 1237 286 C1264 286 1287 289 1304 307 C1312 340 1307 430 1290 467 C1265 482 1210 482 1185 466 C1167 430 1162 340 1168 298 Z",
    ],
  },
  {
    id: "abs",
    label: "Abdômen",
    description: "Área abdominal que abriga grande parte dos órgãos digestivos.",
    marker: skeletonPoint(1237, 500),
    transform: SKELETON_TO_BODY,
    paths: [
      "M1187 452 C1213 462 1261 462 1287 452 L1297 472 L1294 548 C1276 570 1198 570 1180 548 L1177 472 Z",
    ],
  },
  {
    id: "waist",
    label: "Cintura",
    description: "Transição entre abdômen e pelve.",
    marker: skeletonPoint(1237, 527),
    transform: SKELETON_TO_BODY,
    paths: [
      "M1177 472 C1201 455 1273 455 1297 472 L1294 548 C1276 570 1198 570 1180 548 Z",
    ],
  },
  {
    id: "right-arm",
    label: "Braço direito",
    description: "Membro superior direito.",
    marker: skeletonPoint(1129, 364),
    transform: SKELETON_TO_BODY,
    paths: [
      "M1169 301 C1147 306 1131 329 1121 369 C1114 398 1118 421 1130 432 C1145 426 1156 407 1163 379 Z",
      capsule(1119, 304, 1127, 420, 17),
    ],
  },
  {
    id: "right-hand",
    label: "Mão direita",
    description: "Mão direita, responsável por preensão e movimentos finos.",
    marker: skeletonPoint(1118, 276),
    transform: SKELETON_TO_BODY,
    paths: [
      "M1098 244 C1112 232 1131 239 1138 256 C1142 275 1132 294 1118 298 C1104 292 1096 263 1098 244 Z",
    ],
  },
  {
    id: "left-arm",
    label: "Braço esquerdo",
    description: "Membro superior esquerdo.",
    marker: skeletonPoint(1325, 424),
    transform: SKELETON_TO_BODY,
    paths: [
      "M1306 301 C1326 309 1337 338 1340 376 C1343 406 1339 429 1327 439 C1314 430 1308 406 1308 377 Z",
      "M1325 429 C1338 433 1346 451 1347 477 C1348 504 1342 530 1331 545 C1317 539 1311 515 1314 490 Z",
    ],
  },
  {
    id: "left-hand",
    label: "Mão esquerda",
    description: "Mão esquerda, responsável por preensão e movimentos finos.",
    marker: skeletonPoint(1322, 566),
    transform: SKELETON_TO_BODY,
    paths: [
      "M1310 541 C1322 534 1336 542 1339 558 C1341 575 1334 588 1323 590 C1312 584 1305 556 1310 541 Z",
    ],
  },
  {
    id: "right-leg",
    label: "Perna direita",
    description: "Membro inferior direito.",
    marker: skeletonPoint(1188, 702),
    transform: SKELETON_TO_BODY,
    paths: [
      "M1171 548 C1185 539 1206 543 1212 560 L1209 694 C1206 713 1195 723 1181 716 C1173 698 1167 577 1171 548 Z",
      "M1179 691 C1188 683 1201 685 1207 696 C1209 708 1201 717 1190 718 C1179 716 1174 702 1179 691 Z",
      "M1179 716 C1192 709 1205 716 1208 732 L1205 848 C1202 866 1191 874 1180 866 C1174 848 1174 740 1179 716 Z",
    ],
  },
  {
    id: "left-leg",
    label: "Perna esquerda",
    description: "Membro inferior esquerdo.",
    marker: skeletonPoint(1278, 702),
    transform: SKELETON_TO_BODY,
    paths: [
      "M1259 560 C1266 543 1287 539 1301 548 C1305 577 1299 698 1291 716 C1277 723 1266 713 1263 694 Z",
      "M1267 696 C1273 685 1286 683 1295 691 C1300 702 1295 716 1284 718 C1273 717 1265 708 1267 696 Z",
      "M1262 732 C1265 716 1278 709 1291 716 C1297 740 1297 848 1290 866 C1279 874 1268 866 1265 848 Z",
    ],
  },
  {
    id: "right-foot",
    label: "Pé direito",
    description: "Pé direito, base de apoio e equilíbrio.",
    marker: skeletonPoint(1174, 889),
    transform: SKELETON_TO_BODY,
    paths: [
      "M1148 860 C1168 852 1203 857 1210 879 C1199 905 1150 911 1138 893 C1135 879 1141 868 1148 860 Z",
    ],
  },
  {
    id: "left-foot",
    label: "Pé esquerdo",
    description: "Pé esquerdo, base de apoio e equilíbrio.",
    marker: skeletonPoint(1294, 889),
    transform: SKELETON_TO_BODY,
    paths: [
      "M1264 879 C1271 857 1306 852 1326 860 C1334 868 1339 879 1336 893 C1324 911 1275 905 1264 879 Z",
    ],
  },
];

const SKELETON_PARTS: AnatomyPart[] = [
  {
    id: "skull",
    label: "Crânio",
    description: "Estrutura óssea que protege o encéfalo e forma a face.",
    marker: { x: 1237, y: 215 },
    paths: [
      "M1201 213 C1205 185 1220 178 1239 179 C1261 180 1274 198 1272 228 C1270 255 1256 274 1237 274 C1216 273 1200 250 1201 213 Z",
    ],
  },
  {
    id: "mandible",
    label: "Mandíbula",
    description: "Osso móvel da face.",
    marker: { x: 1237, y: 270 },
    paths: [
      "M1216 248 C1228 261 1248 261 1260 248 L1255 280 C1247 290 1227 290 1219 280 Z",
    ],
  },
  {
    id: "spine",
    label: "Coluna vertebral",
    description: "Eixo ósseo que sustenta o corpo e protege a medula.",
    marker: { x: 1237, y: 407 },
    paths: [
      "M1227 276 C1232 321 1230 377 1232 431 C1234 474 1231 513 1234 552 L1247 552 C1244 513 1248 474 1246 431 C1244 376 1247 321 1244 276 Z",
    ],
  },
  {
    id: "ribcage",
    label: "Caixa torácica",
    description: "Costelas e esterno que protegem coração e pulmões.",
    marker: { x: 1237, y: 369 },
    paths: [
      "M1168 298 C1190 283 1210 286 1237 286 C1264 286 1287 289 1304 307 C1312 340 1307 430 1290 467 C1265 482 1210 482 1185 466 C1167 430 1162 340 1168 298 Z",
    ],
  },
  {
    id: "pelvis",
    label: "Pelve",
    description: "Anel ósseo que liga a coluna aos membros inferiores.",
    marker: { x: 1237, y: 527 },
    paths: [
      "M1177 472 C1201 455 1273 455 1297 472 L1294 548 C1276 570 1198 570 1180 548 Z",
    ],
  },
  {
    id: "right-humerus",
    label: "Úmero direito",
    description: "Osso longo do braço direito.",
    marker: { x: 1138, y: 365 },
    paths: [
      "M1169 301 C1147 306 1131 329 1121 369 C1114 398 1118 421 1130 432 C1145 426 1156 407 1163 379 Z",
    ],
  },
  {
    id: "right-radius-ulna",
    label: "Rádio e ulna direitos",
    description: "Ossos do antebraço direito.",
    // The arm is RAISED: the forearm bridges the hand bones (≈1118, 298) down
    // to the humerus' elbow end (≈1126, 425) — it does not hang by the hip.
    marker: { x: 1123, y: 360 },
    paths: [capsule(1119, 304, 1127, 420, 17)],
  },
  {
    id: "right-hand-bones",
    label: "Ossos da mão direita",
    description: "Carpos, metacarpos e falanges da mão direita.",
    marker: { x: 1118, y: 276 },
    paths: [
      "M1098 244 C1112 232 1131 239 1138 256 C1142 275 1132 294 1118 298 C1104 292 1096 263 1098 244 Z",
    ],
  },
  {
    id: "left-humerus",
    label: "Úmero esquerdo",
    description: "Osso longo do braço esquerdo.",
    marker: { x: 1321, y: 372 },
    paths: [
      "M1306 301 C1326 309 1337 338 1340 376 C1343 406 1339 429 1327 439 C1314 430 1308 406 1308 377 Z",
    ],
  },
  {
    id: "left-radius-ulna",
    label: "Rádio e ulna esquerdos",
    description: "Ossos do antebraço esquerdo.",
    marker: { x: 1328, y: 474 },
    paths: [
      "M1325 429 C1338 433 1346 451 1347 477 C1348 504 1342 530 1331 545 C1317 539 1311 515 1314 490 Z",
    ],
  },
  {
    id: "left-hand-bones",
    label: "Ossos da mão esquerda",
    description: "Carpos, metacarpos e falanges da mão esquerda.",
    marker: { x: 1322, y: 566 },
    paths: [
      "M1310 541 C1322 534 1336 542 1339 558 C1341 575 1334 588 1323 590 C1312 584 1305 556 1310 541 Z",
    ],
  },
  {
    id: "right-femur",
    label: "Fêmur direito",
    description: "Maior osso do corpo, localizado na coxa direita.",
    marker: { x: 1190, y: 625 },
    paths: [
      "M1171 548 C1185 539 1206 543 1212 560 L1209 694 C1206 713 1195 723 1181 716 C1173 698 1167 577 1171 548 Z",
    ],
  },
  {
    id: "left-femur",
    label: "Fêmur esquerdo",
    description: "Maior osso do corpo, localizado na coxa esquerda.",
    marker: { x: 1277, y: 625 },
    paths: [
      "M1259 560 C1266 543 1287 539 1301 548 C1305 577 1299 698 1291 716 C1277 723 1266 713 1263 694 Z",
    ],
  },
  {
    id: "right-patella",
    label: "Patela direita",
    description: "Osso anterior do joelho direito.",
    marker: { x: 1190, y: 704 },
    paths: [
      "M1179 691 C1188 683 1201 685 1207 696 C1209 708 1201 717 1190 718 C1179 716 1174 702 1179 691 Z",
    ],
  },
  {
    id: "left-patella",
    label: "Patela esquerda",
    description: "Osso anterior do joelho esquerdo.",
    marker: { x: 1278, y: 704 },
    paths: [
      "M1267 696 C1273 685 1286 683 1295 691 C1300 702 1295 716 1284 718 C1273 717 1265 708 1267 696 Z",
    ],
  },
  {
    id: "right-tibia-fibula",
    label: "Tíbia e fíbula direitas",
    description: "Ossos da perna direita.",
    marker: { x: 1187, y: 786 },
    paths: [
      "M1179 716 C1192 709 1205 716 1208 732 L1205 848 C1202 866 1191 874 1180 866 C1174 848 1174 740 1179 716 Z",
    ],
  },
  {
    id: "left-tibia-fibula",
    label: "Tíbia e fíbula esquerdas",
    description: "Ossos da perna esquerda.",
    marker: { x: 1280, y: 786 },
    paths: [
      "M1262 732 C1265 716 1278 709 1291 716 C1297 740 1297 848 1290 866 C1279 874 1268 866 1265 848 Z",
    ],
  },
  {
    id: "right-foot-bones",
    label: "Ossos do pé direito",
    description: "Ossos do pé direito.",
    marker: { x: 1174, y: 889 },
    paths: [
      "M1148 860 C1168 852 1203 857 1210 879 C1199 905 1150 911 1138 893 C1135 879 1141 868 1148 860 Z",
    ],
  },
  {
    id: "left-foot-bones",
    label: "Ossos do pé esquerdo",
    description: "Ossos do pé esquerdo.",
    marker: { x: 1294, y: 889 },
    paths: [
      "M1264 879 C1271 857 1306 852 1326 860 C1334 868 1339 879 1336 893 C1324 911 1275 905 1264 879 Z",
    ],
  },
];

const ORGAN_PARTS: AnatomyPart[] = [
  {
    id: "brain",
    label: "Cérebro",
    description: "Centro de integração do sistema nervoso.",
    marker: { x: 1194, y: 292 },
    paths: [
      "M1167 285 C1171 267 1184 275 1197 275 C1211 275 1221 287 1219 306 C1217 324 1206 336 1193 336 C1178 334 1165 318 1167 285 Z",
    ],
  },
  {
    id: "tongue",
    label: "Língua",
    description: "Órgão muscular associado à fala, paladar e deglutição.",
    marker: { x: 1193, y: 347 },
    paths: [
      "M1184 341 C1190 336 1199 336 1205 341 C1203 352 1187 354 1184 341 Z",
    ],
  },
  {
    id: "trachea",
    label: "Traqueia",
    description: "Canal que conduz o ar até os brônquios.",
    marker: { x: 1194, y: 393 },
    paths: [
      "M1186 349 L1201 349 L1203 431 L1184 431 Z",
    ],
  },
  {
    id: "right-lung",
    label: "Pulmão direito",
    description: "Pulmão direito, responsável pelas trocas gasosas.",
    marker: { x: 1166, y: 438 },
    paths: [
      "M1157 399 C1139 412 1136 447 1141 478 C1146 503 1158 518 1174 513 C1185 494 1185 454 1182 423 C1175 410 1166 402 1157 399 Z",
    ],
  },
  {
    id: "left-lung",
    label: "Pulmão esquerdo",
    description: "Pulmão esquerdo, responsável pelas trocas gasosas.",
    marker: { x: 1221, y: 438 },
    paths: [
      "M1231 399 C1248 412 1253 447 1248 478 C1243 502 1232 516 1217 512 C1205 493 1204 454 1207 423 C1214 410 1222 402 1231 399 Z",
    ],
  },
  {
    id: "heart",
    label: "Coração",
    description: "Órgão muscular que bombeia o sangue.",
    marker: { x: 1195, y: 464 },
    paths: [
      "M1184 440 C1194 430 1209 436 1213 449 C1218 466 1209 486 1194 499 C1179 486 1172 463 1177 449 C1179 445 1181 442 1184 440 Z",
    ],
  },
  {
    id: "liver",
    label: "Fígado",
    description: "Participa do metabolismo e da produção da bile.",
    marker: { x: 1166, y: 511 },
    paths: [
      "M1137 488 C1164 476 1201 480 1214 496 C1209 522 1182 536 1147 530 C1137 520 1133 503 1137 488 Z",
    ],
  },
  {
    id: "stomach",
    label: "Estômago",
    description: "Recebe o alimento e participa da digestão.",
    marker: { x: 1219, y: 522 },
    paths: [
      "M1210 493 C1227 489 1241 501 1240 522 C1239 545 1223 558 1207 550 C1197 537 1198 510 1210 493 Z",
    ],
  },
  {
    id: "right-kidney",
    label: "Rim direito",
    description: "Filtra o sangue e participa do equilíbrio de líquidos.",
    marker: { x: 1162, y: 554 },
    paths: [
      "M1153 535 C1165 530 1176 540 1175 555 C1174 572 1164 583 1153 577 C1145 566 1145 545 1153 535 Z",
    ],
  },
  {
    id: "left-kidney",
    label: "Rim esquerdo",
    description: "Filtra o sangue e participa do equilíbrio de líquidos.",
    marker: { x: 1226, y: 554 },
    paths: [
      "M1214 537 C1225 530 1237 540 1236 556 C1235 572 1226 582 1215 577 C1206 566 1207 546 1214 537 Z",
    ],
  },
  {
    id: "large-intestine",
    label: "Intestino grosso",
    description: "Absorve água e forma o conteúdo fecal.",
    marker: { x: 1193, y: 577 },
    paths: [
      "M1149 536 C1138 548 1139 598 1151 610 C1168 624 1219 624 1236 610 C1248 598 1249 548 1237 536 L1222 546 C1228 562 1227 590 1217 599 C1204 608 1183 608 1170 599 C1160 590 1161 562 1166 546 Z",
    ],
  },
  {
    id: "small-intestine",
    label: "Intestino delgado",
    description: "Principal local de digestão e absorção de nutrientes.",
    marker: { x: 1193, y: 576 },
    paths: [
      "M1167 548 C1181 537 1207 537 1220 550 C1232 562 1231 589 1218 600 C1204 611 1182 610 1169 599 C1157 587 1156 560 1167 548 Z",
    ],
  },
];

const LAYERS: AnatomyLayer[] = [
  {
    id: "body",
    tab: "Corpo",
    heading: "Explore as regiões do corpo",
    image: "/HeroMedic.jpg",
    alt: "Pessoa acenando em um parque",
    align: { s: 1, tx: 0, ty: 0 }, // reference layer
    parts: BODY_PARTS,
  },
  {
    id: "skeleton",
    tab: "Esqueleto",
    heading: "Explore a estrutura óssea",
    image: "/HeroMedic2.jpg",
    alt: "Pessoa acenando com o esqueleto visível",
    // Measured from pixels (canvas analysis): skull top y=181, centerline
    // x≈1236, feet y=930 → span 749px vs body 637px. s=637/749; t maps the
    // skull top/centerline onto the body's (251, 1176). Feet land at y≈887 ✓.
    align: { s: 0.85, tx: 125, ty: 97 },
    parts: SKELETON_PARTS,
  },
  {
    id: "organs",
    tab: "Órgãos",
    heading: "Explore os órgãos internos",
    image: "/HeroMedic3.jpg",
    alt: "Pessoa acenando com os órgãos internos visíveis",
    // Measured from pixels: head top y=273, centerline x≈1194, feet y=926 →
    // span 653px vs body 637px. Feet land at y≈888 ✓.
    align: { s: 0.975, tx: 12, ty: -15 },
    parts: ORGAN_PARTS,
  },
];

export function HumanAnatomyExplorer({ segment }: { segment: Segment }) {
  const sectionRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const [layerIndex, setLayerIndex] = useState(0);
  // null = nothing hovered: no highlight, no chip, panel shows a hint.
  const [activePartId, setActivePartId] = useState<string | null>(null);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [mobileCopyHidden, setMobileCopyHidden] = useState(false);
  // Mirror of layerIndex for the scroll handler — keeps the handler pure
  // (calling one setState inside another's updater drops updates).
  const layerIndexRef = useRef(0);
  const mobileCopyInitializedRef = useRef(false);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const updateViewportMode = () => setIsMobileViewport(query.matches);

    updateViewportMode();

    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", updateViewportMode);
      return () => query.removeEventListener("change", updateViewportMode);
    }

    query.addListener(updateViewportMode);
    return () => query.removeListener(updateViewportMode);
  }, []);

  useEffect(() => {
    if (isMobileViewport && !mobileCopyInitializedRef.current) {
      mobileCopyInitializedRef.current = true;
      setMobileCopyHidden(true);
    }
  }, [isMobileViewport]);

  // The lawyer video fades into #02030a. The anatomy scene starts from that
  // same color, then reveals the body first and the copy after it.
  const lawyersToHealthBlend = useTransform(
    scrollYProgress,
    [0, 0.1, 0.24],
    [1, 0.55, 0],
  );

  const healthTextOpacity = useTransform(
    scrollYProgress,
    [0.18, 0.34],
    [0, 1],
  );

  const healthTextY = useTransform(scrollYProgress, [0.18, 0.34], [34, 0]);

  const anatomyViewBox = isMobileViewport
    ? "1000 140 390 880"
    : "0 0 1536 1024";

  const anatomyPreserveAspectRatio = isMobileViewport
    ? "xMidYMid meet"
    : "xMidYMid slice";

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    if (reduce) return;
    const nextIndex = progress < 0.34 ? 0 : progress < 0.67 ? 1 : 2;
    if (layerIndexRef.current !== nextIndex) {
      layerIndexRef.current = nextIndex;
      setLayerIndex(nextIndex);
      setActivePartId(null);
    }
  });

  const layer = LAYERS[layerIndex];

  const activePart = useMemo(
    () => layer.parts.find((part) => part.id === activePartId) ?? null,
    [activePartId, layer],
  );

  const changeLayer = (index: number) => {
    layerIndexRef.current = index;
    setLayerIndex(index);
    setActivePartId(null);
  };

  return (
    <section
      ref={sectionRef}
      id={segment.id}
      aria-labelledby={`${segment.id}-title`}
      className="relative min-h-[250vh] md:min-h-[300vh]"
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden bg-[#07101f]">
        {LAYERS.map((item, index) => {
          const { s, tx, ty } = item.align;
          const figureTransform = `translate(${tx} ${ty}) scale(${s})`;
          const isBase = index === 0;
          const isActive = layerIndex === index;
          // Marker chip position in registered (body-layer) coordinates, kept
          // OUTSIDE the scaled group so the chip stays the same size everywhere.
          const mx = (activePart?.marker.x ?? 0) * s + tx;
          const my = (activePart?.marker.y ?? 0) * s + ty;
          const chipW = (activePart?.label.length ?? 0) * 10.5 + 32;

          return (
            <motion.div
              key={item.id}
              aria-hidden={!isActive}
              initial={false}
              // The body layer is the permanent backdrop: the park around the
              // figure always comes from it, so the scene never visibly swaps.
              animate={{ opacity: isBase || isActive ? 1 : 0 }}
              transition={{
                duration: reduce ? 0 : 0.5,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={`absolute inset-0 ${
                isActive ? "pointer-events-auto" : "pointer-events-none"
              }`}
            >
              <svg
                className="absolute inset-0 h-full w-full"
                viewBox={anatomyViewBox}
                preserveAspectRatio={anatomyPreserveAspectRatio}
                role="img"
                aria-label={`Áreas interativas: ${item.tab}`}
              >
                {!isBase && (
                  <defs>
                    {/* Luminance fade: white core over the figure, melting to
                        black so the overlay dissolves into the base park. */}
                    <radialGradient
                      id={`fade-${item.id}`}
                      gradientUnits="userSpaceOnUse"
                      cx={FIGURE.cx}
                      cy={FIGURE.cy}
                      r={FIGURE.r}
                      gradientTransform={`translate(${FIGURE.cx} 0) scale(${FIGURE.squeeze} 1) translate(${-FIGURE.cx} 0)`}
                    >
                      <stop offset="0.66" stopColor="#fff" />
                      <stop offset="1" stopColor="#000" />
                    </radialGradient>
                    <mask
                      id={`mask-${item.id}`}
                      maskUnits="userSpaceOnUse"
                      x="0"
                      y="0"
                      width="1536"
                      height="1024"
                    >
                      <rect
                        width="1536"
                        height="1024"
                        fill={`url(#fade-${item.id})`}
                      />
                    </mask>
                  </defs>
                )}

                <g mask={isBase ? undefined : `url(#mask-${item.id})`}>
                  <image
                    href={item.image}
                    width={1536}
                    height={1024}
                    transform={figureTransform}
                  >
                    <title>{item.alt}</title>
                  </image>
                </g>

                {/* Hover affordance (pure CSS, see .anatomy-zone in globals):
                    entering the figure's area faintly reveals every interactive
                    region. Leaving the zone clears the highlight + chip. */}
                <g
                  className="anatomy-zone"
                  onPointerLeave={() => setActivePartId(null)}
                >
                  <ellipse
                    cx={FIGURE.cx}
                    cy={FIGURE.cy}
                    rx={FIGURE.r * FIGURE.squeeze}
                    ry={FIGURE.r}
                    fill="transparent"
                  />

                  <g transform={figureTransform}>
                    {item.parts.map((part) => {
                      const active = isActive && activePartId === part.id;

                      return (
                        <g
                          key={part.id}
                          role="button"
                          tabIndex={isActive ? 0 : -1}
                          aria-label={part.label}
                          onMouseEnter={() => setActivePartId(part.id)}
                          onFocus={() => setActivePartId(part.id)}
                          onPointerDown={() => setActivePartId(part.id)}
                          onClick={() => setActivePartId(part.id)}
                          transform={part.transform}
                          className={`anatomy-part ${active ? "is-active" : ""}`}
                        >
                          {part.paths.map((path, pathIndex) => (
                            <path
                              key={`${part.id}-${pathIndex}`}
                              d={path}
                              vectorEffect="non-scaling-stroke"
                              strokeWidth={active ? 2.4 : 1.4}
                            />
                          ))}
                        </g>
                      );
                    })}
                  </g>
                </g>

                {/* Floating label chip, drawn in the registered space so it
                    tracks its part exactly at any viewport size. Entrance-only
                    animation (keyed remount) — exit animations wedge under
                    rapid scroll-driven changes. Hidden when nothing is hovered. */}
                {isActive && activePart && (
                  <motion.g
                    key={activePart.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    className="pointer-events-none"
                  >
                    <circle cx={mx} cy={my} r={5} fill="#54e6b5" />
                    <rect
                      x={mx - chipW / 2}
                      y={my - 60}
                      width={chipW}
                      height={36}
                      rx={18}
                      fill="rgba(6, 18, 15, 0.88)"
                      stroke="rgba(118, 247, 202, 0.4)"
                    />
                    <text
                      x={mx}
                      y={my - 36}
                      textAnchor="middle"
                      fill="#e7fff6"
                      fontSize={19}
                      fontWeight={600}
                    >
                      {activePart.label}
                    </text>
                  </motion.g>
                )}
              </svg>
            </motion.div>
          );
        })}

        <motion.div
          aria-hidden="true"
          style={{ opacity: reduce ? 0 : lawyersToHealthBlend }}
          className="pointer-events-none absolute inset-0 z-30 bg-[#02030a]"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 z-20 h-48 bg-gradient-to-b from-[#02030a] via-[#02030acc] to-transparent"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(4,9,20,.96)_0%,rgba(4,9,20,.78)_38%,rgba(4,9,20,.22)_68%,rgba(4,9,20,.42)_100%)] md:bg-[linear-gradient(90deg,rgba(4,9,20,.96)_0%,rgba(4,9,20,.88)_26%,rgba(4,9,20,.48)_48%,rgba(4,9,20,.08)_72%,rgba(4,9,20,.12)_100%)]"
        />

        {/* pointer-events-none: this full-width rail sits ABOVE the model svg,
            so it must be click-through or it swallows every hover on the
            figure; the article re-enables pointers for its own controls. */}
        <div className="container-rail pointer-events-none relative z-40 flex h-full items-start pt-[calc(env(safe-area-inset-top)+5.25rem)] md:items-center md:pt-0">
          {(!isMobileViewport || !mobileCopyHidden) && (
          <motion.article
            style={{
              opacity: reduce ? 1 : healthTextOpacity,
              y: reduce ? 0 : healthTextY,
            }}
            className="pointer-events-none max-w-[min(92vw,21rem)] py-2 md:pointer-events-auto md:max-w-xl md:py-20"
          >
            <p
              className="font-mono text-xs uppercase tracking-[0.28em]"
              style={{ color: segment.accent }}
            >
              {segment.eyebrow}
            </p>

            {/* Entrance-only (keyed remount): AnimatePresence mode="wait" exits
                wedge under rapid scroll-driven key churn, freezing stale text. */}
            <motion.h3
              key={layer.heading}
              id={`${segment.id}-title`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="mt-2 max-w-[19rem] text-balance text-[2rem] font-semibold leading-[1.02] tracking-tightest text-white sm:text-4xl md:mt-5 md:max-w-lg md:text-6xl"
            >
              {layer.heading}
            </motion.h3>

            <p className="mt-2 max-w-[19rem] text-pretty text-xs leading-5 text-white/72 sm:text-sm md:mt-6 md:max-w-md md:text-lg md:leading-7">
              Role para alternar entre corpo, esqueleto e órgãos. Aproxime o
              cursor — ou toque no modelo — para acender as áreas interativas e
              identificar cada estrutura.
            </p>

            <div
              className="pointer-events-auto mt-3 flex max-w-[19rem] flex-wrap gap-2 md:mt-8 md:max-w-none"
              role="tablist"
              aria-label="Camadas anatômicas"
            >
              {LAYERS.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={layerIndex === index}
                  onClick={() => changeLayer(index)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur-md transition sm:px-4 sm:py-2 sm:text-sm ${
                    layerIndex === index
                      ? "border-[#65efc1]/80 bg-[#54e6b5]/15 text-white"
                      : "border-white/15 bg-black/10 text-white/65 hover:border-white/35 hover:text-white"
                  }`}
                >
                  {item.tab}
                </button>
              ))}
            </div>

            {/* Readout panel — keyed remount with entrance-only animation so it
                always reflects the CURRENT layer + hovered part (no stuck
                exiting children). Shows a hint when nothing is hovered. */}
            <motion.div
              key={`${layer.id}-${activePart?.id ?? "none"}`}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.22 }}
              className="mt-4 min-h-[5.5rem] max-w-[20rem] border-l-2 border-[#54e6b5]/70 pl-4 md:mt-9 md:min-h-[7.5rem] md:max-w-md md:pl-5"
              aria-live="polite"
            >
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.24em] text-[#79f7cb]/80">
                {layer.tab}
              </p>
              <h4 className="mt-2 text-xl font-semibold text-white sm:text-2xl">
                {activePart ? activePart.label : "Explore o modelo"}
              </h4>
              <p className="mt-2 max-w-md text-xs leading-5 text-white/65 sm:text-sm sm:leading-6">
                {activePart
                  ? activePart.description
                  : "Passe o cursor ou toque no corpo — cada região revela seu nome e sua função aqui."}
              </p>
            </motion.div>

            <button
              type="button"
              onClick={() => smoothScrollTo("#contato")}
              className="pointer-events-auto mt-3 rounded-full border border-[#54e6b5]/45 bg-black/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition hover:border-[#54e6b5]/80 hover:bg-[#54e6b5]/10 md:mt-8 md:px-6 md:py-3 md:text-base"
            >
              Quero algo assim
            </button>
            <button
              type="button"
              onClick={() => setMobileCopyHidden(true)}
              className="pointer-events-auto mt-3 rounded-full border border-white/15 bg-black/25 px-4 py-2 text-xs font-medium text-white/75 backdrop-blur-md transition hover:text-white md:hidden"
            >
              Ocultar texto
            </button>
          </motion.article>
          )}
        </div>

        {isMobileViewport && mobileCopyHidden && (
          <div className="pointer-events-none absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-50 flex justify-center px-4">
            <div className="pointer-events-auto flex max-w-[calc(100vw-2rem)] items-center gap-1.5 rounded-full border border-white/12 bg-[#02030a]/55 p-1.5 shadow-2xl backdrop-blur-xl">
              {LAYERS.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  aria-label={`Ver ${item.tab}`}
                  aria-pressed={layerIndex === index}
                  onClick={() => changeLayer(index)}
                  className={`rounded-full px-3 py-2 text-xs font-medium transition ${
                    layerIndex === index
                      ? "bg-[#54e6b5]/20 text-white ring-1 ring-[#65efc1]/70"
                      : "text-white/62 hover:text-white"
                  }`}
                >
                  {item.tab}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setMobileCopyHidden(false)}
                className="rounded-full bg-white/10 px-3 py-2 text-xs font-medium text-white backdrop-blur-md"
              >
                Info
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
