/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  Shared TypeScript Types                                     ║
 * ║  Used across routes, services, and middleware                ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

// ─────────────────────────────────────────────
// Standard API Response Envelope
// ─────────────────────────────────────────────

/** Pagination metadata returned with list endpoints */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Successful API response */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

/** Error API response */
export interface ApiErrorResponse {
  success: false;
  error: string;
}

/** Union type for all API responses */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ─────────────────────────────────────────────
// Pagination Query Parameters
// ─────────────────────────────────────────────

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

// ─────────────────────────────────────────────
// Dashboard Stats
// ─────────────────────────────────────────────

export interface DashboardStats {
  totalIngredients: number;
  totalRecipes: number;
  averageRecipeCost: number;
  categoryBreakdown: CategoryCount[];
  recentRecipes: RecentRecipe[];
  costliestRecipes: CostliestRecipe[];
}

export interface CategoryCount {
  category: string;
  count: number;
}

export interface RecentRecipe {
  id: string;
  name: string;
  totalCost: number;
  createdAt: Date;
}

export interface CostliestRecipe {
  id: string;
  name: string;
  totalCost: number;
}

// ─────────────────────────────────────────────
// Recipe Ingredient Input (for create/update)
// ─────────────────────────────────────────────

export interface RecipeIngredientInput {
  ingredientId: string;
  quantityGrams: number;
}

// ─────────────────────────────────────────────
// Express Request Extensions
// ─────────────────────────────────────────────

/** Authenticated user payload attached by auth middleware */
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

// Extend Express Request to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// ─────────────────────────────────────────────
// Application Error
// ─────────────────────────────────────────────

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
