'use client';

import React from 'react';
import type { RecipeIngredient } from '@/types';
import CostDisplay from '@/components/ui/CostDisplay';

interface CostBreakdownProps {
  recipeIngredients: RecipeIngredient[];
  totalCost: number;
}

export default function CostBreakdown({ recipeIngredients, totalCost }: CostBreakdownProps) {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '1.25rem 1.5rem 0.75rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>Cost Breakdown</h3>
      </div>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Ingredient</th>
              <th style={{ textAlign: 'right', width: '120px' }}>Quantity</th>
              <th style={{ textAlign: 'right', width: '130px' }}>Unit Price</th>
              <th style={{ textAlign: 'right', width: '130px' }}>Cost</th>
              <th style={{ textAlign: 'right', width: '80px' }}>%</th>
            </tr>
          </thead>
          <tbody>
            {recipeIngredients.map((ri) => {
              const percent = totalCost > 0 ? ((ri.calculatedCost / totalCost) * 100) : 0;
              return (
                <tr key={ri.id}>
                  <td style={{ fontWeight: 500 }}>{ri.ingredient.name}</td>
                  <td style={{ textAlign: 'right' }}>{ri.quantityGrams.toLocaleString('en-IN')} g</td>
                  <td style={{ textAlign: 'right' }}><CostDisplay amount={ri.unitPricePerKg} currency="₹" />/kg</td>
                  <td style={{ textAlign: 'right' }}><CostDisplay amount={ri.calculatedCost} currency="₹" /></td>
                  <td style={{ textAlign: 'right' }}>
                    <span style={{
                      fontSize: '0.8rem', fontWeight: 500, opacity: 0.7,
                      background: 'var(--color-surface-elevated)', padding: '2px 8px',
                      borderRadius: '12px',
                    }}>
                      {percent.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ fontWeight: 700, fontSize: '1.05rem' }}>
              <td colSpan={3} style={{ textAlign: 'right' }}>TOTAL</td>
              <td style={{ textAlign: 'right', color: 'var(--color-accent)' }}>
                <CostDisplay amount={totalCost} currency="₹" />
              </td>
              <td style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 500, opacity: 0.7, background: 'var(--color-surface-elevated)', padding: '2px 8px', borderRadius: '12px' }}>100%</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
