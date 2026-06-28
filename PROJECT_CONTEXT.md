# FRESCOO Admin Dashboard — Project Context

## 1. Project Overview
The **FRESCOO Admin Dashboard** is an internal tool built to manage food manufacturing operations. Its primary purpose is to manage raw **Ingredients**, build **Recipes**, automatically calculate total production costs, and track nutritional profiles (Calories, Protein, Carbs, Fat). 

This dashboard is designed to be the foundational module of a larger system.

## 2. Technology Stack
* **Frontend:** Next.js (App Router), React, TypeScript. Hosted on Vercel.
* **Backend:** Node.js, Express.js, TypeScript. Hosted on Vercel (configured as Serverless Functions via `@vercel/node`).
* **Database:** PostgreSQL hosted on Neon (Serverless Postgres).
* **ORM:** Prisma.

## 3. Core Database Schema & Relationships
The database uses Prisma. Key models include:

### `Ingredient`
Stores raw materials.
* **Fields:** `id`, `name`, `category`, `pricePerUnit`, `unit` (base unit: kg, L, nos, etc.), `isActive`, `notes`.
* **Nutrition Fields:** `caloriesPerUnit`, `proteinPerUnit`, `carbsPerUnit`, `fatPerUnit`.

### `Recipe`
Stores the final manufactured product.
* **Fields:** `id`, `name`, `description`, `category`, `targetYield`, `targetYieldUnit`, `outputType`, `profitMarginPercent`, `productionHours`, `laborCostPerHour`, `packagingCost`.

### `RecipeIngredient`
The junction table linking a `Recipe` to multiple `Ingredient`s.
* **Fields:** `id`, `recipeId`, `ingredientId`, `quantity` (stored in the base unit of the ingredient).

## 4. Key Business Logic & Recent Refactors
A significant amount of engineering went into the **Unit Conversion Engine**:
* **Generic Per-Unit System:** The system was recently refactored away from hardcoded "per Kg" logic. An ingredient can now be stored natively in `kg`, `L`, or `nos`.
* **Dynamic Frontend Scaling:** Inside the Recipe Builder (`frontend/components/recipe/IngredientBuilder.tsx`), users can dynamically toggle between units (e.g., viewing/entering `500 grams` for an ingredient stored as `kg`, or `2 dozen` for an ingredient stored as `nos`). The UI handles this state (`displayQuantity`, `displayUnit`) and mathematically normalizes it to the base `quantity` before sending it to the API.
* **Real-time Cost & Nutrition:** As ingredients are added or their units are toggled in the Recipe Builder, the UI instantly recalculates the total cost and the macro-nutritional breakdown.
* **Backend Calculator:** The backend (`backend/src/utils/costCalculator.ts`) serves as the single source of truth, validating the frontend's calculations before saving.

## 5. File Structure (Key Directories)
```text
admin-dashboard/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma           # Database schema
│   │   └── migrations/             # SQL migration history
│   ├── src/
│   │   ├── index.ts                # Express server entry point
│   │   ├── routes/                 # API endpoint definitions (ingredients, recipes, csv)
│   │   ├── services/               # Core business logic and DB calls
│   │   ├── utils/                  # Helpers (costCalculator.ts)
│   │   └── validators/             # Zod validation schemas
│   └── vercel.json                 # Vercel Serverless configuration
└── frontend/
    ├── app/
    │   └── (dashboard)/            # Next.js App Router pages (recipes, ingredients)
    ├── components/
    │   ├── recipe/                 # Complex UI (IngredientBuilder.tsx, CostBreakdown.tsx)
    │   └── ui/                     # Reusable UI elements (CsvImportDialog.tsx, etc.)
    ├── lib/
    │   └── api.ts                  # Axios/Fetch wrapper for backend communication
    └── types/
        └── index.ts                # Shared TypeScript interfaces
```

## 6. Integrations & Features
* **CSV Bulk Import:** The system supports bulk importing Ingredients via CSV. The backend uses `multer` for multipart form parsing and `csv-parse` for data extraction. The frontend has a dedicated UI component (`CsvImportDialog.tsx`) that handles validation, previewing, and importing.
* **Vercel Serverless Backend:** The Express backend has been modified with a `vercel.json` config and a conditional `app.listen()` wrapper to run flawlessly on Vercel's serverless infrastructure without port conflicts.

## 7. Current State & Pending Tasks
This project is functional and deployed, but several features are explicitly paused or pending for the next iteration:
1. **Authentication:** Currently, auth is bypassed (`SKIP_AUTH=true`). The integration of **NextAuth.js with Google SSO** is required before full production rollout.
2. **Recipe CSV Import:** While Ingredient CSV import/export is fully implemented, the ability to import entire Recipes via CSV is a pending user request.
3. **Dashboard Analytics:** The main dashboard landing page requires integration with actual database metrics to show top-level stats (Total recipes, recent costs, etc.).

## 8. Deployment Details
* **Environment Variables (Backend):** `DATABASE_URL` (Neon), `NODE_ENV=production`, `SKIP_AUTH=true`, `FRONTEND_URL` (CORS).
* **Environment Variables (Frontend):** `NEXT_PUBLIC_API_URL` (pointing to the backend's `/api` route).
