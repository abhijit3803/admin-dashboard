'use client';

import React, { useState } from 'react';
import type { Column, SortConfig, SortDirection } from '@/types';

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  sortable?: boolean;
  onSort?: (key: string, direction: SortDirection) => void;
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  keyExtractor?: (item: T) => string | number;
}

export default function Table<T extends Record<string, unknown>>({
  columns,
  data,
  sortable = false,
  onSort,
  loading = false,
  emptyMessage = 'No data found',
  emptyIcon,
  keyExtractor,
}: TableProps<T>) {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  const handleSort = (key: string) => {
    if (!sortable) return;

    let direction: SortDirection = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }

    setSortConfig({ key, direction });
    onSort?.(key, direction);
  };

  if (loading) {
    return (
      <div className="table-container">
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key} style={col.width ? { width: col.width } : undefined}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.key}>
                      <div className="skeleton skeleton-text" style={{ width: '70%' }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="table-container">
        <div className="empty-state">
          <div className="empty-state-icon">
            {emptyIcon || '📋'}
          </div>
          <p className="empty-state-title">{emptyMessage}</p>
          <p className="empty-state-description">
            Try adjusting your search or filters to find what you&apos;re looking for.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <div className="table-scroll">
        <table className="table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`${col.sortable !== false && sortable ? 'sortable' : ''} ${
                    sortConfig?.key === col.key ? 'sorted' : ''
                  }`}
                  onClick={() => col.sortable !== false && sortable && handleSort(col.key)}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.label}
                  {col.sortable !== false && sortable && (
                    <span className="sort-icon">
                      {sortConfig?.key === col.key
                        ? sortConfig.direction === 'asc'
                          ? '↑'
                          : '↓'
                        : '↕'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={keyExtractor ? keyExtractor(item) : index}>
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(item) : String(item[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
