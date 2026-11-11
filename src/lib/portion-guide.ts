import { KG_STEP } from "./config";

/**
 * "How much should I order?" — catering guidelines (per guest, desserts excluded):
 *   • First courses & salads : 150–200 g total; with a variety, ~50 g per salad
 *   • Mains                  : 150 g boneless, 300 g bone-in
 *   • Vegetables & sides     : 100–150 g
 *   • Rule of thumb          : up to ~600 g of food per guest in total
 */
export const PORTION_RULES = {
  firsts: { min: 150, max: 200, perSalad: 50 },
  mains: { boneless: 150, boneIn: 300 },
  sides: { min: 100, max: 150 },
  maxTotalPerGuest: 600,
} as const;

export type Appetite = "light" | "regular" | "hearty";
export type MainsKind = "boneless" | "boneIn" | "mixed";

export interface PortionInput {
  guests: number;
  appetite: Appetite;
  /** Number of different first courses / salads (0 = none). */
  salads: number;
  /** Number of different main dishes (0 = none). */
  mains: number;
  mainsKind: MainsKind;
  /** Number of different sides (0 = none). */
  sides: number;
}

export interface PortionLine {
  /** Grams per guest for the whole course. */
  gramsPerGuest: number;
  /** Total kg for the course, rounded up to 0.25 kg. */
  totalKg: number;
  /** Kg per individual dish, rounded up to 0.25 kg. */
  perDishKg: number;
  dishes: number;
}

export interface PortionResult {
  firsts: PortionLine | null;
  mains: PortionLine | null;
  sides: PortionLine | null;
  /** Edible grams per guest (bone weight excluded) — compared to the 600 g rule. */
  ediblePerGuest: number;
  totalKg: number;
  /** True if firsts/sides were scaled down to respect the ~600 g rule. */
  scaledToCap: boolean;
}

const pick = (min: number, max: number, a: Appetite) =>
  a === "light" ? min : a === "hearty" ? max : (min + max) / 2;

/** Round grams up to the next 0.25 kg so it maps directly onto the cart stepper. */
export function roundUpToStepKg(grams: number): number {
  if (grams <= 0) return 0;
  const steps = Math.ceil(grams / 1000 / KG_STEP - 1e-9);
  return Math.round(steps * KG_STEP * 100) / 100;
}

function line(gramsPerGuest: number, guests: number, dishes: number): PortionLine {
  const total = gramsPerGuest * guests;
  return {
    gramsPerGuest: Math.round(gramsPerGuest),
    totalKg: roundUpToStepKg(total),
    perDishKg: roundUpToStepKg(total / dishes),
    dishes,
  };
}

export function calculatePortions(input: PortionInput): PortionResult {
  const guests = Math.max(1, Math.floor(input.guests));
  const { firsts: F, mains: M, sides: S, maxTotalPerGuest } = PORTION_RULES;

  // Mains: weight per guest (gross) and edible part (bone-in ≈ 50% edible).
  const mainsGross =
    input.mains > 0
      ? input.mainsKind === "boneless" ? M.boneless : input.mainsKind === "boneIn" ? M.boneIn : (M.boneless + M.boneIn) / 2
      : 0;
  const mainsEdible = input.mains > 0 ? M.boneless : 0;

  // Firsts: light → 150 g, hearty → 200 g; regular → ~50 g per salad, kept in 150–200 g.
  let firsts = 0;
  if (input.salads > 0) {
    firsts =
      input.appetite === "light" ? F.min
      : input.appetite === "hearty" ? F.max
      : Math.min(F.max, Math.max(F.min, input.salads * F.perSalad));
  }

  let sides = input.sides > 0 ? pick(S.min, S.max, input.appetite) : 0;

  // ~600 g rule: if over, scale firsts & sides down (never the mains).
  let scaledToCap = false;
  const edible = firsts + mainsEdible + sides;
  if (edible > maxTotalPerGuest && firsts + sides > 0) {
    const room = Math.max(0, maxTotalPerGuest - mainsEdible);
    const k = room / (firsts + sides);
    firsts *= k;
    sides *= k;
    scaledToCap = true;
  }

  const r: PortionResult = {
    firsts: input.salads > 0 ? line(firsts, guests, input.salads) : null,
    mains: input.mains > 0 ? line(mainsGross, guests, input.mains) : null,
    sides: input.sides > 0 ? line(sides, guests, input.sides) : null,
    ediblePerGuest: Math.round(firsts + mainsEdible + sides),
    totalKg: 0,
    scaledToCap,
  };
  r.totalKg = [r.firsts, r.mains, r.sides].reduce((sum, l) => sum + (l?.totalKg ?? 0), 0);
  return r;
}

/** "Serves ~N" hint for a KG product card, based on its course. */
export function estimateServings(
  quantityKg: number,
  group: "FIRSTS" | "MAINS" | "SIDES" | "SOUPS" | "OTHER",
  hasBones = false,
): number | null {
  const grams = quantityKg * 1000;
  const per =
    group === "FIRSTS" ? PORTION_RULES.firsts.min
    : group === "MAINS" ? (hasBones ? PORTION_RULES.mains.boneIn : PORTION_RULES.mains.boneless)
    : group === "SIDES" ? (PORTION_RULES.sides.min + PORTION_RULES.sides.max) / 2
    : null;
  if (!per) return null;
  return Math.max(1, Math.floor(grams / per));
}
