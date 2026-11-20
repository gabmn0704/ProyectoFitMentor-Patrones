import { FOODS, MAX_GRAMS, isAllowed, type Avoid, type Food } from "./foods";
import { nutritionTargets, type Macros, type NutritionTargets } from "./nutrition";
import type { BodyProfile } from "./profile";

/**
 * Menús del día armados con gramos calculados para llegar a las calorías y los macros de la persona. Cada comida
 * rota de alimentos según el día y la semana, respeta lo que la persona no come y ofrece equivalentes por porción.
 */

export interface MealItem {
  name: string;
  /** Cantidad lista para mostrar, por ejemplo "2 huevos (100 g)" o "150 g". */
  amount: string;
  /** Lo que sigue a la cantidad ("de pechuga de pollo cocida"); vacío si la cantidad ya nombra el alimento. */
  label: string;
  grams: number;
  /** Otras opciones que aportan lo mismo (misma proteína o mismos carbohidratos), ya con su porción. */
  swaps: string[];
}

export interface Meal extends Macros {
  slot: "desayuno" | "almuerzo" | "merienda" | "post" | "cena";
  title: string;
  /** Nombre del plato, por ejemplo "Pollo con arroz y brócoli". */
  dish: string;
  items: MealItem[];
}

export interface DayMeals {
  meals: Meal[];
  total: Macros;
  targets: NutritionTargets;
  /** "training" o "rest": cambia el reparto de carbohidratos. */
  kind: "training" | "rest";
}

type Slot = Meal["slot"];

const sum = (a: Macros, b: Macros): Macros => ({
  kcal: a.kcal + b.kcal,
  proteinG: a.proteinG + b.proteinG,
  carbsG: a.carbsG + b.carbsG,
  fatG: a.fatG + b.fatG,
});

const macrosOf = (item: Food, grams: number): Macros => ({
  kcal: (item.kcal * grams) / 100,
  proteinG: (item.p * grams) / 100,
  carbsG: (item.c * grams) / 100,
  fatG: (item.f * grams) / 100,
});

function roundGrams(item: Food, grams: number): number {
  if (item.unit && (item.role === "fruit" || item.unit.grams >= 60)) {
    // Frutas y piezas grandes (arepa) se sirven en mitades.
    const half = item.unit.grams / 2;
    return Math.max(1, Math.round(grams / half)) * half;
  }
  if (item.unit && item.unit.grams >= 30) {
    return Math.max(1, Math.round(grams / item.unit.grams)) * item.unit.grams;
  }
  if (item.id === "aceite") return Math.max(5, Math.round(grams / 5) * 5);
  return grams >= 200 ? Math.round(grams / 10) * 10 : Math.max(5, Math.round(grams / 5) * 5);
}

function describe(item: Food, grams: number): string {
  if (item.unit && (item.role === "fruit" || item.unit.grams >= 60)) {
    const count = grams / item.unit.grams;
    const whole = Math.floor(count);
    const text = whole === 0 ? "½" : count % 1 ? `${whole}½` : String(whole);
    return `${text} ${count <= 1 ? item.unit.one : item.unit.many} (${grams} g)`;
  }
  if (item.unit && item.unit.grams >= 30) {
    const count = Math.round(grams / item.unit.grams);
    return `${count} ${count === 1 ? item.unit.one : item.unit.many} (${grams} g)`;
  }
  if (item.id === "aceite") {
    const spoons = Math.round(grams / 5);
    return `${spoons} ${spoons === 1 ? "cucharadita" : "cucharaditas"} (${grams} g)`;
  }
  return `${grams} g`;
}

interface SlotRule {
  title: string;
  /** Parte de las calorías del día. */
  share: number;
  /** Fracción de la proteína del día que se reparte aquí. */
  proteinShare: number;
  proteins: string[];
  /** Proteínas que se ofrecen como alternativa a la principal. */
  swapProteins: string[];
  carbs: string[];
  fruit?: string[];
  fat?: string[];
  veg: boolean;
  /** Proteínas de apoyo, en orden, cuando la principal por tamaño de ración no llega a la meta. */
  topUp?: string[];
}

const VEGETABLES = ["ensalada", "zanahoria", "habichuela", "brocoli", "espinaca", "ahuyama", "repollo"];
const FRUITS = ["banano", "manzana", "guayaba", "papaya", "naranja", "mango", "mora", "pina", "pera", "fresas", "mandarina", "melon", "tomate_arbol"];
const NUTS = ["aguacate", "mani", "almendras"];

/**
 * Proteínas de almuerzo y cena de la mesa colombiana. El orden y las repeticiones importan: la rotación avanza por
 * la lista, así los platos más comunes (pollo, carne, frijoles, lentejas) salen más seguido y el pescado no pasa
 * de uno de cada cinco platos.
 */
