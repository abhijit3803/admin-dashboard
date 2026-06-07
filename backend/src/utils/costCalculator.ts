/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  Cost Calculator — Ingredient & Recipe Cost Helpers          ║
 * ║  Formula: (quantityGrams / 1000) × pricePerKg              ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

/** Number of decimal places for cost rounding */
const COST_PRECISION = 4;

/**
 * Calculates the cost of a single ingredient usage.
 *
 * @param quantityGrams - Amount of ingredient in grams
 * @param pricePerKg - Price per kilogram of the ingredient
 * @returns Calculated cost rounded to COST_PRECISION decimal places
 *
 * @example
 * ```ts
 * calculateIngredientCost(500, 12.50) // => 6.25 (0.5kg × 12.50)
 * ```
 */
export function calculateIngredientCost(
  quantityGrams: number,
  pricePerKg: number
): number {
  const cost = (quantityGrams / 1000) * pricePerKg;
  return roundTo(cost, COST_PRECISION);
}

/**
 * Calculates the total recipe cost from an array of ingredient costs.
 *
 * @param ingredients - Array of objects containing quantityGrams and pricePerKg
 * @returns Total cost rounded to COST_PRECISION decimal places
 */
export function calculateTotalRecipeCost(
  ingredients: Array<{ quantityGrams: number; pricePerKg: number }>
): number {
  const total = ingredients.reduce((sum, ing) => {
    return sum + calculateIngredientCost(ing.quantityGrams, ing.pricePerKg);
  }, 0);
  return roundTo(total, COST_PRECISION);
}

/**
 * Rounds a number to the specified number of decimal places.
 * Uses the "round half away from zero" strategy.
 */
function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
