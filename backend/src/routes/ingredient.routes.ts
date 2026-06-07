/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  Ingredient Routes — CRUD Endpoints                         ║
 * ║  All routes prefixed with /api/ingredients                  ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { Router } from "express";
import type { Request, Response } from "express";
import {
  createIngredientSchema,
  updateIngredientSchema,
  ingredientQuerySchema,
  idParamSchema,
} from "../validators/ingredient.validator.js";
import * as ingredientService from "../services/ingredient.service.js";
import type { ApiResponse } from "../types/index.js";

const router = Router();

// ─────────────────────────────────────────────
// GET /api/ingredients
// List all ingredients with pagination, search, filter
// ─────────────────────────────────────────────

router.get("/", async (req: Request, res: Response): Promise<void> => {
  const query = ingredientQuerySchema.parse(req.query);
  const { ingredients, meta } = await ingredientService.listIngredients(query);

  const response: ApiResponse<typeof ingredients> = {
    success: true,
    data: ingredients,
    meta,
  };

  res.json(response);
});

// ─────────────────────────────────────────────
// GET /api/ingredients/categories
// Get distinct ingredient categories
// ─────────────────────────────────────────────

router.get(
  "/categories",
  async (_req: Request, res: Response): Promise<void> => {
    const categories = await ingredientService.getCategories();

    res.json({
      success: true,
      data: categories,
    });
  }
);

// ─────────────────────────────────────────────
// GET /api/ingredients/:id
// Get single ingredient by ID
// ─────────────────────────────────────────────

router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = idParamSchema.parse(req.params);
  const ingredient = await ingredientService.getIngredientById(id);

  res.json({
    success: true,
    data: ingredient,
  });
});

// ─────────────────────────────────────────────
// POST /api/ingredients
// Create a new ingredient
// ─────────────────────────────────────────────

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const data = createIngredientSchema.parse(req.body);
  const ingredient = await ingredientService.createIngredient(
    data,
    req.user?.id
  );

  res.status(201).json({
    success: true,
    data: ingredient,
  });
});

// ─────────────────────────────────────────────
// PATCH/PUT /api/ingredients/:id
// Update an existing ingredient
// ─────────────────────────────────────────────

const updateHandler = async (req: Request, res: Response): Promise<void> => {
  const { id } = idParamSchema.parse(req.params);
  const data = updateIngredientSchema.parse(req.body);
  const ingredient = await ingredientService.updateIngredient(
    id,
    data,
    req.user?.id
  );

  res.json({
    success: true,
    data: ingredient,
  });
};

router.patch("/:id", updateHandler);
router.put("/:id", updateHandler);

// ─────────────────────────────────────────────
// DELETE /api/ingredients/:id
// Delete an ingredient (blocked if used in recipes)
// ─────────────────────────────────────────────

router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = idParamSchema.parse(req.params);
  await ingredientService.deleteIngredient(id);

  res.json({
    success: true,
    data: { message: `Ingredient "${id}" has been deleted.` },
  });
});

export default router;
