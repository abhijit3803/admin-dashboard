'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import type { Recipe, ApiResponse, PaginationMeta } from '@/types';
import { useToast } from '@/providers/ToastProvider';
import Button from '@/components/ui/Button';
import SearchBar from '@/components/ui/SearchBar';
import Badge from '@/components/ui/Badge';
import CostDisplay from '@/components/ui/CostDisplay';
import Pagination from '@/components/ui/Pagination';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';

export default function RecipesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Recipe | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRecipes = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (search) params.q = search;
      const res = await api.get<ApiResponse<Recipe[]>>('/recipes', params);
      if (res.success) {
        setRecipes(res.data);
        if (res.meta) setMeta(res.meta);
      }
    } catch {
      toast.error('Failed to load recipes');
    } finally {
      setLoading(false);
    }
  }, [search, toast]);

  useEffect(() => { fetchRecipes(1); }, [fetchRecipes]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/recipes/${deleteTarget.id}`);
      toast.success('Recipe deleted', `"${deleteTarget.name}" has been removed.`);
      setDeleteTarget(null);
      fetchRecipes(meta.page);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete recipe';
      toast.error('Delete failed', message);
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>Recipes</h1>
        <Link href="/recipes/new"><Button variant="primary">+ New Recipe</Button></Link>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '1.5rem', maxWidth: '400px' }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search recipes..." />
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '1.5rem' }}><Skeleton height="48px" count={8} /></div>
        ) : recipes.length === 0 ? (
          <EmptyState
            title="No recipes found"
            description={search ? 'Try adjusting your search.' : 'Get started by creating your first recipe.'}
            action={!search ? { label: '+ New Recipe', onClick: () => router.push('/recipes/new') } : undefined}
          />
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>ID</th>
                  <th>Name</th>
                  <th style={{ width: '140px', textAlign: 'right' }}>Total Cost</th>
                  <th style={{ width: '120px', textAlign: 'center' }}>Ingredients</th>
                  <th style={{ width: '130px' }}>Created</th>
                  <th style={{ width: '220px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recipes.map((recipe) => (
                  <tr key={recipe.id}>
                    <td><code style={{ fontSize: '0.8rem', opacity: 0.7 }}>{recipe.id}</code></td>
                    <td style={{ fontWeight: 500 }}>{recipe.name}</td>
                    <td style={{ textAlign: 'right' }}><CostDisplay amount={recipe.totalCost} currency="₹" /></td>
                    <td style={{ textAlign: 'center' }}>
                      <Badge variant="info">{recipe.recipeIngredients?.length || 0}</Badge>
                    </td>
                    <td style={{ fontSize: '0.85rem', opacity: 0.7 }}>{formatDate(recipe.createdAt)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/recipes/${recipe.id}`)}>View</Button>
                        <Button variant="secondary" size="sm" onClick={() => router.push(`/recipes/${recipe.id}/edit`)}>Edit</Button>
                        <Button variant="danger" size="sm" onClick={() => setDeleteTarget(recipe)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {meta.totalPages > 1 && (
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
          <Pagination currentPage={meta.page} totalPages={meta.totalPages} onPageChange={(p) => fetchRecipes(p)} />
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Recipe"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmText={deleting ? 'Deleting...' : 'Delete'}
        variant="danger"
      />
    </div>
  );
}