const LUNCH_PROTEINS = ["pollo", "frijoles", "res", "lentejas", "pollo", "pescado", "desmechada", "cerdo", "pollo", "arveja", "res", "muslo", "atun", "frijoles", "huevo", "lentejas", "garbanzos", "muslo", "res", "pollo"];
const DINNER_PROTEINS = ["huevo", "pollo", "queso", "lentejas", "res", "huevo", "pescado", "frijoles", "muslo", "arveja", "cerdo", "pollo", "desmechada", "garbanzos", "huevo", "atun", "queso"];

/** Equivalentes que se sugieren al cambiar una proteína, por tipo de comida. */
const SWAP_PROTEINS_MAIN = ["pollo", "res", "cerdo", "pescado", "atun", "huevo", "queso", "lentejas", "frijoles", "garbanzos", "arveja"];
const SWAP_PROTEINS_LIGHT = ["huevo", "yogur", "queso", "claras", "mani"];

const SLOT_RULES: Record<Slot, SlotRule> = {
  desayuno: {
    title: "Desayuno",
    share: 0.24,
    proteinShare: 0.24,
    proteins: ["huevo", "queso", "yogur", "huevo", "claras", "frijoles", "queso", "mani"],
    swapProteins: SWAP_PROTEINS_LIGHT,
    carbs: ["arepa", "pan", "avena", "arepa", "platano", "pan", "arepa"],
    fruit: FRUITS,
    fat: NUTS,
    veg: false,
    topUp: ["claras", "queso", "yogur", "frijoles"],
  },
  almuerzo: {
    title: "Almuerzo",
    share: 0.3,
    proteinShare: 0.32,
    proteins: LUNCH_PROTEINS,
    swapProteins: SWAP_PROTEINS_MAIN,
    carbs: ["arroz", "papa", "arroz", "yuca", "platano", "arroz", "criolla", "batata", "arroz_int", "mazorca", "pasta", "platano_verde", "arepa"],
    fat: ["aguacate", "aceite", "mani"],
    veg: true,
    topUp: ["huevo", "queso", "claras"],
  },
  merienda: {
    title: "Merienda",
    share: 0.12,
    proteinShare: 0.1,
    proteins: ["yogur", "queso", "huevo", "mani", "yogur", "queso"],
    swapProteins: SWAP_PROTEINS_LIGHT,
    carbs: ["avena", "arepa", "pan", "platano"],
    fruit: FRUITS,
    fat: NUTS,
    veg: false,
    topUp: ["yogur", "queso", "claras"],
  },
  post: {
    title: "Después de entrenar",
    share: 0.14,
    proteinShare: 0.16,
    proteins: ["yogur", "huevo", "atun", "queso", "pollo", "claras"],
    swapProteins: SWAP_PROTEINS_MAIN,
    carbs: ["arroz", "batata", "pan", "arepa", "avena", "platano"],
    fruit: ["banano", "mango", "pina", "naranja", "manzana", "guayaba"],
    fat: ["mani", "almendras", "aguacate"],
    veg: false,
    topUp: ["yogur", "queso", "claras"],
  },
  cena: {
    title: "Cena",
    share: 0.2,
    proteinShare: 0.18,
    proteins: DINNER_PROTEINS,
    swapProteins: SWAP_PROTEINS_MAIN,
    carbs: ["arepa", "papa", "platano", "arroz", "yuca", "batata", "pan", "criolla", "mazorca"],
    fat: ["aguacate", "aceite", "mani"],
    veg: true,
    topUp: ["huevo", "queso", "claras"],
  },
};

interface Pantry {
  diet: BodyProfile["diet"];
  avoid: readonly Avoid[];
}

/** Alimentos de la lista que la persona puede comer, sin repetir ninguno. */
function allowedList(ids: string[], pantry: Pantry): Food[] {
  const seen = new Set<string>();
  return ids
    .filter((id) => !seen.has(id) && seen.add(id))
    .map((id) => FOODS[id])
    .filter((item) => item && isAllowed(item, pantry.diet, pantry.avoid));
}

/** "de queso campesino…" salvo que la medida casera ya diga el alimento (2 huevos, ½ arepa, 1 banano). */
function labelFor(item: Food): string {
  const name = item.name.toLowerCase();
  const named = item.unit ? [item.unit.one, item.unit.many].some((word) => name.includes(word.toLowerCase())) : false;
  return named ? "" : `de ${name}`;
}

