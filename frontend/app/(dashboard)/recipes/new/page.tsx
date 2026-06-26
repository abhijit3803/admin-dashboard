'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import type { Ingredient, Recipe, ApiResponse } from '@/types';
import { useToast } from '@/providers/ToastProvider';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Skeleton from '@/components/ui/Skeleton';
import IngredientBuilder, { type IngredientRow } from '@/components/recipe/IngredientBuilder';

export default function NewRecipePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [loadingIngredients, setLoadingIngredients] = useState(true);
  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([]);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [rows, setRows] = useState<IngredientRow[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchIngredients() {
      try {
        const res = await api.get<ApiResponse<Ingredient[]>>('/ingredients', { limit: 100, isActive: true });
        if (res.success) setAvailableIngredients(res.data);
      } catch {
        toast.error('Failed to load ingredients');
      } finally {
        setLoadingIngredients(false);
      }
    }
    fetchIngredients();
  }, [toast]);

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
      const res = await api.post<ApiResponse<Recipe>>('/recipes', payload);
      if (res.success) {
        toast.success('Recipe created', `"${name}" has been saved.`);
        router.push(`/recipes/${res.data.id}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create recipe';
      toast.error('Creation failed', message);
    } finally {
      setSaving(false);
    }
  };

  if (loadingIngredients) {
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
        <Link href="/recipes" style={{ fontSize: '0.85rem', color: 'var(--color-accent)', textDecoration: 'none' }}>← Back to Recipes</Link>
      </div>
      <h1 style={{ margin: '0 0 1.5rem', fontSize: '1.75rem', fontWeight: 700 }}>Create New Recipe</h1>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Basic Info */}
          <div className="card">
            <h2 style={{ margin: '0 0 1.25rem', fontSize: '1.1rem', fontWeight: 600 }}>Basic Information</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '500px' }}>
              <Input
                label="Recipe Name"
                id="name"
                placeholder="e.g. Whole Wheat Bread"
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
                  placeholder="Optional notes, instructions, or batch details..."
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
            <Link href="/recipes"><Button variant="ghost" type="button">Cancel</Button></Link>
            <Button variant="primary" type="submit" loading={saving}>Create Recipe</Button>
          </div>
        </div>
      </form>
    </div>
  );
}
