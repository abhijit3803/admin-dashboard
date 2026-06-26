/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  CSV Service — Bulk Import for Ingredients                   ║
 * ║  Validates, deduplicates, and bulk-creates ingredients       ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import prisma from "../lib/prisma.js";
import { generateUniqueId } from "../utils/idGenerator.js";

export interface CsvIngredientRow {
  name: string;
  pricePerUnit: string;
  category?: string;
  unit?: string;
  notes?: string;
  caloriesPerUnit?: string;
  proteinPerUnit?: string;
  carbsPerUnit?: string;
  fatPerUnit?: string;
}

export interface CsvValidationError {
  row: number;
  field: string;
  message: string;
  data: Record<string, string>;
}

export interface CsvValidationResult {
  valid: CsvIngredientRow[];
  errors: CsvValidationError[];
}

export function validateIngredientRows(rows: CsvIngredientRow[]): CsvValidationResult {
  const valid: CsvIngredientRow[] = [];
  const errors: CsvValidationError[] = [];

  rows.forEach((row, index) => {
    const rowNum = index + 2; // +2: row 1 is header, index is 0-based
    const rowData = row as unknown as Record<string, string>;

    // Required: name
    if (!row.name || !row.name.trim()) {
      errors.push({ row: rowNum, field: "name", message: "Name is required", data: rowData });
      return;
    }

    // Required: pricePerUnit must be a positive number
    const price = parseFloat(row.pricePerUnit);
    if (isNaN(price) || price <= 0) {
      errors.push({ row: rowNum, field: "pricePerUnit", message: "Price per unit must be a positive number", data: rowData });
      return;
    }

    // Optional numeric fields
    const numericOptional = ["caloriesPerUnit", "proteinPerUnit", "carbsPerUnit", "fatPerUnit"] as const;
    for (const field of numericOptional) {
      const val = row[field];
      if (val !== undefined && val !== "" && (isNaN(parseFloat(val)) || parseFloat(val) < 0)) {
        errors.push({ row: rowNum, field, message: `${field} must be a non-negative number`, data: rowData });
        return;
      }
    }

    valid.push(row);
  });

  return { valid, errors };
}

export async function bulkCreateIngredients(
  rows: CsvIngredientRow[]
): Promise<{ created: number; skipped: { row: number; name: string; reason: string }[] }> {
  let created = 0;
  const skipped: { row: number; name: string; reason: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    try {
      // Check for duplicate name
      const existing = await prisma.ingredient.findFirst({
        where: { name: { equals: row.name.trim(), mode: "insensitive" } },
        select: { id: true },
      });

      if (existing) {
        skipped.push({ row: rowNum, name: row.name.trim(), reason: "Ingredient with this name already exists" });
        continue;
      }

      const id = await generateUniqueId("ingredient");
      await prisma.ingredient.create({
        data: {
          id,
          name: row.name.trim(),
          pricePerUnit: parseFloat(row.pricePerUnit),
          category: row.category?.trim() || null,
          unit: row.unit?.trim() || "kg",
          notes: row.notes?.trim() || null,
          caloriesPerUnit: row.caloriesPerUnit ? parseFloat(row.caloriesPerUnit) : null,
          proteinPerUnit: row.proteinPerUnit ? parseFloat(row.proteinPerUnit) : null,
          carbsPerUnit: row.carbsPerUnit ? parseFloat(row.carbsPerUnit) : null,
          fatPerUnit: row.fatPerUnit ? parseFloat(row.fatPerUnit) : null,
        },
      });
      created++;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      skipped.push({ row: rowNum, name: row.name?.trim() || "(empty)", reason: message });
    }
  }

  return { created, skipped };
}
