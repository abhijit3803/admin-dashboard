'use client';

import React from 'react';
import type { Ingredient } from '@/types';
import CostDisplay from '@/components/ui/CostDisplay';
import Button from '@/components/ui/Button';

export interface IngredientRow {
  ingredientId: string;
  quantityGrams: number;
  ingredient?: Ingredient;
}

interface IngredientBuilderProps {
  rows: IngredientRow[];
  onChange: (rows: IngredientRow[]) => void;
  availableIngredients: Ingredient[];
  loading?: boolean;
}

export default function IngredientBuilder({
  rows,
  onChange,
  availableIngredients,
}: IngredientBuilderProps) {
  const selectedIds = new Set(rows.map((r) => r.ingredientId).filter(Boolean));

  const addRow = () => {
    onChange([...rows, { ingredientId: '', quantityGrams: 0 }]);
  };

  const removeRow = (index: number) => {
    onChange(rows.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: keyof IngredientRow, value: string | number) => {
    const updated = [...rows];
    if (field === 'ingredientId') {
      const ingredient = availableIngredients.find((ing) => ing.id === value);
      updated[index] = { ...updated[index], ingredientId: value as string, ingredient };
    } else if (field === 'quantityGrams') {
      updated[index] = { ...updated[index], quantityGrams: Number(value) || 0 };
    }
    onChange(updated);
  };

  const getRowCost = (row: IngredientRow): number => {
    const ing = row.ingredient || availableIngredients.find((i) => i.id === row.ingredientId);
    if (!ing || !row.quantityGrams) return 0;
    return (row.quantityGrams / 1000) * ing.pricePerKg;
  };

  const totalCost = rows.reduce((sum, row) => sum + getRowCost(row), 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>Ingredients</h3>
        <Button variant="secondary" size="sm" onClick={addRow} type="button">+ Add Ingredient</Button>
      </div>

      {rows.length === 0 ? (
        <div style={{
          padding: '2.5rem', textAlign: 'center', borderRadius: '12px',
          border: '2px dashed var(--color-border)', opacity: 0.6,
        }}>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>No ingredients added yet. Click &quot;Add Ingredient&quot; to start.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 140px 120px 40px',
            gap: '0.75rem', padding: '0 0.5rem', fontSize: '0.8rem', fontWeight: 600,
            opacity: 0.6, textTransform: 'uppercase' as const, letterSpacing: '0.05em',
          }}>
            <span>Ingredient</span>
            <span>Qty (grams)</span>
            <span style={{ textAlign: 'right' }}>Cost</span>
            <span></span>
          </div>

          {rows.map((row, index) => {
            const cost = getRowCost(row);
            const ing = row.ingredient || availableIngredients.find((i) => i.id === row.ingredientId);

            return (
              <div key={index} style={{
                display: 'grid', gridTemplateColumns: '1fr 140px 120px 40px',
                gap: '0.75rem', alignItems: 'center', padding: '0.75rem',
                borderRadius: '10px', background: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-border)',
                animation: 'fadeIn 0.2s ease',
              }}>
                <select
                  value={row.ingredientId}
                  onChange={(e) => updateRow(index, 'ingredientId', e.target.value)}
                  style={{
                    width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px',
                    border: '1px solid var(--color-border)', background: 'var(--color-surface)',
                    color: 'var(--color-text)', fontFamily: 'inherit', fontSize: '0.9rem',
                  }}
                >
                  <option value="">Select ingredient...</option>
                  {availableIngredients
                    .filter((ai) => ai.id === row.ingredientId || !selectedIds.has(ai.id))
                    .map((ai) => (
                      <option key={ai.id} value={ai.id}>
                        {ai.name} (₹{ai.pricePerKg}/kg)
                      </option>
                    ))}
                </select>

                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="0"
                  value={row.quantityGrams || ''}
                  onChange={(e) => updateRow(index, 'quantityGrams', e.target.value)}
                  style={{
                    width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px',
                    border: '1px solid var(--color-border)', background: 'var(--color-surface)',
                    color: 'var(--color-text)', fontFamily: 'inherit', fontSize: '0.9rem',
                    textAlign: 'right',
                  }}
                />

                <div style={{ textAlign: 'right' }}>
                  {ing && row.quantityGrams > 0 ? (
                    <CostDisplay amount={cost} currency="₹" />
                  ) : (
                    <span style={{ opacity: 0.3, fontSize: '0.85rem' }}>₹0.00</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  style={{
                    width: '32px', height: '32px', borderRadius: '8px', border: 'none',
                    background: 'var(--color-danger-subtle, rgba(244,63,94,0.1))',
                    color: 'var(--color-danger, #f43f5e)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.1rem', fontWeight: 700, transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-danger, #f43f5e)'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-danger-subtle, rgba(244,63,94,0.1))'; e.currentTarget.style.color = 'var(--color-danger, #f43f5e)'; }}
                  title="Remove ingredient"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Total Cost */}
      {rows.length > 0 && (
        <div style={{
          marginTop: '1rem', padding: '1rem 1.25rem', borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(6,182,212,0.1), rgba(16,185,129,0.1))',
          border: '1px solid rgba(6,182,212,0.2)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontWeight: 600, fontSize: '1rem' }}>Total Recipe Cost</span>
          <span style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--color-accent)' }}>
            <CostDisplay amount={totalCost} currency="₹" />
          </span>
        </div>
      )}
    </div>
  );
}
