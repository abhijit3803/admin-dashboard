'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import type { Ingredient, ApiResponse } from '@/types';
import { useToast } from '@/providers/ToastProvider';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Skeleton from '@/components/ui/Skeleton';

export default function EditIngredientPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [ingredient, setIngredient] = useState<Ingredient | null>(null);
  const [form, setForm] = useState({
    name: '',
    pricePerUnit: '',
    category: '',
    unit: 'kg',
    notes: '',
    caloriesPerUnit: '',
    proteinPerUnit: '',
    carbsPerUnit: '',
    fatPerUnit: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchIngredient() {
      try {
        const res = await api.get<ApiResponse<Ingredient>>(`/ingredients/${id}`);
        if (res.success) {
          setIngredient(res.data);
          setForm({
            name: res.data.name,
            pricePerUnit: String(res.data.pricePerUnit),
            category: res.data.category || '',
            unit: res.data.unit,
            notes: res.data.notes || '',
            caloriesPerUnit: res.data.caloriesPerUnit != null ? String(res.data.caloriesPerUnit) : '',
            proteinPerUnit: res.data.proteinPerUnit != null ? String(res.data.proteinPerUnit) : '',
            carbsPerUnit: res.data.carbsPerUnit != null ? String(res.data.carbsPerUnit) : '',
            fatPerUnit: res.data.fatPerUnit != null ? String(res.data.fatPerUnit) : '',
          });
        }
      } catch {
        toast.error('Not found', 'Ingredient could not be loaded.');
        router.push('/ingredients');
      } finally {
        setLoading(false);
      }
    }
    fetchIngredient();
  }, [id, router, toast]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Ingredient name is required';
    if (!form.pricePerUnit || parseFloat(form.pricePerUnit) <= 0) errs.pricePerUnit = 'Price must be greater than 0';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        pricePerUnit: parseFloat(form.pricePerUnit),
        category: form.category.trim() || undefined,
        unit: form.unit.trim() || 'kg',
        notes: form.notes.trim() || undefined,
        caloriesPerUnit: form.caloriesPerUnit ? parseFloat(form.caloriesPerUnit) : null,
        proteinPerUnit: form.proteinPerUnit ? parseFloat(form.proteinPerUnit) : null,
        carbsPerUnit: form.carbsPerUnit ? parseFloat(form.carbsPerUnit) : null,
        fatPerUnit: form.fatPerUnit ? parseFloat(form.fatPerUnit) : null,
      };
      await api.put<ApiResponse<Ingredient>>(`/ingredients/${id}`, payload);
      toast.success('Ingredient updated', `"${form.name}" has been saved.`);
      router.push('/ingredients');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update ingredient';
      toast.error('Update failed', message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/ingredients/${id}`);
      toast.success('Ingredient deleted', `"${ingredient?.name}" has been removed.`);
      router.push('/ingredients');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete';
      toast.error('Delete failed', message);
    } finally {
      setDeleting(false);
      setShowDelete(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div>
        <Skeleton height="32px" width="200px" />
        <div style={{ marginTop: '1.5rem' }}><Skeleton height="400px" /></div>
      </div>
    );
  }

  if (!ingredient) return null;

  const recipeCount = ingredient.recipeIngredients?.length || 0;

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/ingredients" style={{ fontSize: '0.85rem', color: 'var(--color-accent)', textDecoration: 'none' }}>← Back to Ingredients</Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>Edit Ingredient</h1>
          <p style={{ margin: '0.25rem 0 0', opacity: 0.5, fontSize: '0.85rem' }}>ID: {ingredient.id}</p>
        </div>
        <Button variant="danger" size="sm" onClick={() => setShowDelete(true)} disabled={recipeCount > 0}>
          {recipeCount > 0 ? `Used in ${recipeCount} recipes` : 'Delete Ingredient'}
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.25rem', alignItems: 'start' }}>
        {/* Edit Form */}
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <Input label="Ingredient Name" id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} required />
              <Input label="Price per Unit (₹)" id="pricePerUnit" type="number" value={form.pricePerUnit} onChange={(e) => setForm({ ...form, pricePerUnit: e.target.value })} error={errors.pricePerUnit} required />
              <Input label="Category" id="category" placeholder="e.g. Grains, Dairy" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              <div className="input-group">
                <label htmlFor="unit" style={{ fontWeight: 500, fontSize: '0.9rem', marginBottom: '0.375rem', display: 'block' }}>Unit</label>
                <select
                  id="unit"
                  className="input"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontFamily: 'inherit', fontSize: '0.9rem' }}
                >
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="L">L</option>
                  <option value="mL">mL</option>
                  <option value="nos">nos</option>
                  <option value="pcs">pcs</option>
                  <option value="dozen">dozen</option>
                </select>
              </div>
              <div className="input-group">
                <label htmlFor="notes" style={{ fontWeight: 500, fontSize: '0.9rem', marginBottom: '0.375rem', display: 'block' }}>Notes</label>
                <textarea id="notes" className="input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3}
                  style={{ resize: 'vertical', width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontFamily: 'inherit', fontSize: '0.9rem' }}
                />
              </div>

              {/* Nutritional Information */}
              <div style={{ marginTop: '0.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border)' }}>
                <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 600 }}>Nutritional Information (per unit)</h3>
                <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', opacity: 0.5 }}>Optional — used for recipe nutrition calculations</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <Input label="Calories (kcal)" id="caloriesPerUnit" type="number" step="0.01" min="0" placeholder="e.g. 340"
                    value={form.caloriesPerUnit} onChange={(e) => setForm({ ...form, caloriesPerUnit: e.target.value })} />
                  <Input label="Protein (g)" id="proteinPerUnit" type="number" step="0.01" min="0" placeholder="e.g. 13.2"
                    value={form.proteinPerUnit} onChange={(e) => setForm({ ...form, proteinPerUnit: e.target.value })} />
                  <Input label="Carbs (g)" id="carbsPerUnit" type="number" step="0.01" min="0" placeholder="e.g. 71.2"
                    value={form.carbsPerUnit} onChange={(e) => setForm({ ...form, carbsPerUnit: e.target.value })} />
                  <Input label="Fat (g)" id="fatPerUnit" type="number" step="0.01" min="0" placeholder="e.g. 2.5"
                    value={form.fatPerUnit} onChange={(e) => setForm({ ...form, fatPerUnit: e.target.value })} />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
              <Link href="/ingredients"><Button variant="ghost" type="button">Cancel</Button></Link>
              <Button variant="primary" type="submit" loading={saving}>Save Changes</Button>
            </div>
          </form>
        </div>

        {/* Metadata + Recipe Usage */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card">
            <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600 }}>Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div><span style={{ opacity: 0.5 }}>Created:</span> <span>{formatDate(ingredient.createdAt)}</span></div>
              <div><span style={{ opacity: 0.5 }}>Updated:</span> <span>{formatDate(ingredient.updatedAt)}</span></div>
              <div><span style={{ opacity: 0.5 }}>Status:</span> <Badge variant={ingredient.isActive ? 'success' : 'warning'}>{ingredient.isActive ? 'Active' : 'Inactive'}</Badge></div>
            </div>
          </div>

          {recipeCount > 0 && (
            <div className="card">
              <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600 }}>Used in Recipes ({recipeCount})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {ingredient.recipeIngredients!.map((ri) => (
                  <Link key={ri.id} href={`/recipes/${ri.recipe.id}`} style={{ textDecoration: 'none', color: 'var(--color-accent)', fontSize: '0.85rem' }}>
                    {ri.recipe.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete Ingredient"
        message={`Are you sure you want to delete "${ingredient.name}"? This cannot be undone.`}
        confirmText={deleting ? 'Deleting...' : 'Delete'}
        variant="danger"
      />
    </div>
  );
}
