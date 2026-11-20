import type { CatalogId } from "./catalog";
import type { ExerciseId } from "./types";
import type { ExerciseGuide, PoseFrame } from "./exerciseGuide";

type Rest = Exclude<CatalogId, ExerciseId>;

/** Figuras de las demás posturas. Coordenadas en un lienzo de 200 x 160; el suelo está en y = 142. */

const FOOT: ReadonlyArray<readonly [number, number]> = [[88, 140], [114, 140]];

/** Persona de pie, de perfil, algo más compacta para que quepan los brazos arriba. */
const standing = (): Pick<PoseFrame, "head" | "limbs"> => ({
  head: [100, 22],
  limbs: [
    FOOT,
    [[100, 138], [100, 106], [100, 74]],
    [[100, 74], [100, 34]],
  ],
});

export const MORE_GUIDES: Record<Rest, ExerciseGuide> = {
  sumo_squat: {
    frames: [
      {
        caption: "1 · Pies abiertos",
        head: [100, 10],
        limbs: [[[88, 140], [114, 140]], [[100, 138], [100, 98], [100, 60]], [[100, 60], [100, 22]], [[100, 24], [104, 40], [110, 54]]],
      },
      {
        caption: "2 · Abajo, rodillas afuera",
        head: [106, 48],
        limbs: [[[88, 140], [114, 140]], [[100, 138], [124, 104], [88, 100]], [[88, 100], [104, 62]], [[104, 64], [122, 66], [136, 64]]],
        mark: { at: [124, 104], label: "≈ 90°" },
      },
    ],
    steps: [
      "Separa los pies más que el ancho de los hombros y gira las puntas unos 45 grados hacia afuera.",
      "Pecho arriba y abdomen firme; mira al frente.",
      "Baja recto, abriendo las rodillas en la misma dirección que los pies.",
      "Empuja el suelo con los talones y aprieta los glúteos al subir.",
    ],
    mistakes: ["Las rodillas se cierran hacia dentro.", "Te inclinas hacia adelante.", "Bajas con los talones levantados."],
    breath: "Inhala al bajar y exhala al subir.",
    camera: "De perfil, a unos 2 metros. La cámara lo mide como una sentadilla.",
  },
  reverse_lunge: {
    frames: [
      {
        caption: "1 · De pie",
        head: [100, 12],
        limbs: [[[88, 140], [114, 140]], [[100, 138], [100, 100], [100, 62]], [[100, 62], [100, 24]], [[100, 26], [90, 42], [100, 58]]],
      },
      {
        caption: "2 · Paso atrás y abajo",
        head: [100, 46],
        limbs: [[[88, 140], [114, 140]], [[100, 138], [118, 112], [100, 96]], [[100, 96], [100, 58]], [[100, 96], [76, 122], [58, 138]]],
        mark: { at: [118, 112], label: "≈ 90°" },
      },
    ],
    steps: [
      "De pie, con los pies juntos y las manos en la cadera.",
      "Da un paso largo hacia atrás apoyando la punta del pie.",
      "Baja recto hasta que ambas rodillas formen unos 90 grados.",
      "Empuja con el talón de adelante para volver y cambia de pierna.",
    ],
    mistakes: ["Tu torso se inclina hacia adelante.", "La rodilla de adelante se va hacia dentro.", "Das un paso demasiado corto."],
    breath: "Inhala al bajar y exhala al volver.",
    camera: "De perfil, con las dos piernas visibles. La cámara lo mide como una zancada.",
  },
  bulgarian_split_squat: {
    frames: [
      {
        caption: "1 · Pie atrás en la silla",
        head: [100, 12],
        limbs: [[[116, 140], [142, 140]], [[100, 62], [118, 100], [128, 138]], [[100, 62], [84, 92], [62, 104]], [[100, 62], [100, 24]], [[100, 26], [90, 42], [100, 58]]],
        props: [[40, 106, 34, 36]],
      },
      {
        caption: "2 · Abajo",
        head: [100, 46],
        limbs: [[[116, 140], [142, 140]], [[100, 94], [130, 98], [130, 138]], [[100, 94], [82, 122], [62, 104]], [[100, 94], [100, 58]], [[100, 60], [90, 76], [100, 90]]],
        props: [[40, 106, 34, 36]],
        mark: { at: [130, 98], label: "≈ 90°" },
      },
    ],
    steps: [
      "Apoya el empeine de un pie en una silla firme, detrás de ti.",
      "Da un paso adelante con la otra pierna y mantén el torso erguido.",
      "Baja hasta que la rodilla de adelante forme unos 90 grados, sin pasar la punta del pie.",
      "Empuja con el talón de adelante para subir; termina todas las repeticiones y cambia de pierna.",
    ],
    mistakes: ["Pones el pie de adelante demasiado cerca de la silla.", "La rodilla se cae hacia dentro.", "Te inclinas hacia adelante."],
    breath: "Inhala al bajar y exhala al subir.",
    camera: "De perfil, con la pierna de trabajo visible. La cámara lo mide como una zancada.",
  },
  step_up: {
    frames: [
      {
        caption: "1 · Pie en el escalón",
        head: [100, 12],
        limbs: [[[80, 140], [106, 140]], [[100, 62], [96, 100], [92, 138]], [[100, 62], [122, 84], [130, 104]], [[100, 62], [100, 24]]],
        props: [[120, 106, 50, 36]],
      },
      {
        caption: "2 · Arriba",
        head: [136, 12],
        limbs: [[[122, 106], [148, 106]], [[136, 62], [136, 84], [136, 104]], [[136, 62], [120, 82], [112, 98]], [[136, 62], [136, 24]]],
        props: [[120, 106, 50, 36]],
      },
    ],
    steps: [
      "Colócate frente a un escalón o una silla firme y apoya todo el pie de arriba.",
      "Empuja con esa pierna (no con el impulso de la otra) hasta quedar de pie sobre el escalón.",
      "Baja con control, tocando suavemente el suelo con el otro pie.",
      "Completa las repeticiones de un lado y cambia de pierna.",
    ],
    mistakes: ["Te impulsas con la pierna que queda abajo.", "Dejas caer el cuerpo al bajar.", "Usas un escalón inestable."],
    breath: "Exhala al subir e inhala al bajar.",
    camera: "Este ejercicio se hace con la guía: marca cada serie cuando la termines.",
  },
  wall_sit: {
    frames: [
      {
        caption: "Correcto",
        head: [82, 40],
        limbs: [[[110, 140], [136, 140]], [[124, 138], [124, 100], [84, 100]], [[84, 100], [82, 56]], [[82, 58], [100, 70], [112, 90]]],
        props: [[62, 10, 8, 132]],
        mark: { at: [124, 100], label: "90°" },
      },
      {
        caption: "Evita: bajas poco",
        wrong: true,
        head: [82, 30],
        limbs: [[[110, 140], [136, 140]], [[118, 138], [112, 96], [84, 80]], [[84, 80], [82, 44]], [[82, 46], [98, 60], [106, 76]]],
        props: [[62, 10, 8, 132]],
      },
    ],
    steps: [
      "Apoya toda la espalda en la pared y da un paso adelante.",
      "Baja hasta que los muslos queden paralelos al suelo y las rodillas formen 90 grados.",
      "Mantén las rodillas sobre los tobillos y los talones apoyados.",
      "Aguanta el tiempo indicado respirando con calma.",
    ],
    mistakes: ["Te quedas muy arriba y el ejercicio pierde exigencia.", "Apoyas las manos en los muslos.", "Las rodillas pasan de la punta de los pies."],
    breath: "Respira lento y constante; no aguantes el aire.",
    camera: "Este ejercicio se hace con la guía: marca cada serie cuando la termines.",
  },
  calf_raise: {
    frames: [
      { caption: "1 · Pies planos", ...standing() },
      {
        caption: "2 · En puntas",
        head: [100, 12],
        limbs: [[[92, 134], [112, 140]], [[102, 128], [100, 96], [100, 64]], [[100, 64], [100, 24]]],
      },
    ],
    steps: [
      "De pie, con los pies al ancho de la cadera; apóyate en una pared si lo necesitas.",
      "Sube lo más alto que puedas sobre las puntas de los pies.",
      "Haz una pausa de un segundo arriba apretando las pantorrillas.",
      "Baja despacio hasta apoyar todo el pie.",
    ],
    mistakes: ["Rebotas sin control.", "Doblas las rodillas al subir.", "No subes del todo."],
    breath: "Exhala al subir e inhala al bajar.",
    camera: "Este ejercicio se hace con la guía: marca cada serie cuando la termines.",
  },
  glute_bridge: {
    frames: [
      {
        caption: "1 · Boca arriba",
        head: [38, 130],
        limbs: [[[52, 134], [104, 134]], [[104, 134], [134, 102], [150, 134]], [[52, 134], [78, 134]]],
      },
      {
        caption: "2 · Cadera arriba",
        head: [38, 130],
        limbs: [[[52, 134], [104, 108], [134, 98], [150, 134]], [[52, 134], [78, 134]]],
        mark: { at: [104, 108], label: "línea" },
      },
    ],
    steps: [
      "Boca arriba, rodillas dobladas y pies apoyados cerca de los glúteos.",
      "Aprieta los glúteos y sube la cadera hasta formar una línea de hombros a rodillas.",
      "Mantén un segundo arriba sin arquear la zona lumbar.",
      "Baja despacio sin dejar caer la cadera de golpe.",
    ],
    mistakes: ["Arqueas demasiado la espalda.", "Empujas con los dedos de los pies en vez de los talones.", "Las rodillas se abren o se cierran."],
    breath: "Exhala al subir e inhala al bajar.",
    camera: "Este ejercicio se hace con la guía: marca cada serie cuando la termines.",
  },
  romanian_deadlift: {
    frames: [
      {
        caption: "1 · De pie con peso",
        head: [98, 14],
        limbs: [[[80, 140], [106, 140]], [[96, 138], [98, 100], [99, 64]], [[99, 64], [98, 26]], [[98, 28], [100, 54], [102, 80]]],
        bar: [102, 86],
      },
      {
        caption: "2 · Cadera atrás",
        head: [136, 52],
        limbs: [[[80, 140], [106, 140]], [[96, 138], [102, 104], [72, 74]], [[72, 74], [122, 56]], [[122, 58], [118, 86], [114, 110]]],
        bar: [114, 114],
        mark: { at: [72, 74], label: "≈ 100°" },
      },
    ],
    steps: [
      "De pie, con el peso frente a los muslos y las rodillas ligeramente flexionadas.",
      "Lleva la cadera hacia atrás como si cerraras una puerta con ella; el peso baja pegado a las piernas.",
      "Baja hasta sentir el estiramiento atrás del muslo, con la espalda larga y neutra.",
      "Empuja la cadera hacia adelante para volver a estar de pie.",
    ],
    mistakes: ["La espalda se redondea.", "Doblas demasiado las rodillas y lo conviertes en sentadilla.", "El peso se separa de las piernas."],
    breath: "Inhala al bajar y exhala al subir.",
    camera: "De perfil, a unos 2 metros. La cámara lo mide como un peso muerto.",
  },
  good_morning: {
    frames: [
      {
        caption: "1 · De pie",
        head: [100, 12],
        limbs: [[[88, 140], [114, 140]], [[100, 138], [100, 100], [100, 62]], [[100, 62], [100, 26]], [[100, 28], [92, 22], [84, 28]]],
        bar: [100, 28],
      },
      {
        caption: "2 · Cadera atrás",
        head: [146, 50],
        limbs: [[[88, 140], [114, 140]], [[100, 138], [102, 100], [76, 72]], [[76, 72], [128, 56]], [[128, 58], [120, 52], [112, 56]]],
        bar: [128, 56],
        mark: { at: [76, 72], label: "≈ 100°" },
      },
    ],
    steps: [
      "De pie, con las manos detrás de la cabeza (o una mochila ligera sobre los hombros).",
      "Dobla ligeramente las rodillas y lleva la cadera hacia atrás.",
      "Inclina el torso hacia adelante con la espalda recta hasta casi quedar paralelo al suelo.",
      "Aprieta los glúteos para volver a la posición inicial.",
    ],
    mistakes: ["La espalda se redondea.", "Bajas más allá de donde mantienes la espalda recta.", "Estiras el cuello hacia arriba."],
    breath: "Inhala al bajar y exhala al subir.",
    camera: "De perfil, a unos 2 metros. La cámara lo mide como un peso muerto.",
  },
  superman: {
    frames: [
      {
        caption: "1 · Boca abajo",
        head: [58, 130],
        limbs: [[[70, 134], [122, 136]], [[122, 136], [172, 138]], [[70, 134], [24, 136]]],
      },
      {
        caption: "2 · Brazos y piernas arriba",
        head: [56, 110],
        limbs: [[[70, 124], [122, 130]], [[122, 130], [172, 114]], [[70, 124], [24, 112]]],
      },
    ],
    steps: [
      "Boca abajo, con los brazos estirados al frente y el cuello neutro.",
      "Levanta a la vez brazos, pecho y piernas sin forzar el cuello.",
      "Aguanta un segundo apretando glúteos y espalda.",
      "Baja con control.",
    ],
    mistakes: ["Miras hacia arriba y cargas el cuello.", "Subes con impulso.", "Separas mucho las piernas."],
    breath: "Exhala al subir e inhala al bajar.",
    camera: "Este ejercicio se hace con la guía: marca cada serie cuando la termines.",
  },
  incline_push_up: {
    frames: [
      {
        caption: "1 · Arriba",
        head: [172, 60],
        limbs: [[[158, 104], [158, 86], [158, 68]], [[158, 68], [99, 98], [70, 113], [40, 128]], [[40, 128], [34, 132]]],
        props: [[146, 104, 40, 38]],
      },
      {
        caption: "2 · Abajo",
        head: [166, 78],
        limbs: [[[158, 104], [136, 98], [150, 84]], [[150, 84], [95, 106], [68, 117], [40, 128]], [[40, 128], [34, 132]]],
        props: [[146, 104, 40, 38]],
        mark: { at: [136, 98], label: "≈ 90°" },
      },
    ],
    steps: [
      "Apoya las manos en una mesa o silla firme, un poco más anchas que los hombros.",
      "Cuerpo en una sola línea, de la cabeza a los talones.",
      "Baja el pecho hacia el borde con los codos a unos 45 grados.",
      "Empuja y sube sin dejar caer la cadera.",
    ],
    mistakes: ["La cadera cae o sube.", "Usas un apoyo que se mueve.", "Los codos se abren mucho."],
    breath: "Inhala al bajar y exhala al empujar.",
    camera: "De perfil, con el teléfono a la altura de la cadera. La cámara lo mide como una flexión.",
  },
  diamond_push_up: {
    frames: [
      {
        caption: "1 · Manos en rombo",
        head: [164, 76],
        limbs: [[[150, 130], [150, 106], [150, 82]], [[150, 82], [95, 104], [68, 115], [40, 126]], [[40, 126], [34, 132]]],
      },
      {
        caption: "2 · Abajo",
        head: [164, 108],
        limbs: [[[150, 130], [126, 117], [148, 112]], [[148, 112], [95, 120], [68, 124], [40, 128]], [[40, 128], [34, 132]]],
        mark: { at: [126, 117], label: "codos pegados" },
      },
    ],
    steps: [
      "Junta las manos bajo el pecho formando un rombo con pulgares e índices.",
      "Cuerpo recto, abdomen y glúteos apretados.",
      "Baja con los codos pegados al cuerpo hasta rozar las manos con el pecho.",
      "Empuja para subir. Si es muy difícil, apoya las rodillas.",
    ],
    mistakes: ["Los codos se abren hacia los lados.", "La cadera cae.", "Bajas sin control."],
    breath: "Inhala al bajar y exhala al subir.",
    camera: "De perfil, con el teléfono al nivel del suelo. La cámara lo mide como una flexión.",
  },
  tricep_dips: {
    frames: [
      {
        caption: "1 · Brazos estirados",
        head: [80, 46],
        limbs: [[[70, 100], [72, 80], [74, 60]], [[74, 60], [86, 100]], [[86, 100], [120, 106], [152, 138]], [[142, 140], [166, 140]]],
        props: [[56, 100, 36, 42]],
      },
      {
        caption: "2 · Codos a 90°",
        head: [80, 66],
        limbs: [[[70, 100], [54, 90], [74, 80]], [[74, 80], [86, 122]], [[86, 122], [120, 122], [152, 138]], [[142, 140], [166, 140]]],
        props: [[56, 100, 36, 42]],
        mark: { at: [54, 90], label: "≈ 90°" },
      },
    ],
    steps: [
      "Siéntate al borde de una silla firme y apoya las manos junto a la cadera; desliza el cuerpo hacia adelante.",
      "Piernas estiradas (o dobladas si eres principiante) y hombros lejos de las orejas.",
      "Dobla los codos hacia atrás hasta unos 90 grados, rozando la silla con la espalda.",
      "Estira los brazos para subir sin bloquear los codos.",
    ],
    mistakes: ["Los codos se abren hacia los lados.", "Hombros subidos hacia las orejas.", "Te alejas demasiado de la silla."],
    breath: "Inhala al bajar y exhala al subir.",
    camera: "Este ejercicio se hace con la guía: marca cada serie cuando la termines.",
  },
  shoulder_press: {
    frames: [
      {
        caption: "1 · Pesas a los hombros",
        head: [100, 22],
        limbs: [[[88, 140], [114, 140]], [[100, 138], [100, 106], [100, 74]], [[100, 74], [100, 34]], [[100, 36], [114, 48], [108, 32]]],
        weight: [108, 28],
      },
      {
        caption: "2 · Brazos arriba",
        head: [100, 22],
        limbs: [[[88, 140], [114, 140]], [[100, 138], [100, 106], [100, 74]], [[100, 74], [100, 34]], [[100, 36], [104, 20], [104, 6]]],
        weight: [104, 4],
      },
    ],
    steps: [
      "De pie, con una pesa (o una botella) en cada mano a la altura de los hombros.",
      "Abdomen y glúteos firmes para no arquear la espalda.",
      "Empuja las pesas hacia arriba hasta estirar los brazos sin bloquear los codos.",
      "Baja despacio hasta los hombros.",
    ],
    mistakes: ["Arqueas la espalda.", "Subes los hombros hacia las orejas.", "Empujas con las piernas."],
    breath: "Exhala al subir e inhala al bajar.",
    camera: "Este ejercicio se hace con la guía: marca cada serie cuando la termines.",
  },
  bent_over_row: {
    frames: [
      {
        caption: "1 · Brazo estirado",
        head: [126, 44],
        limbs: [[[70, 140], [96, 140]], [[84, 138], [88, 108], [76, 80]], [[76, 80], [114, 52]], [[114, 54], [116, 78], [116, 100]]],
        weight: [116, 104],
      },
      {
        caption: "2 · Codo atrás",
        head: [126, 44],
        limbs: [[[70, 140], [96, 140]], [[84, 138], [88, 108], [76, 80]], [[76, 80], [114, 52]], [[114, 54], [92, 66], [108, 78]]],
        weight: [108, 82],
      },
    ],
    steps: [
      "Inclina el torso hacia adelante con la espalda recta y las rodillas ligeramente dobladas.",
      "Deja colgar el peso con el brazo estirado.",
      "Lleva el codo hacia la cadera, apretando el omóplato.",
      "Baja con control y repite; cambia de lado si trabajas con un brazo.",
    ],
    mistakes: ["La espalda se redondea.", "Subes el peso con impulso.", "Giras el torso al tirar."],
    breath: "Exhala al subir el peso e inhala al bajar.",
    camera: "Este ejercicio se hace con la guía: marca cada serie cuando la termines.",
  },
  biceps_curl: {
    frames: [
      {
        caption: "1 · Brazos abajo",
        head: [100, 22],
        limbs: [[[88, 140], [114, 140]], [[100, 138], [100, 106], [100, 74]], [[100, 74], [100, 34]], [[100, 36], [102, 58], [104, 80]]],
        weight: [104, 84],
      },
      {
        caption: "2 · Pesa arriba",
        head: [100, 22],
        limbs: [[[88, 140], [114, 140]], [[100, 138], [100, 106], [100, 74]], [[100, 74], [100, 34]], [[100, 36], [102, 58], [116, 42]]],
        weight: [118, 38],
      },
    ],
    steps: [
      "De pie, con una pesa (o botella) en cada mano y los codos pegados al cuerpo.",
      "Sube las pesas doblando los codos, sin mover los hombros.",
      "Aprieta el bíceps arriba un instante.",
      "Baja lentamente hasta estirar casi del todo el brazo.",
    ],
    mistakes: ["Balanceas el cuerpo para subir.", "Los codos se adelantan.", "Bajas de golpe."],
    breath: "Exhala al subir e inhala al bajar.",
    camera: "Este ejercicio se hace con la guía: marca cada serie cuando la termines.",
  },
  side_plank: {
    frames: [
      {
        caption: "Correcto",
        head: [58, 84],
        limbs: [[[40, 130], [64, 128], [64, 100]], [[64, 100], [117, 117], [143, 125], [170, 134]]],
        mark: { at: [117, 117], label: "recta" },
      },
      {
        caption: "Evita: cadera caída",
        wrong: true,
        head: [58, 84],
        limbs: [[[40, 130], [64, 128], [64, 100]], [[64, 100], [117, 134], [143, 137], [170, 138]]],
      },
    ],
    steps: [
      "Acuéstate de lado con el codo bajo el hombro y los pies apilados.",
      "Levanta la cadera hasta formar una línea recta de la cabeza a los pies.",
      "Aprieta el abdomen y mantén el cuello neutro.",
      "Aguanta el tiempo indicado y repite del otro lado.",
    ],
    mistakes: ["La cadera se hunde.", "El hombro se encoge hacia la oreja.", "Giras el torso hacia adelante o atrás."],
    breath: "Respira lento y constante.",
    camera: "Este ejercicio se hace con la guía: marca cada serie cuando la termines.",
  },
  crunch: {
    frames: [
      {
        caption: "1 · Boca arriba",
        head: [52, 130],
        limbs: [[[70, 132], [110, 134]], [[110, 134], [140, 100], [160, 134]], [[70, 132], [58, 118], [56, 130]]],
      },
      {
        caption: "2 · Hombros arriba",
        head: [68, 104],
        limbs: [[[82, 116], [110, 134]], [[110, 134], [140, 100], [160, 134]], [[82, 116], [66, 106], [68, 96]]],
      },
    ],
    steps: [
      "Boca arriba, rodillas dobladas y pies apoyados; manos suaves detrás de la cabeza.",
      "Aprieta el abdomen y sube solo los hombros del suelo, mirando al techo.",
      "Aguanta un segundo arriba.",
      "Baja con control sin apoyar del todo la cabeza.",
    ],
    mistakes: ["Tiras del cuello con las manos.", "Subes con impulso.", "Subes todo el torso en vez de contraer el abdomen."],
    breath: "Exhala al subir e inhala al bajar.",
    camera: "Este ejercicio se hace con la guía: marca cada serie cuando la termines.",
  },
  leg_raise: {
    frames: [
      {
        caption: "1 · Piernas abajo",
        head: [36, 130],
        limbs: [[[50, 134], [110, 134]], [[110, 134], [172, 136]], [[50, 134], [84, 138]]],
      },
      {
        caption: "2 · Piernas arriba",
        head: [36, 130],
        limbs: [[[50, 134], [110, 134]], [[110, 134], [112, 72]], [[50, 134], [84, 138]]],
        mark: { at: [110, 134], label: "90°" },
      },
    ],
    steps: [
      "Boca arriba, con las manos bajo los glúteos y la zona lumbar pegada al suelo.",
      "Sube las piernas estiradas hasta formar 90 grados con el cuerpo.",
      "Baja despacio sin que los talones toquen el suelo.",
      "Si la espalda se arquea, dobla un poco las rodillas.",
    ],
    mistakes: ["La zona lumbar se despega del suelo.", "Bajas las piernas de golpe.", "Subes con impulso."],
    breath: "Exhala al subir e inhala al bajar.",
    camera: "Este ejercicio se hace con la guía: marca cada serie cuando la termines.",
  },
  mountain_climber: {
    frames: [
      {
        caption: "1 · Rodilla derecha",
        head: [164, 76],
        limbs: [[[150, 130], [150, 106], [150, 82]], [[150, 82], [98, 104]], [[98, 104], [68, 115], [40, 126]], [[98, 104], [124, 106], [104, 124]]],
      },
      {
        caption: "2 · Cambio de pierna",
        head: [164, 76],
        limbs: [[[150, 130], [150, 106], [150, 82]], [[150, 82], [98, 104]], [[98, 104], [122, 108], [100, 126]], [[98, 104], [68, 115], [40, 126]]],
      },
    ],
    steps: [
      "Empieza en posición de flexión, con las manos bajo los hombros y el cuerpo recto.",
      "Lleva una rodilla hacia el pecho sin subir la cadera.",
      "Cambia de pierna en un salto corto, como si corrieras en el suelo.",
      "Mantén un ritmo constante durante el tiempo indicado.",
    ],
    mistakes: ["La cadera sube mucho.", "Los hombros se echan hacia atrás.", "Pierdes el ritmo y apoyas las rodillas."],
    breath: "Respira rápido y rítmico; no aguantes el aire.",
    camera: "Este ejercicio se hace con la guía: marca cada serie cuando la termines.",
  },
  bird_dog: {
    frames: [
      {
        caption: "1 · En cuatro apoyos",
        head: [156, 84],
        limbs: [[[140, 130], [140, 110], [140, 90]], [[140, 90], [84, 92]], [[84, 92], [84, 128], [54, 130]]],
      },
      {
        caption: "2 · Brazo y pierna opuestos",
        head: [156, 84],
        limbs: [[[140, 130], [140, 110], [140, 90]], [[140, 90], [176, 88]], [[140, 90], [84, 92]], [[84, 92], [34, 96]], [[84, 92], [84, 128], [54, 130]]],
      },
    ],
    steps: [
      "En cuatro apoyos, con las manos bajo los hombros y las rodillas bajo la cadera.",
      "Estira a la vez un brazo hacia adelante y la pierna contraria hacia atrás.",
      "Mantén la espalda plana como una mesa, sin girar la cadera.",
      "Vuelve despacio y cambia de lado.",
    ],
    mistakes: ["Arqueas la zona lumbar.", "Giras la cadera al subir la pierna.", "Subes la pierna más arriba de la espalda."],
    breath: "Exhala al estirar e inhala al volver.",
    camera: "Este ejercicio se hace con la guía: marca cada serie cuando la termines.",
  },
  jumping_jacks: {
    frames: [
      {
        caption: "1 · Pies juntos",
        head: [100, 16],
        limbs: [[[100, 30], [84, 52], [80, 72]], [[100, 30], [116, 52], [120, 72]], [[100, 30], [100, 72]], [[100, 72], [96, 106], [96, 138]], [[100, 72], [104, 106], [104, 138]]],
      },
      {
        caption: "2 · Brazos y piernas abiertos",
        head: [100, 16],
        limbs: [[[100, 30], [76, 18], [58, 4]], [[100, 30], [124, 18], [142, 4]], [[100, 30], [100, 72]], [[100, 72], [80, 106], [64, 138]], [[100, 72], [120, 106], [136, 138]]],
      },
    ],
    steps: [
      "De pie, con los pies juntos y los brazos pegados al cuerpo.",
      "Salta abriendo las piernas y llevando los brazos por encima de la cabeza.",
      "Vuelve de un salto a la posición inicial.",
      "Aterriza suave, con las rodillas ligeramente dobladas, y mantén el ritmo.",
    ],
    mistakes: ["Aterrizas con las piernas rígidas.", "Los brazos no llegan arriba.", "Te inclinas hacia adelante."],
    breath: "Respira de forma rítmica al ritmo de los saltos.",
    camera: "Este ejercicio se hace con la guía: marca cada serie cuando la termines.",
  },
  high_knees: {
    frames: [
      {
        caption: "1 · Rodilla derecha",
        head: [100, 14],
        limbs: [[[88, 140], [114, 140]], [[100, 138], [100, 100], [100, 64]], [[100, 64], [128, 66], [130, 98]], [[100, 64], [100, 26]], [[100, 28], [86, 44], [104, 50]]],
      },
      {
        caption: "2 · Cambio",
        head: [100, 14],
        limbs: [[[88, 140], [114, 140]], [[100, 138], [100, 100], [100, 64]], [[100, 64], [128, 66], [130, 98]], [[100, 64], [100, 26]], [[100, 28], [116, 44], [100, 50]]],
      },
    ],
    steps: [
      "De pie, con el torso erguido y los codos doblados.",
      "Corre en el sitio subiendo las rodillas hasta la altura de la cadera.",
      "Mueve los brazos en oposición a las piernas.",
      "Apoya la parte delantera del pie y mantén un ritmo rápido.",
    ],
    mistakes: ["Te inclinas hacia atrás.", "Las rodillas apenas suben.", "Apoyas pesado los talones."],
    breath: "Respira rápido y rítmico.",
    camera: "Este ejercicio se hace con la guía: marca cada serie cuando la termines.",
  },
  burpee: {
    frames: [
      {
        caption: "1 · Abajo, en plancha",
        head: [164, 76],
        limbs: [[[150, 130], [150, 106], [150, 82]], [[150, 82], [95, 104], [68, 115], [40, 126]], [[40, 126], [34, 132]]],
      },
      {
        caption: "2 · Salto con brazos arriba",
        head: [100, 18],
        limbs: [[[92, 126], [112, 132]], [[100, 116], [104, 94], [100, 70]], [[100, 70], [100, 32]], [[100, 34], [104, 18], [106, 2]]],
      },
    ],
    steps: [
      "De pie: baja a cuclillas y apoya las manos en el suelo.",
      "Lleva los pies atrás hasta quedar en posición de plancha (con flexión si puedes).",
      "Regresa los pies a las manos y ponte de pie.",
      "Salta con los brazos arriba y repite sin parar entre repeticiones.",
    ],
    mistakes: ["La cadera cae en la plancha.", "Saltas sin control.", "Aguantas la respiración."],
    breath: "Exhala al saltar e inhala al bajar.",
    camera: "Este ejercicio se hace con la guía: marca cada serie cuando la termines.",
  },
};
