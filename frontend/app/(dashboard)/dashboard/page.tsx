'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import type { DashboardStats, ApiResponse } from '@/types';
import CostDisplay from '@/components/ui/CostDisplay';
import Skeleton from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';

const defaultStats: DashboardStats = {
  totalIngredients: 0,
  totalRecipes: 0,
  averageRecipeCost: 0,
  categoryBreakdown: [],
  recentRecipes: [],
  costliestRecipes: [],
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
        if (res.success) setStats(res.data);
      } catch {
        // Backend not running — show zeros gracefully
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  return (
    <div className="page-dashboard">
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>Dashboard</h1>
          <p style={{ margin: '0.25rem 0 0', opacity: 0.6, fontSize: '0.9rem' }}>Welcome back to FRESCOO Admin</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href="/ingredients/new"><Button variant="secondary" size="sm">+ New Ingredient</Button></Link>
          <Link href="/recipes/new"><Button variant="primary" size="sm">+ New Recipe</Button></Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {loading ? (
          <>
            <Skeleton height="120px" />
            <Skeleton height="120px" />
            <Skeleton height="120px" />
            <Skeleton height="120px" />
          </>
        ) : (
          <>
            <div className="stat-card">
              <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
              </div>
              <div className="stat-card-content">
                <span className="stat-card-label">Total Ingredients</span>
                <span className="stat-card-value">{stats.totalIngredients}</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
              </div>
              <div className="stat-card-content">
                <span className="stat-card-label">Total Recipes</span>
                <span className="stat-card-value">{stats.totalRecipes}</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
              </div>
              <div className="stat-card-content">
                <span className="stat-card-label">Avg Recipe Cost</span>
                <span className="stat-card-value"><CostDisplay amount={stats.averageRecipeCost} currency="₹" /></span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
              </div>
              <div className="stat-card-content">
                <span className="stat-card-label">Categories</span>
                <span className="stat-card-value">{stats.categoryBreakdown.length}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Two-column: Recent Recipes + Costliest Recipes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.25rem' }}>
        {/* Recent Recipes */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Recent Recipes</h2>
            <Link href="/recipes" style={{ fontSize: '0.85rem', color: 'var(--color-accent)' }}>View All →</Link>
          </div>
          {loading ? (
            <Skeleton height="40px" count={5} />
          ) : stats.recentRecipes.length === 0 ? (
            <p style={{ opacity: 0.5, textAlign: 'center', padding: '2rem 0' }}>No recipes yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {stats.recentRecipes.map((recipe) => (
                <Link key={recipe.id} href={`/recipes/${recipe.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.75rem 1rem', borderRadius: '8px',
                    background: 'var(--color-surface-elevated)', transition: 'background 0.2s',
                  }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-surface-elevated)'}
                  >
                    <div>
                      <div style={{ fontWeight: 500 }}>{recipe.name}</div>
                      <div style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: '2px' }}>{formatDate(recipe.createdAt)}</div>
                    </div>
                    <CostDisplay amount={recipe.totalCost} currency="₹" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Costliest Recipes */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Costliest Recipes</h2>
            <Link href="/recipes" style={{ fontSize: '0.85rem', color: 'var(--color-accent)' }}>View All →</Link>
          </div>
          {loading ? (
            <Skeleton height="40px" count={5} />
          ) : stats.costliestRecipes.length === 0 ? (
            <p style={{ opacity: 0.5, textAlign: 'center', padding: '2rem 0' }}>No recipes yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {stats.costliestRecipes.map((recipe, index) => (
                <Link key={recipe.id} href={`/recipes/${recipe.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.75rem 1rem', borderRadius: '8px',
                    background: 'var(--color-surface-elevated)', transition: 'background 0.2s',
                  }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-surface-elevated)'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{
                        width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.8rem', fontWeight: 700,
                        background: index === 0 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : index === 1 ? 'linear-gradient(135deg, #94a3b8, #64748b)' : index === 2 ? 'linear-gradient(135deg, #cd7c2f, #a0522d)' : 'var(--color-surface)',
                        color: index < 3 ? '#fff' : 'var(--color-text)',
                      }}>
                        {index + 1}
                      </span>
                      <span style={{ fontWeight: 500 }}>{recipe.name}</span>
                    </div>
                    <CostDisplay amount={recipe.totalCost} currency="₹" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
