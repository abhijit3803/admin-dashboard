/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  Recipe Service — Business Logic Layer                      ║
 * ║  Handles recipe CRUD with cost snapshotting                 ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import prisma from "../lib/prisma.js";
import { generateUniqueId } from "../utils/idGenerator.js";
import {
  calculateIngredientCost,
  calculateTotalRecipeCost,
  calculateRecipeNutrition,
} from "../utils/costCalculator.js";
import { AppError } from "../types/index.js";
import type { PaginationMeta } from "../types/index.js";
import type {
  CreateRecipeInput,
  UpdateRecipeInput,
  RecipeQueryInput,
} from "../validators/recipe.validator.js";
import type { Prisma } from "@prisma/client";

/** Recipe with included ingredients for API responses */
type RecipeWithIngredients = Prisma.RecipeGetPayload<{
  include: {
    recipeIngredients: {
      include: {
        ingredient: { select: { id: true; name: true; unit: true; category: true; caloriesPerUnit: true; proteinPerUnit: true; carbsPerUnit: true; fatPerUnit: true } };
      };
    };
  };
}>;

// ─────────────────────────────────────────────
// List Recipes (with pagination & search)
// ─────────────────────────────────────────────

export async function listRecipes(
  query: RecipeQueryInput
): Promise<{ recipes: RecipeWithIngredients[]; meta: PaginationMeta }> {
  const { page, limit, q, isActive, sortBy, sortOrder } = query;
  const skip = (page - 1) * limit;

  // Build WHERE clause
  const where: Prisma.RecipeWhereInput = {};

  if (q) {
    where.name = { contains: q, mode: "insensitive" };
  }

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  const [total, recipes] = await prisma.$transaction([
    prisma.recipe.count({ where }),
    prisma.recipe.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
      include: {
        recipeIngredients: {
          include: {
            ingredient: {
              select: { id: true, name: true, unit: true, category: true, caloriesPerUnit: true, proteinPerUnit: true, carbsPerUnit: true, fatPerUnit: true },
            },
          },
        },
      },
    }),
  ]);

  const meta: PaginationMeta = {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };

  return { recipes, meta };
}

// ─────────────────────────────────────────────
// Get Single Recipe by ID
// ─────────────────────────────────────────────

export async function getRecipeById(
  id: string
): Promise<RecipeWithIngredients> {
  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: {
      recipeIngredients: {
        include: {
          ingredient: {
            select: { id: true, name: true, unit: true, category: true, caloriesPerUnit: true, proteinPerUnit: true, carbsPerUnit: true, fatPerUnit: true },
          },
        },
      },
    },
  });

  if (!recipe) {
    throw new AppError(`Recipe with ID "${id}" not found.`, 404);
  }

  return recipe;
}

// ─────────────────────────────────────────────
// Create Recipe (with cost snapshotting)
// ─────────────────────────────────────────────

