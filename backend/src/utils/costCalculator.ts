/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  Cost & Nutrition Calculator                                 ║
 * ║  Formula: quantity × pricePerUnit                            ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

/** Number of decimal places for cost rounding */
const COST_PRECISION = 4;

/**
 * Calculates the cost of a single ingredient usage.
 *
 * @param quantity - Amount of ingredient in its unit
 * @param pricePerUnit - Price per unit of the ingredient
 * @returns Calculated cost rounded to COST_PRECISION decimal places
 *
 * @example
 * ```ts
 * calculateIngredientCost(2, 520) // => 1040 (2 kg × ₹520/kg)
 * calculateIngredientCost(5, 30)  // => 150  (5 nos × ₹30/nos)
 * ```
 */
export function calculateIngredientCost(
  quantity: number,
  pricePerUnit: number
): number {
  const cost = quantity * pricePerUnit;
  return roundTo(cost, COST_PRECISION);
}

/**
 * Calculates the total recipe cost from an array of ingredient costs.
 *
 * @param ingredients - Array of objects containing quantity and pricePerUnit
 * @returns Total cost rounded to COST_PRECISION decimal places
 */
export function calculateTotalRecipeCost(
  ingredients: Array<{ quantity: number; pricePerUnit: number }>
): number {
  const total = ingredients.reduce((sum, ing) => {
    return sum + calculateIngredientCost(ing.quantity, ing.pricePerUnit);
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

/**
 * Calculates nutrition totals for a recipe from its ingredients.
 * Formula: quantity × nutritionPerUnit for each nutrient
 */
export function calculateRecipeNutrition(
  ingredients: Array<{
    quantity: number;
    caloriesPerUnit: number | null;
    proteinPerUnit: number | null;
    carbsPerUnit: number | null;
    fatPerUnit: number | null;
  }>
): { totalCalories: number; totalProtein: number; totalCarbs: number; totalFat: number } {
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;

  for (const ing of ingredients) {
    totalCalories += (ing.caloriesPerUnit ?? 0) * ing.quantity;
    totalProtein += (ing.proteinPerUnit ?? 0) * ing.quantity;
    totalCarbs += (ing.carbsPerUnit ?? 0) * ing.quantity;
    totalFat += (ing.fatPerUnit ?? 0) * ing.quantity;
  }

  return {
    totalCalories: roundTo(totalCalories, 2),
    totalProtein: roundTo(totalProtein, 2),
    totalCarbs: roundTo(totalCarbs, 2),
    totalFat: roundTo(totalFat, 2),
  };
}