/** Elige por rotación entre lo que la persona puede comer; si no queda nada, un alimento seguro de respaldo. */
function pick(ids: string[], pantry: Pantry, seed: number, fallback: string, used: ReadonlySet<string> = new Set()): Food {
  const allowed = allowedList(ids, pantry);
  // Dentro del mismo día se evita repetir alimento mientras quede otra opción.
  const fresh = allowed.filter((item) => !used.has(item.id));
  const usable = fresh.length ? fresh : allowed;
  if (usable.length) return usable[Math.abs(seed) % usable.length];
  const safe = allowedList([fallback, "lentejas", "frijoles", "arroz", "papa", "aceite"], pantry);
  return safe[0] ?? FOODS[fallback];
}

interface Entry {
  food: Food;
  grams: number;
}

const totalOf = (entries: Entry[]): Macros =>
  entries.reduce<Macros>((acc, entry) => sum(acc, macrosOf(entry.food, entry.grams)), { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 });

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** Opciones que aportan lo mismo que `entry` (proteína o carbohidrato), con su porción ya calculada. */
function equivalents(entry: Entry, nutrient: "p" | "c", pool: string[], pantry: Pantry, seed: number): string[] {
  const candidates = allowedList(pool, pantry).filter((item) => item.id !== entry.food.id && item[nutrient] >= (nutrient === "p" ? 8 : 12));
  const out: string[] = [];
  const start = candidates.length ? Math.abs(seed) % candidates.length : 0;
  for (let step = 0; step < candidates.length && out.length < 3; step += 1) {
    const alt = candidates[(start + step) % candidates.length];
    const needed = (entry.grams * entry.food[nutrient]) / alt[nutrient];
    if (needed > (MAX_GRAMS[alt.id] ?? 450)) continue;
    const grams = roundGrams(alt, needed);
    out.push([describe(alt, grams), labelFor(alt)].filter(Boolean).join(" "));
  }
  return out;
}

