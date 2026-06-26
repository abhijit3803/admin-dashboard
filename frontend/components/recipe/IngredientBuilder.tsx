'use client';

import React from 'react';
import type { Ingredient } from '@/types';
import CostDisplay from '@/components/ui/CostDisplay';
import Button from '@/components/ui/Button';

export interface IngredientRow {
  ingredientId: string;
  quantity: number; // Base quantity to be sent to backend
  displayQuantity?: number;
  displayUnit?: string;
  ingredient?: Ingredient;
}

interface IngredientBuilderProps {
  rows: IngredientRow[];
  onChange: (rows: IngredientRow[]) => void;
  availableIngredients: Ingredient[];
  loading?: boolean;
}

const getAvailableUnits = (baseUnit: string) => {
  const bu = baseUnit.toLowerCase();
  if (bu === 'kg' || bu === 'g') return ['kg', 'g'];
  if (bu === 'l' || bu === 'ml') return ['L', 'mL'];
  if (bu === 'nos' || bu === 'dozen') return ['nos', 'dozen'];
  return [baseUnit];
};

const convertToBaseUnit = (displayQty: number, displayUnit: string, baseUnit: string) => {
  const du = displayUnit.toLowerCase();
  const bu = baseUnit.toLowerCase();
  if (du === bu) return displayQty;
  if (du === 'g' && bu === 'kg') return displayQty / 1000;
  if (du === 'kg' && bu === 'g') return displayQty * 1000;
  if (du === 'ml' && bu === 'l') return displayQty / 1000;
  if (du === 'l' && bu === 'ml') return displayQty * 1000;
  if (du === 'dozen' && bu === 'nos') return displayQty * 12;
  if (du === 'nos' && bu === 'dozen') return displayQty / 12;
  return displayQty;
};

export default function IngredientBuilder({
  rows,
  onChange,
  availableIngredients,
}: IngredientBuilderProps) {
  const selectedIds = new Set(rows.map((r) => r.ingredientId).filter(Boolean));

  const addRow = () => {
    onChange([...rows, { ingredientId: '', quantity: 0, displayQuantity: 0 }]);
  };

  const removeRow = (index: number) => {
    onChange(rows.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: string, value: string | number) => {
    const updated = [...rows];
    const row = { ...updated[index] };

    if (field === 'ingredientId') {
      const ingredient = availableIngredients.find((ing) => ing.id === value);
      row.ingredientId = value as string;
      row.ingredient = ingredient;
      if (ingredient) {
        row.displayUnit = row.displayUnit && getAvailableUnits(ingredient.unit).includes(row.displayUnit) 
          ? row.displayUnit 
          : ingredient.unit;
        // Recalculate base quantity with new base unit
        row.quantity = convertToBaseUnit(row.displayQuantity || 0, row.displayUnit, ingredient.unit);
      } else {
        row.quantity = 0;
      }
    } else if (field === 'displayQuantity') {
      row.displayQuantity = Number(value) || 0;
      if (row.ingredient) {
        row.quantity = convertToBaseUnit(row.displayQuantity, row.displayUnit || row.ingredient.unit, row.ingredient.unit);
      }
    } else if (field === 'displayUnit') {
      row.displayUnit = value as string;
      if (row.ingredient) {
        row.quantity = convertToBaseUnit(row.displayQuantity || 0, row.displayUnit, row.ingredient.unit);
      }
    }
    updated[index] = row;
    onChange(updated);
  };

  const getRowCost = (row: IngredientRow): number => {
    const ing = row.ingredient || availableIngredients.find((i) => i.id === row.ingredientId);
    if (!ing || !row.quantity) return 0;
    return row.quantity * ing.pricePerUnit;
  };

  const totalCost = rows.reduce((sum, row) => sum + getRowCost(row), 0);
  
  const getNutrition = (row: IngredientRow) => {
    const ing = row.ingredient || availableIngredients.find((i) => i.id === row.ingredientId);
    if (!ing || !row.quantity) return { cal: 0, pro: 0, carb: 0, fat: 0 };
    return {
      cal: (ing.caloriesPerUnit || 0) * row.quantity,
      pro: (ing.proteinPerUnit || 0) * row.quantity,
      carb: (ing.carbsPerUnit || 0) * row.quantity,
      fat: (ing.fatPerUnit || 0) * row.quantity,
    };
  };

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {rows.map((row, index) => {
            const cost = getRowCost(row);
            const ing = row.ingredient || availableIngredients.find((i) => i.id === row.ingredientId);
            
            // Initialize display fields for existing rows (e.g. edit mode)
            const dQty = row.displayQuantity !== undefined ? row.displayQuantity : row.quantity;
            const dUnit = row.displayUnit || (ing?.unit || 'unit');
            const availableUnits = ing ? getAvailableUnits(ing.unit) : ['unit'];
            const nut = getNutrition(row);

            return (
              <div key={index} style={{
                padding: '1rem',
                borderRadius: '10px', background: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-border)',
                animation: 'fadeIn 0.2s ease',
                display: 'flex', flexDirection: 'column', gap: '0.75rem'
              }}>
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 120px 100px 100px 40px',
                  gap: '0.75rem', alignItems: 'center'
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
                          {ai.name} (₹{ai.pricePerUnit}/{ai.unit || 'unit'})
                        </option>
                      ))}
                  </select>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={dQty || ''}
                    onChange={(e) => updateRow(index, 'displayQuantity', e.target.value)}
                    style={{
                      width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px',
                      border: '1px solid var(--color-border)', background: 'var(--color-surface)',
                      color: 'var(--color-text)', fontFamily: 'inherit', fontSize: '0.9rem',
                      textAlign: 'right',
                    }}
                  />

                  <select
                    value={dUnit}
                    onChange={(e) => updateRow(index, 'displayUnit', e.target.value)}
                    disabled={!ing}
                    style={{
                      width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px',
                      border: '1px solid var(--color-border)', background: 'var(--color-surface)',
                      color: 'var(--color-text)', fontFamily: 'inherit', fontSize: '0.9rem',
                      opacity: !ing ? 0.5 : 1
                    }}
                  >
                    {availableUnits.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>

                  <div style={{ textAlign: 'right', fontWeight: 600 }}>
                    {ing && row.quantity > 0 ? (
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

                {/* Nutrition Row */}
                {ing && (
                  <div style={{ 
                    display: 'flex', gap: '1rem', alignItems: 'center', 
                    paddingTop: '0.5rem', borderTop: '1px dashed var(--color-border)',
                    fontSize: '0.8rem', opacity: 0.8
                  }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-accent)' }}>Nutrition:</span>
                    <span>Calories: {nut.cal.toFixed(1)} kcal</span>
                    <span>Protein: {nut.pro.toFixed(1)} g</span>
                    <span>Carbs: {nut.carb.toFixed(1)} g</span>
                    <span>Fat: {nut.fat.toFixed(1)} g</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Total Cost */}
      {rows.length > 0 && (
        <div style={{
          marginTop: '1.5rem', padding: '1rem 1.25rem', borderRadius: '12px',
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
