import type { ExerciseId } from "./types";
import type { CatalogId } from "./catalog";
import { MORE_GUIDES } from "./exerciseGuideMore";

/**
 * Guía visual de cada ejercicio: dos posiciones dibujadas de perfil (viewBox 200 x 160), pasos, errores
 * frecuentes y cómo colocarse frente a la cámara para que la medición sea buena.
 */

export type Pt = readonly [number, number];

export interface PoseFrame {
  caption: string;
  /** Verdadero si la posición muestra un error que hay que evitar. */
  wrong?: boolean;
  head: Pt;
  /** Cada línea es un tramo del cuerpo (pierna, torso, brazo). */
  limbs: ReadonlyArray<ReadonlyArray<Pt>>;
  /** Barra o pesa (peso muerto, press, curl…). */
  bar?: Pt;
  /** Pesa pequeña en la mano (mancuerna, botella o mochila). */
  weight?: Pt;
  /** Objetos del entorno (silla, escalón, pared) como rectángulos [x, y, ancho, alto]. */
  props?: ReadonlyArray<readonly [number, number, number, number]>;
  /** Articulación que se mide, con su etiqueta de ángulo. */
  mark?: { at: Pt; label: string; dx?: number };
}

export interface ExerciseGuide {
  frames: readonly [PoseFrame, PoseFrame];
  steps: readonly string[];
  mistakes: readonly string[];
  breath: string;
  camera: string;
}

export const FLOOR_Y = 142;