export async function createRecipe(
  data: CreateRecipeInput,
  userId?: string
): Promise<RecipeWithIngredients> {
  const id = await generateUniqueId("recipe");

  // Fetch current prices for all ingredients
  const ingredientIds = data.ingredients.map((i) => i.ingredientId);
  const dbIngredients = await prisma.ingredient.findMany({
    where: { id: { in: ingredientIds } },
    select: { id: true, pricePerUnit: true, caloriesPerUnit: true, proteinPerUnit: true, carbsPerUnit: true, fatPerUnit: true },
  });

  // Validate all ingredients exist
  const priceMap = new Map(dbIngredients.map((i) => [i.id, i.pricePerUnit]));

  for (const ing of data.ingredients) {
    if (!priceMap.has(ing.ingredientId)) {
      throw new AppError(
        `Ingredient with ID "${ing.ingredientId}" not found.`,
        404
      );
    }
  }

  // Calculate costs with price snapshots
  const recipeIngredients = data.ingredients.map((ing) => {
    const pricePerUnit = priceMap.get(ing.ingredientId)!;
    const calculatedCost = calculateIngredientCost(
      ing.quantity,
      pricePerUnit
    );

    return {
      ingredientId: ing.ingredientId,
      quantity: ing.quantity,
      unitPrice: pricePerUnit,
      calculatedCost,
    };
  });

  const totalCost = calculateTotalRecipeCost(
    data.ingredients.map((ing) => ({
      quantity: ing.quantity,
      pricePerUnit: priceMap.get(ing.ingredientId)!,
    }))
  );

  // Calculate nutrition totals
  const ingredientMap = new Map(dbIngredients.map((i) => [i.id, i]));
  const nutrition = calculateRecipeNutrition(
    data.ingredients.map((ing) => {
      const dbIng = ingredientMap.get(ing.ingredientId)!;
      return {
        quantity: ing.quantity,
        caloriesPerUnit: dbIng.caloriesPerUnit,
        proteinPerUnit: dbIng.proteinPerUnit,
        carbsPerUnit: dbIng.carbsPerUnit,
        fatPerUnit: dbIng.fatPerUnit,
      };
    })
  );

  // Create recipe with all ingredients in a single transaction
  const recipe = await prisma.recipe.create({
    data: {
      id,
      name: data.name,
      notes: data.notes,
      totalCost,
      ...nutrition,
      createdById: userId ?? null,
      updatedById: userId ?? null,
      recipeIngredients: {
        create: recipeIngredients,
      },
    },
    include: {
      recipeIngredients: {
        include: {
          ingredient: {
            select: { id: true, name: true, unit: true, category: true, caloriesPerUnit: true, proteinPerUnit: true, carbsPerUnit: true, fatPerUnit: true },
          },
        },
      },
    },
  });

  return recipe;
}

// ─────────────────────────────────────────────
// Update Recipe (with cost re-snapshotting)
// ─────────────────────────────────────────────

export async function updateRecipe(
  id: string,
  data: UpdateRecipeInput,
  userId?: string
): Promise<RecipeWithIngredients> {
  // Check existence
  const existing = await prisma.recipe.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError(`Recipe with ID "${id}" not found.`, 404);
  }

  // If ingredients are being updated, recalculate costs
  if (data.ingredients) {
    const ingredientIds = data.ingredients.map((i) => i.ingredientId);
    const dbIngredients = await prisma.ingredient.findMany({
      where: { id: { in: ingredientIds } },
      select: { id: true, pricePerUnit: true, caloriesPerUnit: true, proteinPerUnit: true, carbsPerUnit: true, fatPerUnit: true },
    });

    const priceMap = new Map(dbIngredients.map((i) => [i.id, i.pricePerUnit]));

    for (const ing of data.ingredients) {
      if (!priceMap.has(ing.ingredientId)) {
        throw new AppError(
          `Ingredient with ID "${ing.ingredientId}" not found.`,
          404
        );
      }
    }

    const recipeIngredients = data.ingredients.map((ing) => {
      const pricePerUnit = priceMap.get(ing.ingredientId)!;
      return {
        ingredientId: ing.ingredientId,
        quantity: ing.quantity,
        unitPrice: pricePerUnit,
        calculatedCost: calculateIngredientCost(ing.quantity, pricePerUnit),
      };
    });

    const totalCost = calculateTotalRecipeCost(
      data.ingredients.map((ing) => ({
        quantity: ing.quantity,
        pricePerUnit: priceMap.get(ing.ingredientId)!,
      }))
    );

    // Update recipe and replace all ingredients atomically
    const recipe = await prisma.$transaction(async (tx) => {
      // Delete existing recipe ingredients
      await tx.recipeIngredient.deleteMany({ where: { recipeId: id } });

      // Update recipe with new data
      return tx.recipe.update({
        where: { id },
        data: {
          name: data.name,
          notes: data.notes,
          isActive: data.isActive,
          totalCost,
          ...calculateRecipeNutrition(
            data.ingredients!.map((ing) => {
              const dbIng = dbIngredients.find((d) => d.id === ing.ingredientId)!;
              return {
                quantity: ing.quantity,
                caloriesPerUnit: dbIng.caloriesPerUnit,
                proteinPerUnit: dbIng.proteinPerUnit,
                carbsPerUnit: dbIng.carbsPerUnit,
                fatPerUnit: dbIng.fatPerUnit,
              };
            })
          ),
          updatedById: userId ?? undefined,
          recipeIngredients: {
            create: recipeIngredients,
          },
        },
        include: {
          recipeIngredients: {
            include: {
              ingredient: {
                select: { id: true, name: true, unit: true, category: true, caloriesPerUnit: true, proteinPerUnit: true, carbsPerUnit: true, fatPerUnit: true },
              },
            },
          },
        },
      });
    });

    return recipe;
  }

  // Update metadata only (no ingredient changes)
  const recipe = await prisma.recipe.update({
    where: { id },
    data: {
      name: data.name,
      notes: data.notes,
      isActive: data.isActive,
      updatedById: userId ?? undefined,
    },
    include: {
      recipeIngredients: {
        include: {
          ingredient: {
            select: { id: true, name: true, unit: true, category: true, caloriesPerUnit: true, proteinPerUnit: true, carbsPerUnit: true, fatPerUnit: true },
          },
        },
      },
    },
  });

  return recipe;
}

