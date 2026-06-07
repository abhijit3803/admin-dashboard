'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import type { Recipe, ApiResponse } from '@/types';
import { useToast } from '@/providers/ToastProvider';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import CostDisplay from '@/components/ui/CostDisplay';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Skeleton from '@/components/ui/Skeleton';
import CostBreakdown from '@/components/recipe/CostBreakdown';

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRecalculate, setShowRecalculate] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchRecipe = useCallback(async () => {
    try {
      const res = await api.get<ApiResponse<Recipe>>(`/recipes/${id}`);
      if (res.success) setRecipe(res.data);
    } catch {
      toast.error('Not found', 'Recipe could not be loaded.');
      router.push('/recipes');
    } finally {
      setLoading(false);
    }
  }, [id, router, toast]);

  useEffect(() => { fetchRecipe(); }, [fetchRecipe]);

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      const res = await api.post<ApiResponse<Recipe>>(`/recipes/${id}/recalculate`);
      if (res.success) {
        setRecipe(res.data);
        toast.success('Costs recalculated', 'Recipe costs updated to current ingredient prices.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to recalculate';
      toast.error('Recalculation failed', message);
    } finally {
      setRecalculating(false);
      setShowRecalculate(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/recipes/${id}`);
      toast.success('Recipe deleted', `"${recipe?.name}" has been removed.`);
      router.push('/recipes');
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
        <Skeleton height="40px" width="300px" />
        <div style={{ marginTop: '1.5rem' }}><Skeleton height="200px" /></div>
        <div style={{ marginTop: '1rem' }}><Skeleton height="300px" /></div>
      </div>
    );
  }

  if (!recipe) return null;

  const ingredients = recipe.recipeIngredients || [];

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/recipes" style={{ fontSize: '0.85rem', color: 'var(--color-accent)', textDecoration: 'none' }}>← Back to Recipes</Link>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>{recipe.name}</h1>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.5rem', fontSize: '0.85rem', opacity: 0.6 }}>
            <span>ID: {recipe.id}</span>
            <span>•</span>
            <span>Created: {formatDate(recipe.createdAt)}</span>
            <span>•</span>
            <Badge variant={recipe.isActive ? 'success' : 'warning'}>{recipe.isActive ? 'Active' : 'Inactive'}</Badge>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link href={`/recipes/${id}/edit`}><Button variant="secondary" size="sm">Edit Recipe</Button></Link>
          <Button variant="primary" size="sm" onClick={() => setShowRecalculate(true)}>Recalculate Costs</Button>
          <Button variant="danger" size="sm" onClick={() => setShowDelete(true)}>Delete</Button>
        </div>
      </div>

      {/* Total Cost Card */}
      <div className="card" style={{
        marginBottom: '1.5rem', textAlign: 'center', padding: '2rem',
        background: 'linear-gradient(135deg, rgba(6,182,212,0.08), rgba(16,185,129,0.08))',
        border: '1px solid rgba(6,182,212,0.15)',
      }}>
        <p style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total Recipe Cost</p>
        <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-accent)' }}>
          <CostDisplay amount={recipe.totalCost} currency="₹" />
        </div>
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', opacity: 0.5 }}>{ingredients.length} ingredient{ingredients.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Notes */}
      {recipe.notes && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 600 }}>Notes</h3>
          <p style={{ margin: 0, lineHeight: 1.6, opacity: 0.8, whiteSpace: 'pre-wrap' }}>{recipe.notes}</p>
        </div>
      )}

      {/* Cost Breakdown */}
      {ingredients.length > 0 && (
        <CostBreakdown recipeIngredients={ingredients} totalCost={recipe.totalCost} />
      )}

      {/* Recalculate Dialog */}
      <ConfirmDialog
        isOpen={showRecalculate}
        onClose={() => setShowRecalculate(false)}
        onConfirm={handleRecalculate}
        title="Recalculate Costs"
        message="This will update all ingredient costs in this recipe to their current prices. The previously saved (historical) costs will be overwritten. Are you sure?"
        confirmText={recalculating ? 'Recalculating...' : 'Recalculate'}
        variant="danger"
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete Recipe"
        message={`Are you sure you want to delete "${recipe.name}"? This action cannot be undone.`}
        confirmText={deleting ? 'Deleting...' : 'Delete'}
        variant="danger"
      />
    </div>
  );
}
