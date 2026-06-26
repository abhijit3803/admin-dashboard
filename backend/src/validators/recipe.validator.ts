/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  Recipe Validators — Zod Schemas                            ║
 * ║  Request validation for Recipe CRUD operations              ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { z } from "zod";

// ─────────────────────────────────────────────
// Recipe Ingredient Item
// ─────────────────────────────────────────────

const recipeIngredientItemSchema = z.object({
  ingredientId: z
    .string()
    .regex(/^\d{10}$/, "Ingredient ID must be a 10-digit numeric string"),
  quantity: z
    .number()
    .positive("Quantity must be a positive number")
    .finite("Quantity must be a finite number"),
});

// ─────────────────────────────────────────────
// Create Recipe
// ─────────────────────────────────────────────

export const createRecipeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Recipe name is required")
    .max(300, "Recipe name must be 300 characters or less"),
  notes: z
    .string()
    .trim()
    .max(5000, "Notes must be 5000 characters or less")
    .nullish()
    .transform((val) => val || null),
  ingredients: z
    .array(recipeIngredientItemSchema)
    .min(1, "A recipe must have at least one ingredient")
    .refine(
      (items) => {
        const ids = items.map((i) => i.ingredientId);
        return new Set(ids).size === ids.length;
      },
      { message: "Duplicate ingredients are not allowed in a recipe" }
    ),
});

export type CreateRecipeInput = z.infer<typeof createRecipeSchema>;

// ─────────────────────────────────────────────
// Update Recipe
// ─────────────────────────────────────────────

export const updateRecipeSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Recipe name is required")
      .max(300, "Recipe name must be 300 characters or less"),
    notes: z
      .string()
      .trim()
      .max(5000, "Notes must be 5000 characters or less")
      .nullish()
      .transform((val) => val || null),
    isActive: z.boolean(),
    ingredients: z
      .array(recipeIngredientItemSchema)
      .min(1, "A recipe must have at least one ingredient")
      .refine(
        (items) => {
          const ids = items.map((i) => i.ingredientId);
          return new Set(ids).size === ids.length;
        },
        { message: "Duplicate ingredients are not allowed in a recipe" }
      ),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export type UpdateRecipeInput = z.infer<typeof updateRecipeSchema>;

// ─────────────────────────────────────────────
// Query Parameters for listing recipes
// ─────────────────────────────────────────────

export const recipeQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  q: z.string().trim().optional(),
  isActive: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
  sortBy: z
    .enum(["name", "totalCost", "createdAt", "updatedAt"])
    .default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type RecipeQueryInput = z.infer<typeof recipeQuerySchema>;

// ─────────────────────────────────────────────
// ID Parameter validation
// ─────────────────────────────────────────────

export const recipeIdParamSchema = z.object({
  id: z
    .string()
    .regex(/^\d{10}$/, "ID must be a 10-digit numeric string"),
});
