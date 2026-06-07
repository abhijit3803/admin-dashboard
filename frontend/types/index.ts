// Frontend TypeScript Types — aligned with backend Prisma schema

import React from 'react';

// ============================================
// Base / API Types
// ============================================

export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
  q?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================
// Ingredient Types
// ============================================

export interface Ingredient {
  id: string;
  name: string;
  pricePerKg: number;
  category: string | null;
  unit: string;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  recipeIngredients?: RecipeIngredientWithRecipe[];
}

export interface RecipeIngredientWithRecipe {
  id: string;
  recipeId: string;
  quantityGrams: number;
  unitPricePerKg: number;
  calculatedCost: number;
  recipe: { id: string; name: string };
}

export interface IngredientFormData {
  name: string;
  pricePerKg: number;
  category?: string;
  unit?: string;
  notes?: string;
}

// ============================================
// Recipe Types
// ============================================

export interface Recipe {
  id: string;
  name: string;
  totalCost: number;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  recipeIngredients?: RecipeIngredient[];
}

export interface RecipeIngredient {
  id: string;
  recipeId: string;
  ingredientId: string;
  quantityGrams: number;
  unitPricePerKg: number;
  calculatedCost: number;
  createdAt: string;
  updatedAt: string;
  ingredient: {
    id: string;
    name: string;
    pricePerKg: number;
    category: string | null;
    unit: string;
  };
}

export interface RecipeFormData {
  name: string;
  notes?: string;
  ingredients: {
    ingredientId: string;
    quantityGrams: number;
  }[];
}

// ============================================
// Dashboard Types
// ============================================

export interface DashboardStats {
  totalIngredients: number;
  totalRecipes: number;
  averageRecipeCost: number;
  categoryBreakdown: { category: string; count: number }[];
  recentRecipes: { id: string; name: string; totalCost: number; createdAt: string }[];
  costliestRecipes: { id: string; name: string; totalCost: number }[];
}

// ============================================
// UI Types
// ============================================

export type Theme = 'dark' | 'light';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  width?: string;
}

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  key: string;
  direction: SortDirection;
}