const BASE_GUIDES: Record<ExerciseId, ExerciseGuide> = {
  squat: {
    frames: [
      {
        caption: "1 · De pie",
        head: [100, 10],
        limbs: [
          [[88, 140], [114, 140]],
          [[100, 138], [100, 98], [100, 60]],
          [[100, 60], [100, 22]],
          [[100, 24], [104, 40], [110, 54]],
        ],
      },
      {
        caption: "2 · Abajo",
        head: [110, 50],
        limbs: [
          [[88, 140], [114, 140]],
          [[100, 138], [126, 104], [84, 100]],
          [[84, 100], [104, 62]],
          [[104, 64], [120, 66], [138, 64]],
        ],
        mark: { at: [126, 104], label: "≈ 90°" },
      },
    ],
    steps: [
      "Pies al ancho de los hombros, con las puntas un poco hacia afuera.",
      "Pecho arriba, abdomen firme y la mirada al frente.",
      "Baja llevando la cadera atrás y abajo hasta que los muslos queden casi paralelos al suelo.",
      "Empuja el suelo con todo el pie y sube extendiendo la cadera sin bloquear las rodillas.",
    ],
    mistakes: ["Las rodillas se van hacia dentro.", "Los talones se despegan del suelo.", "La espalda se redondea al llegar abajo."],
    breath: "Inhala al bajar y exhala con fuerza al subir.",
    camera: "Colócate de lado, a unos 2 metros, con el cuerpo completo dentro del encuadre.",
  },
  push_up: {
    frames: [
      {
        caption: "1 · Arriba",
        head: [164, 76],
        limbs: [
          [[150, 130], [150, 106], [150, 82]],
          [[150, 82], [95, 104], [68, 115], [40, 126]],
          [[40, 126], [34, 132]],
        ],
      },
      {
        caption: "2 · Abajo",
        head: [164, 108],
        limbs: [
          [[150, 130], [126, 117], [148, 112]],
          [[148, 112], [95, 120], [68, 124], [40, 128]],
          [[40, 128], [34, 132]],
        ],
        mark: { at: [126, 117], label: "≈ 90°" },
      },
    ],
    steps: [
      "Manos bajo los hombros y el cuerpo en una sola línea, de la cabeza a los talones.",
      "Abdomen y glúteos apretados; codos a unos 45 grados del torso, no abiertos.",
      "Baja hasta que el pecho casi roce el suelo, con el cuello neutro.",
      "Empuja el suelo y sube sin dejar caer la cadera.",
    ],
    mistakes: ["La cadera cae o se levanta.", "Los codos se abren como una «T».", "No bajas lo suficiente: media repetición."],
    breath: "Inhala al bajar y exhala al empujar.",
    camera: "Colócate de lado, con el teléfono al nivel del suelo, para ver hombro, cadera y tobillo.",
  },
  plank: {
    frames: [
      {
        caption: "Correcto",
        head: [150, 84],
        limbs: [
          [[160, 128], [135, 126], [135, 90]],
          [[135, 90], [88, 109], [64, 118], [40, 128]],
        ],
        mark: { at: [88, 109], label: "recta" },
      },
      {
        caption: "Evita: cadera caída",
        wrong: true,
        head: [150, 84],
        limbs: [
          [[160, 128], [135, 126], [135, 90]],
          [[135, 90], [88, 124], [64, 127], [40, 128]],
        ],
      },
    ],
    steps: [
      "Antebrazos en el suelo, con los codos justo debajo de los hombros.",
      "Cuerpo en línea recta de la cabeza a los talones: no subas ni dejes caer la cadera.",
      "Aprieta abdomen y glúteos y empuja el suelo con los antebrazos.",
      "Mira un punto entre las manos para mantener el cuello largo.",
    ],
    mistakes: ["La cadera se hunde y carga la zona lumbar.", "La cadera sube como una «V» invertida.", "Aguantas la respiración."],
    breath: "Respira lento y constante; no te quedes sin aire.",
    camera: "De perfil, con hombro, cadera y tobillo visibles en la imagen.",
  },
  deadlift: {
    frames: [
      {
        caption: "1 · Salida",
        head: [123, 41],
        limbs: [
          [[80, 140], [106, 140]],
          [[96, 138], [104, 104], [76, 78]],
          [[76, 78], [112, 50]],
          [[112, 52], [109, 82], [106, 112]],
        ],
        bar: [106, 122],
        mark: { at: [76, 78], label: "≈ 125°", dx: -58 },
      },
      {
        caption: "2 · Arriba",
        head: [98, 14],
        limbs: [
          [[80, 140], [106, 140]],
          [[96, 138], [98, 100], [99, 64]],
          [[99, 64], [98, 26]],
          [[98, 28], [100, 54], [102, 80]],
        ],
        bar: [102, 86],
      },
    ],
    steps: [
      "Pies al ancho de la cadera y la barra (o la mochila) pegada a las espinillas.",
      "Lleva la cadera atrás, espalda larga y neutra, pecho abierto y brazos estirados.",
      "Empuja el suelo con los pies y extiende la cadera: la barra sube pegada al cuerpo.",
      "Termina de pie, con glúteos firmes, sin inclinarte hacia atrás.",
    ],
    mistakes: ["La espalda se redondea.", "La barra se aleja del cuerpo.", "Tiras con los brazos en vez de empujar con las piernas."],
    breath: "Inhala y aprieta el abdomen antes de subir; exhala arriba.",
    camera: "De perfil, a unos 2 metros, con la cabeza y los pies dentro del encuadre.",
  },
  lunge: {
    frames: [
      {
        caption: "1 · De pie",
        head: [100, 12],
        limbs: [
          [[100, 62], [114, 100], [126, 138]],
          [[100, 62], [86, 100], [74, 136], [66, 140]],
          [[100, 62], [100, 24]],
          [[100, 26], [90, 42], [100, 58]],
        ],
      },
      {
        caption: "2 · Abajo",
        head: [100, 46],
        limbs: [
          [[100, 96], [130, 98], [130, 138]],
          [[100, 96], [80, 128], [52, 126]],
          [[100, 96], [100, 58]],
          [[100, 60], [90, 76], [100, 92]],
        ],
        mark: { at: [130, 98], label: "≈ 90°" },
      },
    ],
    steps: [
      "Da un paso largo al frente y mantén el torso erguido.",
      "Baja recto hasta que la rodilla de adelante quede cerca de 90 grados y sobre el tobillo.",
      "La rodilla de atrás baja hacia el suelo sin golpearlo.",
      "Empuja con el talón de adelante para volver y cambia de pierna.",
    ],
    mistakes: ["La rodilla delantera se va muy por delante de la punta del pie.", "El torso se inclina hacia adelante.", "La rodilla se cae hacia dentro."],
    breath: "Inhala al bajar y exhala al subir.",
    camera: "De perfil, a unos 2 metros, con las dos piernas visibles.",
  },
};

/** Guía de todos los ejercicios del catálogo. */
export const GUIDES: Record<CatalogId, ExerciseGuide> = { ...BASE_GUIDES, ...MORE_GUIDES };