// ─────────────────────────────────────────────
// Delete Recipe
// ─────────────────────────────────────────────

export async function deleteRecipe(id: string): Promise<void> {
  const existing = await prisma.recipe.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError(`Recipe with ID "${id}" not found.`, 404);
  }

  // Cascade delete is configured in schema, so recipe ingredients
  // are automatically deleted
  await prisma.recipe.delete({ where: { id } });
}

// ─────────────────────────────────────────────
// Recalculate Recipe Costs
// Uses CURRENT ingredient prices to update snapshots
// ─────────────────────────────────────────────

export async function recalculateRecipeCost(
  id: string,
  userId?: string
): Promise<RecipeWithIngredients> {
  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: {
      recipeIngredients: {
        include: {
          ingredient: {
            select: { id: true, pricePerUnit: true, caloriesPerUnit: true, proteinPerUnit: true, carbsPerUnit: true, fatPerUnit: true },
          },
        },
      },
    },
  });

  if (!recipe) {
    throw new AppError(`Recipe with ID "${id}" not found.`, 404);
  }

  // Update each recipe ingredient with current price
  const updates = recipe.recipeIngredients.map((ri) => {
    const currentPrice = ri.ingredient.pricePerUnit;
    const newCost = calculateIngredientCost(ri.quantity, currentPrice);

    return prisma.recipeIngredient.update({
      where: { id: ri.id },
      data: {
        unitPrice: currentPrice,
        calculatedCost: newCost,
      },
    });
  });

  // Calculate new total
  const newTotalCost = calculateTotalRecipeCost(
    recipe.recipeIngredients.map((ri) => ({
      quantity: ri.quantity,
      pricePerUnit: ri.ingredient.pricePerUnit,
    }))
  );

  // Execute all updates in a transaction
  // Calculate new nutrition totals
  const newNutrition = calculateRecipeNutrition(
    recipe.recipeIngredients.map((ri) => ({
      quantity: ri.quantity,
      caloriesPerUnit: ri.ingredient.caloriesPerUnit,
      proteinPerUnit: ri.ingredient.proteinPerUnit,
      carbsPerUnit: ri.ingredient.carbsPerUnit,
      fatPerUnit: ri.ingredient.fatPerUnit,
    }))
  );

  await prisma.$transaction([
    ...updates,
    prisma.recipe.update({
      where: { id },
      data: {
        totalCost: newTotalCost,
        ...newNutrition,
        updatedById: userId ?? undefined,
      },
    }),
  ]);

  // Return the updated recipe
  return getRecipeById(id);
}
