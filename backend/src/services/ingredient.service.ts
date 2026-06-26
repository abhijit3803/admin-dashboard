/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  Ingredient Service — Business Logic Layer                  ║
 * ║  Handles all ingredient CRUD operations                     ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import type { Prisma, Ingredient } from "@prisma/client";
import prisma from "../lib/prisma.js";
import { generateUniqueId } from "../utils/idGenerator.js";
import { AppError } from "../types/index.js";
import type { PaginationMeta } from "../types/index.js";
import type {
  CreateIngredientInput,
  UpdateIngredientInput,
  IngredientQueryInput,
} from "../validators/ingredient.validator.js";

/** Ingredient with related recipe usage data */
type IngredientWithRecipes = Prisma.IngredientGetPayload<{
  include: {
    recipeIngredients: {
      include: {
        recipe: { select: { id: true; name: true } };
      };
    };
  };
}>;

// ─────────────────────────────────────────────
// List Ingredients (with pagination, search, filter)
// ─────────────────────────────────────────────

export async function listIngredients(
  query: IngredientQueryInput
): Promise<{ ingredients: Ingredient[]; meta: PaginationMeta }> {
  const { page, limit, q, category, isActive, sortBy, sortOrder } = query;
  const skip = (page - 1) * limit;

  // Build WHERE clause
  const where: Prisma.IngredientWhereInput = {};

  // Text search on name
  if (q) {
    where.name = { contains: q, mode: "insensitive" };
  }

  // Category filter
  if (category) {
    where.category = { equals: category, mode: "insensitive" };
  }

  // Active filter (default: show all if not specified)
  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  // Execute count + query in parallel
  const [total, ingredients] = await prisma.$transaction([
    prisma.ingredient.count({ where }),
    prisma.ingredient.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
  ]);

  const meta: PaginationMeta = {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };

  return { ingredients, meta };
}

// ─────────────────────────────────────────────
// Get Single Ingredient by ID
// ─────────────────────────────────────────────

export async function getIngredientById(
  id: string
): Promise<IngredientWithRecipes> {
  const ingredient = await prisma.ingredient.findUnique({
    where: { id },
    include: {
      recipeIngredients: {
        include: {
          recipe: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  if (!ingredient) {
    throw new AppError(`Ingredient with ID "${id}" not found.`, 404);
  }

  return ingredient;
}

// ─────────────────────────────────────────────
// Create Ingredient
// ─────────────────────────────────────────────

export async function createIngredient(
  data: CreateIngredientInput,
  userId?: string
): Promise<Ingredient> {
  const id = await generateUniqueId("ingredient");

  const ingredient = await prisma.ingredient.create({
    data: {
      id,
      name: data.name,
      pricePerUnit: data.pricePerUnit,
      category: data.category,
      unit: data.unit,
      notes: data.notes,
      createdById: userId ?? null,
      updatedById: userId ?? null,
      caloriesPerUnit: data.caloriesPerUnit,
      proteinPerUnit: data.proteinPerUnit,
      carbsPerUnit: data.carbsPerUnit,
      fatPerUnit: data.fatPerUnit,
    },
  });

  return ingredient;
}

// ─────────────────────────────────────────────
// Update Ingredient
// ─────────────────────────────────────────────

export async function updateIngredient(
  id: string,
  data: UpdateIngredientInput,
  userId?: string
): Promise<Ingredient> {
  // Check existence first
  const existing = await prisma.ingredient.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError(`Ingredient with ID "${id}" not found.`, 404);
  }

  // Build update data explicitly to ensure type safety with Prisma
  const updateData: Prisma.IngredientUpdateInput = {
    ...(userId ? { updatedBy: { connect: { id: userId } } } : {}),
  };
  if (data.name !== undefined) updateData.name = data.name;
  if (data.pricePerUnit !== undefined) updateData.pricePerUnit = data.pricePerUnit;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.unit !== undefined) updateData.unit = data.unit;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.caloriesPerUnit !== undefined) updateData.caloriesPerUnit = data.caloriesPerUnit;
  if (data.proteinPerUnit !== undefined) updateData.proteinPerUnit = data.proteinPerUnit;
  if (data.carbsPerUnit !== undefined) updateData.carbsPerUnit = data.carbsPerUnit;
  if (data.fatPerUnit !== undefined) updateData.fatPerUnit = data.fatPerUnit;

  const ingredient = await prisma.ingredient.update({
    where: { id },
    data: updateData,
  });

  return ingredient;
}

// ─────────────────────────────────────────────
// Delete Ingredient
// ─────────────────────────────────────────────

export async function deleteIngredient(id: string): Promise<void> {
  // Check existence
  const existing = await prisma.ingredient.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError(`Ingredient with ID "${id}" not found.`, 404);
  }

  // Check if ingredient is used in any recipe
  const usageCount = await prisma.recipeIngredient.count({
    where: { ingredientId: id },
  });

  if (usageCount > 0) {
    throw new AppError(
      `Cannot delete this ingredient because it is used in ${usageCount} recipe(s). ` +
        `Remove it from all recipes first, or deactivate it instead.`,
      409
    );
  }

  await prisma.ingredient.delete({ where: { id } });
}

// ─────────────────────────────────────────────
// Get Distinct Categories
// ─────────────────────────────────────────────

export async function getCategories(): Promise<string[]> {
  const categories = await prisma.ingredient.findMany({
    where: {
      category: { not: null },
      isActive: true,
    },
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });

  return categories
    .map((c) => c.category)
    .filter((c): c is string => c !== null);
}
