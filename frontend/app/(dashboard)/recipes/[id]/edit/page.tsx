'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import type { Ingredient, Recipe, ApiResponse } from '@/types';
import { useToast } from '@/providers/ToastProvider';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Skeleton from '@/components/ui/Skeleton';
import IngredientBuilder, { type IngredientRow } from '@/components/recipe/IngredientBuilder';

export default function EditRecipePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([]);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [rows, setRows] = useState<IngredientRow[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      try {
        const [recipeRes, ingredientsRes] = await Promise.all([
          api.get<ApiResponse<Recipe>>(`/recipes/${id}`),
          api.get<ApiResponse<Ingredient[]>>('/ingredients', { limit: 100, isActive: true }),
        ]);

        if (ingredientsRes.success) setAvailableIngredients(ingredientsRes.data);

        if (recipeRes.success) {
          const recipe = recipeRes.data;
          setName(recipe.name);
          setNotes(recipe.notes || '');

          // Map existing recipe ingredients to builder rows
          if (recipe.recipeIngredients) {
            const ingredientMap = new Map(
              (ingredientsRes.success ? ingredientsRes.data : []).map((ing) => [ing.id, ing])
            );
            setRows(
              recipe.recipeIngredients.map((ri) => ({
                ingredientId: ri.ingredientId,
                quantity: ri.quantity,
                ingredient: ingredientMap.get(ri.ingredientId),
              }))
            );
          }
        }
      } catch {
        toast.error('Not found', 'Recipe could not be loaded.');
        router.push('/recipes');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, router, toast]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Recipe name is required';
    if (rows.length === 0) errs.ingredients = 'Add at least one ingredient';
    if (rows.some((r) => !r.ingredientId)) errs.ingredients = 'All ingredient rows must have a selection';
    if (rows.some((r) => r.quantity <= 0)) errs.ingredients = 'All quantities must be greater than 0';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        notes: notes.trim() || undefined,
        ingredients: rows.map((r) => ({
          ingredientId: r.ingredientId,
          quantity: r.quantity,
        })),
      };
      await api.put<ApiResponse<Recipe>>(`/recipes/${id}`, payload);
      toast.success('Recipe updated', `"${name}" has been saved.`);
      router.push(`/recipes/${id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update recipe';
      toast.error('Update failed', message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Skeleton height="32px" width="250px" />
        <div style={{ marginTop: '1.5rem' }}><Skeleton height="500px" /></div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href={`/recipes/${id}`} style={{ fontSize: '0.85rem', color: 'var(--color-accent)', textDecoration: 'none' }}>← Back to Recipe</Link>
      </div>
      <h1 style={{ margin: '0 0 1.5rem', fontSize: '1.75rem', fontWeight: 700 }}>Edit Recipe</h1>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Basic Info */}
          <div className="card">
            <h2 style={{ margin: '0 0 1.25rem', fontSize: '1.1rem', fontWeight: 600 }}>Basic Information</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '500px' }}>
              <Input
                label="Recipe Name"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.name}
                required
              />
              <div className="input-group">
                <label htmlFor="notes" style={{ fontWeight: 500, fontSize: '0.9rem', marginBottom: '0.375rem', display: 'block' }}>Notes</label>
                <textarea
                  id="notes"
                  className="input"
                  placeholder="Optional notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  style={{ resize: 'vertical', width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontFamily: 'inherit', fontSize: '0.9rem' }}
                />
              </div>
            </div>
          </div>

          {/* Ingredient Builder */}
          <div className="card">
            <IngredientBuilder
              rows={rows}
              onChange={setRows}
              availableIngredients={availableIngredients}
            />
            {errors.ingredients && (
              <p style={{ color: 'var(--color-danger, #f43f5e)', fontSize: '0.85rem', marginTop: '0.5rem' }}>{errors.ingredients}</p>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Link href={`/recipes/${id}`}><Button variant="ghost" type="button">Cancel</Button></Link>
            <Button variant="primary" type="submit" loading={saving}>Save Changes</Button>
          </div>
        </div>
      </form>
    </div>
  );
}
