import type { BodyProfile } from "./profile";

/**
 * Alimentos de la mesa colombiana, con sus valores por 100 g, etiquetas de lo que alguien puede no comer y medidas
 * caseras. Los valores son aproximados (tablas generales y de composición de alimentos); las porciones se calculan
 * sobre ellos. Solo hay productos que se consiguen en cualquier tienda o plaza de mercado del país.
 */

export type FoodRole = "protein" | "carb" | "fat" | "veg" | "fruit";
export type Avoid = "fish" | "dairy" | "eggs" | "gluten" | "pork";

export const AVOID_OPTIONS: ReadonlyArray<{ value: Avoid; label: string }> = [
  { value: "fish", label: "Pescado" },
  { value: "dairy", label: "Lácteos" },
  { value: "eggs", label: "Huevo" },
  { value: "gluten", label: "Gluten" },
  { value: "pork", label: "Cerdo" },
];

export interface Food {
  id: string;
  name: string;
  /** Nombre corto para armar el nombre del plato ("pollo", "arroz"). */
  short: string;
  role: FoodRole;
  /** Por 100 g. */
  kcal: number;
  p: number;
  c: number;
  f: number;
  vegetarian: boolean;
  /** Qué debe evitar quien no pueda comerlo. */
  tags?: Avoid[];
  /** Medida casera: gramos por unidad y cómo nombrarla. */
  unit?: { grams: number; one: string; many: string };
}

const food = (
  id: string,
  name: string,
  short: string,
  role: FoodRole,
  kcal: number,
  p: number,
  c: number,
  f: number,
  options: { vegetarian?: boolean; tags?: Avoid[]; unit?: Food["unit"] } = {},
): Food => ({ id, name, short, role, kcal, p, c, f, vegetarian: options.vegetarian ?? true, tags: options.tags, unit: options.unit });

