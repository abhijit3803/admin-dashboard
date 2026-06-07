/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  Recipe Routes — CRUD + Recalculate Endpoints               ║
 * ║  All routes prefixed with /api/recipes                      ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { Router } from "express";
import type { Request, Response } from "express";
import {
  createRecipeSchema,
  updateRecipeSchema,
  recipeQuerySchema,
  recipeIdParamSchema,
} from "../validators/recipe.validator.js";
import * as recipeService from "../services/recipe.service.js";
import type { ApiResponse } from "../types/index.js";

const router = Router();

// ─────────────────────────────────────────────
// GET /api/recipes
// List all recipes with pagination & search
// ─────────────────────────────────────────────

router.get("/", async (req: Request, res: Response): Promise<void> => {
  const query = recipeQuerySchema.parse(req.query);
  const { recipes, meta } = await recipeService.listRecipes(query);

  const response: ApiResponse<typeof recipes> = {
    success: true,
    data: recipes,
    meta,
  };

  res.json(response);
});

// ─────────────────────────────────────────────
// GET /api/recipes/:id
// Get single recipe by ID (with ingredients)
// ─────────────────────────────────────────────

router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = recipeIdParamSchema.parse(req.params);
  const recipe = await recipeService.getRecipeById(id);

  res.json({
    success: true,
    data: recipe,
  });
});

// ─────────────────────────────────────────────
// POST /api/recipes
// Create a new recipe (snapshots ingredient prices)
// ─────────────────────────────────────────────

router.post("/", async (req: Request, res: Response): Promise<void> => {
  const data = createRecipeSchema.parse(req.body);
  const recipe = await recipeService.createRecipe(data, req.user?.id);

  res.status(201).json({
    success: true,
    data: recipe,
  });
});

// ─────────────────────────────────────────────
// PATCH/PUT /api/recipes/:id
// Update an existing recipe
// ─────────────────────────────────────────────

const updateHandler = async (req: Request, res: Response): Promise<void> => {
  const { id } = recipeIdParamSchema.parse(req.params);
  const data = updateRecipeSchema.parse(req.body);
  const recipe = await recipeService.updateRecipe(id, data, req.user?.id);

  res.json({
    success: true,
    data: recipe,
  });
};

router.patch("/:id", updateHandler);
router.put("/:id", updateHandler);

// ─────────────────────────────────────────────
// DELETE /api/recipes/:id
// Delete a recipe (cascades to recipe ingredients)
// ─────────────────────────────────────────────

router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  const { id } = recipeIdParamSchema.parse(req.params);
  await recipeService.deleteRecipe(id);

  res.json({
    success: true,
    data: { message: `Recipe "${id}" has been deleted.` },
  });
});

// ─────────────────────────────────────────────
// POST /api/recipes/:id/recalculate
// Recalculate recipe costs using current ingredient prices
// ─────────────────────────────────────────────

router.post(
  "/:id/recalculate",
  async (req: Request, res: Response): Promise<void> => {
    const { id } = recipeIdParamSchema.parse(req.params);
    const recipe = await recipeService.recalculateRecipeCost(id, req.user?.id);

    res.json({
      success: true,
      data: recipe,
    });
  }
);

export default router;
