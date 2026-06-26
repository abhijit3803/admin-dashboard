/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  CSV Routes — Import & Template Download                     ║
 * ║  Handles CSV file upload, validation, and bulk import        ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { Router } from "express";
import type { Request, Response } from "express";
import multer from "multer";
import { parse } from "csv-parse/sync";
import { validateIngredientRows, bulkCreateIngredients } from "../services/csv.service.js";
import type { CsvIngredientRow } from "../services/csv.service.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// ─────────────────────────────────────────────
// GET /api/csv/ingredients/template
// Download CSV template with headers + sample rows
// ─────────────────────────────────────────────

router.get("/ingredients/template", (_req: Request, res: Response): void => {
  const headers = "name,pricePerUnit,category,unit,notes,caloriesPerUnit,proteinPerUnit,carbsPerUnit,fatPerUnit";
  const sample1 = "Whole Wheat Flour,42.50,Grains,kg,Premium quality atta,340,13.2,71.2,2.5";
  const sample2 = "Unsalted Butter,520.00,Dairy,kg,Amul brand preferred,717,0.9,0.1,81.1";
  const csv = `${headers}\n${sample1}\n${sample2}\n`;

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="ingredients_template.csv"');
  res.send(csv);
});

// ─────────────────────────────────────────────
// POST /api/csv/ingredients/validate
// Parse and validate CSV without importing
// ─────────────────────────────────────────────

router.post("/ingredients/validate", upload.single("file"), (req: Request, res: Response): void => {
  if (!req.file) {
    res.status(400).json({ success: false, error: "No file uploaded" });
    return;
  }

  try {
    const content = req.file.buffer.toString("utf-8");
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as CsvIngredientRow[];

    if (records.length === 0) {
      res.status(400).json({ success: false, error: "CSV file is empty or has no data rows" });
      return;
    }

    const result = validateIngredientRows(records);

    res.json({
      success: true,
      data: {
        totalRows: records.length,
        validRows: result.valid.length,
        errorRows: result.errors.length,
        preview: result.valid.slice(0, 20),
        errors: result.errors,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to parse CSV";
    res.status(400).json({ success: false, error: `CSV parsing error: ${message}` });
  }
});

// ─────────────────────────────────────────────
// POST /api/csv/ingredients/import
// Parse, validate, and import CSV
// ─────────────────────────────────────────────

router.post("/ingredients/import", upload.single("file"), async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ success: false, error: "No file uploaded" });
    return;
  }

  try {
    const content = req.file.buffer.toString("utf-8");
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as CsvIngredientRow[];

    if (records.length === 0) {
      res.status(400).json({ success: false, error: "CSV file is empty or has no data rows" });
      return;
    }

    const validation = validateIngredientRows(records);
    const importResult = await bulkCreateIngredients(validation.valid);

    res.json({
      success: true,
      data: {
        totalRows: records.length,
        created: importResult.created,
        skipped: importResult.skipped,
        validationErrors: validation.errors,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to import CSV";
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
