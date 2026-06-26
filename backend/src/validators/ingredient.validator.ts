/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  Ingredient Validators — Zod Schemas                        ║
 * ║  Request validation for Ingredient CRUD operations          ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { z } from "zod";

// ─────────────────────────────────────────────
// Create Ingredient
// ─────────────────────────────────────────────

export const createIngredientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Ingredient name is required")
    .max(200, "Ingredient name must be 200 characters or less"),
  pricePerUnit: z
    .number()
    .positive("Price per unit must be a positive number")
    .finite("Price must be a finite number"),
  category: z
    .string()
    .trim()
    .max(100, "Category must be 100 characters or less")
    .nullish()
    .transform((val) => val || null),
  unit: z
    .string()
    .trim()
    .max(20, "Unit must be 20 characters or less")
    .default("kg"),
  notes: z
    .string()
    .trim()
    .max(2000, "Notes must be 2000 characters or less")
    .nullish()
    .transform((val) => val || null),
  caloriesPerUnit: z.number().nonnegative().finite().nullish().transform((val) => val ?? null),
  proteinPerUnit: z.number().nonnegative().finite().nullish().transform((val) => val ?? null),
  carbsPerUnit: z.number().nonnegative().finite().nullish().transform((val) => val ?? null),
  fatPerUnit: z.number().nonnegative().finite().nullish().transform((val) => val ?? null),
});

export type CreateIngredientInput = z.infer<typeof createIngredientSchema>;

// ─────────────────────────────────────────────
// Update Ingredient (all fields optional)
// ─────────────────────────────────────────────

export const updateIngredientSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Ingredient name is required")
      .max(200, "Ingredient name must be 200 characters or less"),
    pricePerUnit: z
      .number()
      .positive("Price per unit must be a positive number")
      .finite("Price must be a finite number"),
    category: z
      .string()
      .trim()
      .max(100, "Category must be 100 characters or less")
      .nullish()
      .transform((val) => val || null),
    unit: z
      .string()
      .trim()
      .max(20, "Unit must be 20 characters or less"),
    notes: z
      .string()
      .trim()
      .max(2000, "Notes must be 2000 characters or less")
      .nullish()
      .transform((val) => val || null),
    isActive: z.boolean(),
    caloriesPerUnit: z.number().nonnegative().finite().nullish().transform((val) => val ?? null),
    proteinPerUnit: z.number().nonnegative().finite().nullish().transform((val) => val ?? null),
    carbsPerUnit: z.number().nonnegative().finite().nullish().transform((val) => val ?? null),
    fatPerUnit: z.number().nonnegative().finite().nullish().transform((val) => val ?? null),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export type UpdateIngredientInput = z.infer<typeof updateIngredientSchema>;

// ─────────────────────────────────────────────
// Query Parameters for listing ingredients
// ─────────────────────────────────────────────

export const ingredientQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  q: z.string().trim().optional(),
  category: z.string().trim().optional(),
  isActive: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
  sortBy: z
    .enum(["name", "pricePerUnit", "category", "createdAt", "updatedAt"])
    .default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type IngredientQueryInput = z.infer<typeof ingredientQuerySchema>;

// ─────────────────────────────────────────────
// ID Parameter validation
// ─────────────────────────────────────────────

export const idParamSchema = z.object({
  id: z
    .string()
    .regex(/^\d{10}$/, "ID must be a 10-digit numeric string"),
});
