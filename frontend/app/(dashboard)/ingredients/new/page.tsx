'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import type { ApiResponse, Ingredient } from '@/types';
import { useToast } from '@/providers/ToastProvider';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function NewIngredientPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
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
      await api.post<ApiResponse<Ingredient>>('/ingredients', payload);
      toast.success('Ingredient created', `"${form.name}" has been added.`);
      router.push('/ingredients');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create ingredient';
      toast.error('Creation failed', message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/ingredients" style={{ fontSize: '0.85rem', color: 'var(--color-accent)', textDecoration: 'none' }}>← Back to Ingredients</Link>
      </div>
      <h1 style={{ margin: '0 0 1.5rem', fontSize: '1.75rem', fontWeight: 700 }}>Add New Ingredient</h1>

      <div className="card" style={{ maxWidth: '640px' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <Input
              label="Ingredient Name"
              id="name"
              placeholder="e.g. Whole Wheat Flour"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              error={errors.name}
              required
            />
            <Input
              label="Price per Unit (₹)"
              id="pricePerUnit"
              type="number"
              placeholder="e.g. 45.50"
              value={form.pricePerUnit}
              onChange={(e) => setForm({ ...form, pricePerUnit: e.target.value })}
              error={errors.pricePerUnit}
              required
            />
            <Input
              label="Category"
              id="category"
              placeholder="e.g. Grains, Dairy, Spices"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              helper="Optional — helps organize ingredients"
            />
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
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', opacity: 0.5 }}>Display unit (default: kg)</p>
            </div>
            <div className="input-group">
              <label htmlFor="notes" style={{ fontWeight: 500, fontSize: '0.9rem', marginBottom: '0.375rem', display: 'block' }}>Notes</label>
              <textarea
                id="notes"
                className="input"
                placeholder="Optional notes about this ingredient..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                style={{ resize: 'vertical', width: '100%', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', fontFamily: 'inherit', fontSize: '0.9rem' }}
              />
            </div>

            {/* Nutritional Information */}
            <div style={{ marginTop: '0.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border)' }}>
              <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 600 }}>Nutritional Information (per unit)</h3>
              <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', opacity: 0.5 }}>Optional — used for recipe nutrition calculations</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Input
                  label="Calories (kcal)"
                  id="caloriesPerUnit"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 340"
                  value={form.caloriesPerUnit}
                  onChange={(e) => setForm({ ...form, caloriesPerUnit: e.target.value })}
                />
                <Input
                  label="Protein (g)"
                  id="proteinPerUnit"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 13.2"
                  value={form.proteinPerUnit}
                  onChange={(e) => setForm({ ...form, proteinPerUnit: e.target.value })}
                />
                <Input
                  label="Carbs (g)"
                  id="carbsPerUnit"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 71.2"
                  value={form.carbsPerUnit}
                  onChange={(e) => setForm({ ...form, carbsPerUnit: e.target.value })}
                />
                <Input
                  label="Fat (g)"
                  id="fatPerUnit"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 2.5"
                  value={form.fatPerUnit}
                  onChange={(e) => setForm({ ...form, fatPerUnit: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
            <Link href="/ingredients"><Button variant="ghost" type="button">Cancel</Button></Link>
            <Button variant="primary" type="submit" loading={saving}>Create Ingredient</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