const LIST: Food[] = [
  // Carnes, pescado y menudencias de uso diario
  food("pollo", "Pechuga de pollo cocida", "pollo", "protein", 165, 31, 0, 3.6, { vegetarian: false }),
  food("muslo", "Muslo de pollo sin piel cocido", "pollo guisado", "protein", 177, 27, 0, 7.5, { vegetarian: false }),
  food("res", "Carne de res magra cocida", "carne de res", "protein", 190, 29, 0, 8, { vegetarian: false }),
  food("desmechada", "Carne desmechada (sobrebarriga)", "carne desmechada", "protein", 205, 30, 0, 9, { vegetarian: false }),
  food("cerdo", "Lomo de cerdo magro cocido", "cerdo", "protein", 143, 26, 0, 3.5, { vegetarian: false, tags: ["pork"] }),
  food("pescado", "Pescado (tilapia o mojarra) cocido", "pescado", "protein", 128, 26, 0, 2.7, { vegetarian: false, tags: ["fish"] }),
  food("atun", "Atún en agua (lata)", "atún", "protein", 116, 26, 0, 1, { vegetarian: false, tags: ["fish"] }),
  food("sardinas", "Sardinas en lata", "sardinas", "protein", 208, 25, 0, 11, { vegetarian: false, tags: ["fish"] }),
  // Huevos y lácteos
  food("huevo", "Huevo", "huevos", "protein", 143, 12.6, 0.7, 9.5, { tags: ["eggs"], unit: { grams: 50, one: "huevo", many: "huevos" } }),
  food("claras", "Claras de huevo", "claras", "protein", 52, 11, 0.7, 0.2, { tags: ["eggs"] }),
  food("yogur", "Yogur natural o griego sin azúcar", "yogur", "protein", 62, 8, 4.5, 1.5, { tags: ["dairy"] }),
  food("queso", "Queso campesino o cuajada", "queso campesino", "protein", 174, 18, 3, 10, { tags: ["dairy"] }),
  // Legumbres
  food("lentejas", "Lentejas cocidas", "lentejas", "protein", 116, 9, 20, 0.4),
  food("frijoles", "Frijoles cocidos", "frijoles", "protein", 127, 8.7, 23, 0.5),
  food("garbanzos", "Garbanzos cocidos", "garbanzos", "protein", 164, 8.9, 27, 2.6),
  food("arveja", "Arveja seca cocida", "arveja", "protein", 118, 8.3, 21, 0.4),

  // Carbohidratos
  food("arroz", "Arroz blanco cocido", "arroz", "carb", 130, 2.7, 28, 0.3),
  food("arroz_int", "Arroz integral cocido", "arroz integral", "carb", 123, 2.7, 26, 1),
  food("arepa", "Arepa de maíz", "arepa", "carb", 197, 4.1, 40, 2, { unit: { grams: 90, one: "arepa", many: "arepas" } }),
  food("papa", "Papa pastusa cocida", "papa", "carb", 87, 1.9, 20, 0.1),
  food("criolla", "Papa criolla cocida", "papa criolla", "carb", 92, 2.1, 21, 0.2),
  food("yuca", "Yuca cocida", "yuca", "carb", 160, 1.4, 38, 0.3),
  food("platano", "Plátano maduro cocido o asado", "plátano maduro", "carb", 122, 1.3, 32, 0.4),
  food("platano_verde", "Plátano verde cocido", "plátano verde", "carb", 116, 1.0, 28, 0.2),
  food("batata", "Batata cocida", "batata", "carb", 90, 2, 21, 0.1),
  food("mazorca", "Mazorca (maíz tierno) cocida", "mazorca", "carb", 96, 3.4, 21, 1.5),
  food("avena", "Avena en hojuelas (en seco)", "avena", "carb", 389, 17, 66, 7, { tags: ["gluten"] }),
  food("pan", "Pan tajado integral", "pan integral", "carb", 247, 13, 41, 3.4, { tags: ["gluten"], unit: { grams: 30, one: "tajada", many: "tajadas" } }),
  food("pasta", "Pasta cocida", "pasta", "carb", 158, 5.8, 31, 0.9, { tags: ["gluten"] }),

  // Frutas
  food("banano", "Banano", "banano", "fruit", 89, 1.1, 23, 0.3, { unit: { grams: 120, one: "banano", many: "bananos" } }),
  food("manzana", "Manzana", "manzana", "fruit", 52, 0.3, 14, 0.2, { unit: { grams: 180, one: "manzana", many: "manzanas" } }),
  food("pera", "Pera", "pera", "fruit", 57, 0.4, 15, 0.1, { unit: { grams: 170, one: "pera", many: "peras" } }),
  food("naranja", "Naranja", "naranja", "fruit", 47, 0.9, 12, 0.1, { unit: { grams: 130, one: "naranja", many: "naranjas" } }),
  food("mandarina", "Mandarina", "mandarina", "fruit", 53, 0.8, 13, 0.3, { unit: { grams: 90, one: "mandarina", many: "mandarinas" } }),
  food("guayaba", "Guayaba", "guayaba", "fruit", 68, 2.6, 14, 1, { unit: { grams: 100, one: "guayaba", many: "guayabas" } }),
  food("mora", "Mora", "mora", "fruit", 43, 1.4, 10, 0.5),
  food("fresas", "Fresas", "fresas", "fruit", 32, 0.7, 7.7, 0.3),
  food("papaya", "Papaya", "papaya", "fruit", 43, 0.5, 11, 0.3),
  food("pina", "Piña", "piña", "fruit", 50, 0.5, 13, 0.1),
  food("mango", "Mango", "mango", "fruit", 60, 0.8, 15, 0.4),
  food("melon", "Melón", "melón", "fruit", 34, 0.8, 8, 0.2),
  food("sandia", "Sandía", "sandía", "fruit", 30, 0.6, 8, 0.2),
  food("tomate_arbol", "Tomate de árbol", "tomate de árbol", "fruit", 31, 2, 7, 0.1),

  // Grasas
  food("aguacate", "Aguacate", "aguacate", "fat", 160, 2, 9, 15),
  food("aceite", "Aceite vegetal u oliva", "aceite", "fat", 884, 0, 0, 100, { unit: { grams: 5, one: "cucharadita", many: "cucharaditas" } }),
  food("mani", "Maní", "maní", "fat", 567, 26, 16, 49),
  food("almendras", "Almendras", "almendras", "fat", 579, 21, 22, 50),

  // Verduras de cada día
  food("ensalada", "Ensalada de lechuga, tomate y cebolla", "ensalada", "veg", 20, 1.2, 4, 0.2),
  food("zanahoria", "Zanahoria rallada y remolacha", "zanahoria", "veg", 40, 1.2, 9, 0.2),
  food("habichuela", "Habichuela guisada", "habichuela", "veg", 31, 1.8, 7, 0.2),
  food("brocoli", "Brócoli al vapor", "brócoli", "veg", 35, 2.8, 7, 0.4),
  food("espinaca", "Espinaca salteada", "espinaca", "veg", 23, 2.9, 3.6, 0.4),
  food("ahuyama", "Ahuyama cocida", "ahuyama", "veg", 26, 1, 6.5, 0.1),
  food("repollo", "Repollo y pepino", "ensalada de repollo", "veg", 22, 1.2, 4.8, 0.1),
];

export const FOODS: Record<string, Food> = Object.fromEntries(LIST.map((item) => [item.id, item]));

/** Ración máxima razonable por alimento, en gramos. */
export const MAX_GRAMS: Record<string, number> = {
  pollo: 220, muslo: 220, res: 200, desmechada: 200, cerdo: 200, pescado: 250, atun: 150, sardinas: 140,
  huevo: 200, claras: 250, yogur: 300, queso: 120, mani: 60,
  lentejas: 300, frijoles: 300, garbanzos: 300, arveja: 300,
};

/** Verdadero si la persona puede comer el alimento según su tipo de alimentación y lo que evita. */
export function isAllowed(item: Food, diet: BodyProfile["diet"], avoid: readonly Avoid[]): boolean {
  if (diet === "vegetarian" && !item.vegetarian) return false;
  return !(item.tags ?? []).some((tag) => avoid.includes(tag));
}
