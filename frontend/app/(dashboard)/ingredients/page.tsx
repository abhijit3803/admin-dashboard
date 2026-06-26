'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import type { Ingredient, ApiResponse, PaginationMeta } from '@/types';
import { useToast } from '@/providers/ToastProvider';
import Button from '@/components/ui/Button';
import SearchBar from '@/components/ui/SearchBar';
import Badge from '@/components/ui/Badge';
import CostDisplay from '@/components/ui/CostDisplay';
import Pagination from '@/components/ui/Pagination';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import CsvImportDialog from '@/components/ui/CsvImportDialog';

export default function IngredientsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Ingredient | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showCsvImport, setShowCsvImport] = useState(false);

  const fetchIngredients = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (search) params.q = search;
      if (category) params.category = category;
      const res = await api.get<ApiResponse<Ingredient[]>>('/ingredients', params);
      if (res.success) {
        setIngredients(res.data);
        if (res.meta) setMeta(res.meta);
      }
    } catch {
      toast.error('Failed to load ingredients');
    } finally {
      setLoading(false);
    }
  }, [search, category, toast]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get<ApiResponse<string[]>>('/ingredients/categories');
      if (res.success) setCategories(res.data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { fetchIngredients(1); }, [fetchIngredients]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/ingredients/${deleteTarget.id}`);
      toast.success('Ingredient deleted', `"${deleteTarget.name}" has been removed.`);
      setDeleteTarget(null);
      fetchIngredients(meta.page);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete ingredient';
      toast.error('Delete failed', message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>Ingredients</h1>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Button variant="ghost" size="sm" onClick={() => setShowCsvImport(true)}>📥 Import CSV</Button>
          <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/csv/ingredients/template`} download style={{ textDecoration: 'none' }}>
            <Button variant="ghost" size="sm">📋 Template</Button>
          </a>
          <Link href="/ingredients/new">
            <Button variant="primary">+ Add Ingredient</Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 300px' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search ingredients..." />
        </div>
        <select
          className="input"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ width: '200px', padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '1.5rem' }}>
            <Skeleton height="48px" count={8} />
          </div>
        ) : ingredients.length === 0 ? (
          <EmptyState
            title="No ingredients found"
            description={search || category ? 'Try adjusting your search or filter.' : 'Get started by adding your first ingredient.'}
            action={!search && !category ? { label: '+ Add Ingredient', onClick: () => router.push('/ingredients/new') } : undefined}
          />
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>ID</th>
                  <th>Name</th>
                  <th style={{ width: '140px' }}>Category</th>
                  <th style={{ width: '140px', textAlign: 'right' }}>Price / Unit</th>
                  <th style={{ width: '60px', textAlign: 'right', fontSize: '0.75rem' }}>Cal</th>
                  <th style={{ width: '55px', textAlign: 'right', fontSize: '0.75rem' }}>Pro</th>
                  <th style={{ width: '55px', textAlign: 'right', fontSize: '0.75rem' }}>Carb</th>
                  <th style={{ width: '50px', textAlign: 'right', fontSize: '0.75rem' }}>Fat</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>Unit</th>
                  <th style={{ width: '180px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {ingredients.map((ing) => (
                  <tr key={ing.id}>
                    <td><code style={{ fontSize: '0.8rem', opacity: 0.7 }}>{ing.id}</code></td>
                    <td style={{ fontWeight: 500 }}>{ing.name}</td>
                    <td>{ing.category ? <Badge variant="info">{ing.category}</Badge> : <span style={{ opacity: 0.4 }}>—</span>}</td>
                    <td style={{ textAlign: 'right' }}><CostDisplay amount={ing.pricePerUnit} currency="₹" /></td>
                    <td style={{ textAlign: 'right', fontSize: '0.8rem', opacity: 0.7 }}>{ing.caloriesPerUnit != null ? ing.caloriesPerUnit : <span style={{ opacity: 0.3 }}>—</span>}</td>
                    <td style={{ textAlign: 'right', fontSize: '0.8rem', opacity: 0.7 }}>{ing.proteinPerUnit != null ? ing.proteinPerUnit : <span style={{ opacity: 0.3 }}>—</span>}</td>
                    <td style={{ textAlign: 'right', fontSize: '0.8rem', opacity: 0.7 }}>{ing.carbsPerUnit != null ? ing.carbsPerUnit : <span style={{ opacity: 0.3 }}>—</span>}</td>
                    <td style={{ textAlign: 'right', fontSize: '0.8rem', opacity: 0.7 }}>{ing.fatPerUnit != null ? ing.fatPerUnit : <span style={{ opacity: 0.3 }}>—</span>}</td>
                    <td style={{ textAlign: 'center' }}>{ing.unit}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/ingredients/${ing.id}`)}>Edit</Button>
                        <Button variant="danger" size="sm" onClick={() => setDeleteTarget(ing)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
          <Pagination currentPage={meta.page} totalPages={meta.totalPages} onPageChange={(p) => fetchIngredients(p)} />
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Ingredient"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone. If this ingredient is used in any recipes, the deletion will be blocked.`}
        confirmText={deleting ? 'Deleting...' : 'Delete'}
        variant="danger"
      />

      {/* CSV Import Dialog */}
      <CsvImportDialog
        isOpen={showCsvImport}
        onClose={() => setShowCsvImport(false)}
        onImportComplete={() => fetchIngredients(1)}
        validateEndpoint="/csv/ingredients/validate"
        importEndpoint="/csv/ingredients/import"
        templateEndpoint="/csv/ingredients/template"
        title="Import Ingredients from CSV"
      />
    </div>
  );
}
