/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  Error Middleware — Global Express Error Handler             ║
 * ║  Catches all errors and returns consistent JSON responses    ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AppError } from "../types/index.js";

/**
 * Global error handler middleware.
 * Must be registered LAST in the Express middleware chain.
 * Handles:
 * - AppError (custom application errors)
 * - ZodError (validation errors)
 * - Prisma known request errors (unique constraints, foreign keys, etc.)
 * - Unexpected errors (500)
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // ── Custom Application Errors ────────────────
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // ── Zod Validation Errors ────────────────────
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));

    res.status(400).json({
      success: false,
      error: "Validation failed",
      details: formattedErrors,
    });
    return;
  }

  // ── Prisma Known Request Errors ──────────────
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      // Unique constraint violation
      case "P2002": {
        const target = (err.meta?.target as string[]) ?? [];
        res.status(409).json({
          success: false,
          error: `A record with this ${target.join(", ")} already exists.`,
        });
        return;
      }

      // Record not found
      case "P2025": {
        res.status(404).json({
          success: false,
          error: "The requested record was not found.",
        });
        return;
      }

      // Foreign key constraint failure (e.g., deleting ingredient used in recipe)
      case "P2003": {
        res.status(409).json({
          success: false,
          error:
            "Cannot delete this record because it is referenced by other records. " +
            "Remove all references first before deleting.",
        });
        return;
      }

      default: {
        console.error(`[Prisma Error ${err.code}]:`, err.message);
        res.status(500).json({
          success: false,
          error: "A database error occurred.",
        });
        return;
      }
    }
  }

  // ── Prisma Validation Errors ─────────────────
  if (err instanceof Prisma.PrismaClientValidationError) {
    console.error("[Prisma Validation Error]:", err.message);
    res.status(400).json({
      success: false,
      error: "Invalid data provided to the database.",
    });
    return;
  }

  // ── Unexpected Errors ────────────────────────
  console.error("[Unhandled Error]:", err);
  res.status(500).json({
    success: false,
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "An unexpected internal error occurred.",
  });
}