/** Arma una comida que se acerca a la meta de calorías y macros del hueco. */
function buildMeal(slot: Slot, target: Macros, pantry: Pantry, seed: number, used: Set<string>): Meal {
  const rule = SLOT_RULES[slot];
  const entries: Entry[] = [];
  const add = (item: Food, grams: number): Entry => {
    const entry = { food: item, grams };
    entries.push(entry);
    return entry;
  };

  const veg = rule.veg ? pick(VEGETABLES, pantry, seed, "ensalada", used) : null;
  if (veg) add(veg, 150);

  const protein = pick(rule.proteins, pantry, seed, "lentejas", used);
  const proteinNeeded = Math.max(0, target.proteinG - totalOf(entries).proteinG);
  // Las legumbres traen muchos carbohidratos: la ración se limita para que no se coma casi todo el hueco de calorías.
  const kcalCap = protein.c >= 15 ? ((target.kcal * 0.6) / protein.kcal) * 100 : Infinity;
  const proteinEntry = add(protein, Math.min((proteinNeeded / protein.p) * 100, MAX_GRAMS[protein.id] ?? 250, kcalCap));

  // Si la ración tope no llega a la proteína del hueco, se completa con un alimento más denso en proteína.
  const shortfall = target.proteinG - totalOf(entries).proteinG;
  if (rule.topUp && shortfall > 8) {
    const support = allowedList(rule.topUp, pantry).find((item) => item.id !== protein.id);
    if (support) add(support, Math.min((shortfall / support.p) * 100, MAX_GRAMS[support.id] ?? 250));
  }

  const carbFood = pick(rule.carbs, pantry, seed + 1, "arroz", used);
  const fruit = rule.fruit ? pick(rule.fruit, pantry, seed + 2, "manzana", used) : null;
  const carbNeeded = Math.max(0, target.carbsG - totalOf(entries).carbsG);
  let mainCarb: Entry | null = null;
  if (fruit) {
    mainCarb = add(carbFood, ((carbNeeded * 0.6) / carbFood.c) * 100);
    add(fruit, ((carbNeeded * 0.4) / fruit.c) * 100);
  } else if (carbNeeded > 5) {
    mainCarb = add(carbFood, (carbNeeded / carbFood.c) * 100);
  }

  // La grasa se cuadra con su propia meta, para que los macros salgan parejos.
  const fatLeft = target.fatG - totalOf(entries).fatG;
  if (rule.fat && fatLeft >= 3) {
    const fatFood = pick(rule.fat, pantry, seed + 3, "aceite", used);
    add(fatFood, Math.min((fatLeft / fatFood.f) * 100, fatFood.id === "aceite" ? 25 : fatFood.id === "aguacate" ? 120 : 45));
  }

  // Los demás alimentos (cereal, legumbre, verdura) también aportan proteína: se descuenta de la ración principal.
  const othersProtein = totalOf(entries).proteinG - macrosOf(protein, proteinEntry.grams).proteinG;
  const tuned = (Math.max(0, target.proteinG - othersProtein) / protein.p) * 100;
  proteinEntry.grams = Math.min(MAX_GRAMS[protein.id] ?? 250, Math.max(proteinEntry.grams * 0.5, tuned));

  // Ajuste final de calorías: primero con el carbohidrato principal; si no alcanza, con la grasa añadida y,
  // en último caso, con la ración de la proteína principal.
  const fatEntry = entries.find((entry) => entry.food.role === "fat") ?? null;
  const adjustable: Array<{ entry: Entry; min: number; max: number }> = [];
  if (mainCarb) adjustable.push({ entry: mainCarb, min: 15, max: 450 });
  if (fatEntry) adjustable.push({ entry: fatEntry, min: 5, max: fatEntry.food.id === "aceite" ? 25 : 120 });
  adjustable.push({ entry: proteinEntry, min: proteinEntry.grams * 0.55, max: MAX_GRAMS[protein.id] ?? 250 });
  for (let pass = 0; pass < 4; pass += 1) {
    const diff = target.kcal - totalOf(entries).kcal;
    if (Math.abs(diff) <= target.kcal * 0.05) break;
    for (const { entry, min, max } of adjustable) {
      const wanted = entry.grams + (diff / entry.food.kcal) * 100;
      const next = Math.min(max, Math.max(min, wanted));
      if (next !== entry.grams) {
        entry.grams = next;
        break;
      }
    }
  }

  const rounded: Entry[] = entries.map((entry) => ({ food: entry.food, grams: roundGrams(entry.food, entry.grams) }));
  const mainProteinRounded = rounded[entries.indexOf(proteinEntry)];
  const mainCarbRounded = mainCarb ? rounded[entries.indexOf(mainCarb)] : null;

  const items: MealItem[] = rounded.map((entry) => {
    let swaps: string[] = [];
    if (entry === mainProteinRounded) swaps = equivalents(entry, "p", rule.swapProteins, pantry, seed + 1);
    else if (entry === mainCarbRounded) swaps = equivalents(entry, "c", rule.carbs, pantry, seed + 2);
    return { name: entry.food.name, grams: entry.grams, amount: describe(entry.food, entry.grams), label: labelFor(entry.food), swaps };
  });

  const side = veg ? veg.short : fruit ? fruit.short : null;
  const supports = entries.filter((entry) => entry.food.role === "protein" && entry !== proteinEntry).map((entry) => entry.food.short);
  const dish = [
    capitalize(protein.short),
    supports.length ? `y ${supports[0]}` : "",
    mainCarb ? `con ${mainCarb.food.short}` : "",
    side ? `y ${side}` : "",
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/ y ([^ ]+) con (.+) y (.+)$/, " y $1 con $2 y $3");
  const total = totalOf(rounded);
  for (const entry of entries) used.add(entry.food.id);

  return {
    slot,
    title: rule.title,
    dish,
    items,
    kcal: Math.round(total.kcal),
    proteinG: Math.round(total.proteinG),
    carbsG: Math.round(total.carbsG),
    fatG: Math.round(total.fatG),
  };
}

/**
 * Plan de comidas de un día. `seed` (por ejemplo el índice del día más la semana) rota los alimentos para que la
 * semana no repita el menú. Los días de descanso no llevan comida post-entreno.
 */
export function mealPlanForDay(profile: BodyProfile, trainingDay: boolean, seed = 0): DayMeals {
  const targets = nutritionTargets(profile, trainingDay);
  const pantry: Pantry = { diet: profile.diet, avoid: profile.avoid ?? [] };
  const slots: Slot[] = trainingDay ? ["desayuno", "almuerzo", "merienda", "post", "cena"] : ["desayuno", "almuerzo", "merienda", "cena"];
  const shareTotal = slots.reduce((acc, slot) => acc + SLOT_RULES[slot].share, 0);
  const proteinTotal = slots.reduce((acc, slot) => acc + SLOT_RULES[slot].proteinShare, 0);

  const used = new Set<string>();
  const meals = slots.map((slot, index) => {
    const rule = SLOT_RULES[slot];
    const kcal = (targets.kcal * rule.share) / shareTotal;
    const proteinG = (targets.proteinG * rule.proteinShare) / proteinTotal;
    const fatG = (targets.fatG * rule.share) / shareTotal;
    const carbsG = Math.max(0, (kcal - proteinG * 4 - fatG * 9) / 4);
    return buildMeal(slot, { kcal, proteinG, carbsG, fatG }, pantry, seed * 3 + index * 5 + (slot === "cena" ? 2 : 0), used);
  });

  const total = meals.reduce<Macros>((acc, meal) => sum(acc, meal), { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 });
  return { meals, total, targets, kind: trainingDay ? "training" : "rest" };
}
