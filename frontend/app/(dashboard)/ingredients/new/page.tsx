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
    pricePerKg: '',
    category: '',
    unit: 'kg',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Ingredient name is required';
    if (!form.pricePerKg || parseFloat(form.pricePerKg) <= 0) errs.pricePerKg = 'Price must be greater than 0';
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
        pricePerKg: parseFloat(form.pricePerKg),
        category: form.category.trim() || undefined,
        unit: form.unit.trim() || 'kg',
        notes: form.notes.trim() || undefined,
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
              label="Price per Kilogram (₹)"
              id="pricePerKg"
              type="number"
              placeholder="e.g. 45.50"
              value={form.pricePerKg}
              onChange={(e) => setForm({ ...form, pricePerKg: e.target.value })}
              error={errors.pricePerKg}
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
            <Input
              label="Unit"
              id="unit"
              placeholder="kg"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              helper="Display unit (default: kg)"
            />
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
