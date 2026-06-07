/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  Dashboard Routes — Aggregated Stats Endpoint               ║
 * ║  Prefixed with /api/dashboard                               ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { Router } from "express";
import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import type { DashboardStats, ApiResponse } from "../types/index.js";

const router = Router();

// ─────────────────────────────────────────────
// GET /api/dashboard/stats
// Returns aggregated dashboard statistics
// ─────────────────────────────────────────────

router.get(
  "/stats",
  async (_req: Request, res: Response): Promise<void> => {
    // Execute all queries in parallel for performance
    const [
      totalIngredients,
      totalRecipes,
      avgCostResult,
      categoryBreakdown,
      recentRecipes,
      costliestRecipes,
    ] = await Promise.all([
      // Total active ingredients
      prisma.ingredient.count({ where: { isActive: true } }),

      // Total active recipes
      prisma.recipe.count({ where: { isActive: true } }),

      // Average recipe cost
      prisma.recipe.aggregate({
        _avg: { totalCost: true },
        where: { isActive: true },
      }),

      // Ingredient count by category
      prisma.ingredient.groupBy({
        by: ["category"],
        _count: { _all: true },
        where: { isActive: true },
        orderBy: { _count: { category: "desc" } },
      }),

      // 5 most recently created recipes
      prisma.recipe.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          totalCost: true,
          createdAt: true,
        },
      }),

      // Top 5 costliest recipes
      prisma.recipe.findMany({
        where: { isActive: true },
        orderBy: { totalCost: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          totalCost: true,
        },
      }),
    ]);

    const stats: DashboardStats = {
      totalIngredients,
      totalRecipes,
      averageRecipeCost: avgCostResult._avg.totalCost ?? 0,
      categoryBreakdown: categoryBreakdown.map((c) => ({
        category: c.category ?? "Uncategorized",
        count: c._count._all,
      })),
      recentRecipes,
      costliestRecipes,
    };

    const response: ApiResponse<DashboardStats> = {
      success: true,
      data: stats,
    };

    res.json(response);
  }
);

export default router;
