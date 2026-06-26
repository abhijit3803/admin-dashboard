'use client';

import React, { useState, useRef } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface ValidationError {
  row: number;
  field: string;
  message: string;
  data: Record<string, string>;
}

interface SkippedRow {
  row: number;
  name: string;
  reason: string;
}

interface CsvImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
  validateEndpoint: string;
  importEndpoint: string;
  templateEndpoint: string;
  title: string;
}

type Phase = 'upload' | 'preview' | 'importing' | 'results';

export default function CsvImportDialog({
  isOpen,
  onClose,
  onImportComplete,
  validateEndpoint,
  importEndpoint,
  templateEndpoint,
  title,
}: CsvImportDialogProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');

  // Validation results
  const [totalRows, setTotalRows] = useState(0);
  const [validRows, setValidRows] = useState(0);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  // Import results
  const [created, setCreated] = useState(0);
  const [skipped, setSkipped] = useState<SkippedRow[]>([]);
  const [importValidationErrors, setImportValidationErrors] = useState<ValidationError[]>([]);

  const reset = () => {
    setPhase('upload');
    setFile(null);
    setError('');
    setTotalRows(0);
    setValidRows(0);
    setPreview([]);
    setValidationErrors([]);
    setCreated(0);
    setSkipped([]);
    setImportValidationErrors([]);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setError('');
    setValidating(true);

    try {
      const formData = new FormData();
      formData.append('file', f);

      const res = await fetch(`${API_BASE}${validateEndpoint}`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Validation failed');
        setPhase('upload');
        return;
      }

      setTotalRows(data.data.totalRows);
      setValidRows(data.data.validRows);
      setPreview(data.data.preview || []);
      setValidationErrors(data.data.errors || []);
      setPhase('preview');
    } catch {
      setError('Failed to validate CSV file');
    } finally {
      setValidating(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setPhase('importing');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_BASE}${importEndpoint}`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Import failed');
        setPhase('preview');
        return;
      }

      setCreated(data.data.created);
      setSkipped(data.data.skipped || []);
      setImportValidationErrors(data.data.validationErrors || []);
      setPhase('results');
      onImportComplete();
    } catch {
      setError('Failed to import CSV file');
      setPhase('preview');
    } finally {
      setImporting(false);
    }
  };

  const previewHeaders = preview.length > 0 ? Object.keys(preview[0]) : [];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      <div style={{ minWidth: '500px', maxWidth: '800px' }}>
        {/* Template download link */}
        <div style={{ marginBottom: '1.25rem', padding: '0.75rem 1rem', background: 'var(--color-bg)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
          <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>Need the format? </span>
          <a
            href={`${API_BASE}${templateEndpoint}`}
            download
            style={{ fontSize: '0.85rem', color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 500 }}
          >
            📋 Download CSV Template
          </a>
        </div>

        {/* Upload Phase */}
        {phase === 'upload' && (
          <div>
            <div
              style={{
                border: '2px dashed var(--color-border)',
                borderRadius: '12px',
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'border-color 0.2s',
              }}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--color-accent)'; }}
              onDragLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = 'var(--color-border)';
                const f = e.dataTransfer.files[0];
                if (f && f.name.endsWith('.csv')) {
                  const dt = new DataTransfer();
                  dt.items.add(f);
                  if (fileRef.current) {
                    fileRef.current.files = dt.files;
                    fileRef.current.dispatchEvent(new Event('change', { bubbles: true }));
                  }
                }
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📁</div>
              <p style={{ margin: '0 0 0.25rem', fontWeight: 500 }}>
                {validating ? 'Validating...' : 'Click or drag a CSV file here'}
              </p>
              <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.5 }}>Max 5 MB • .csv format only</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>
        )}

        {/* Preview Phase */}
        {phase === 'preview' && (
          <div>
            {/* Summary */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', background: 'var(--color-bg)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{totalRows}</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>Total Rows</div>
              </div>
              <div style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', background: 'rgba(34,197,94,0.08)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#22c55e' }}>{validRows}</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>Valid</div>
              </div>
              <div style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', background: validationErrors.length > 0 ? 'rgba(239,68,68,0.08)' : 'var(--color-bg)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: validationErrors.length > 0 ? '#ef4444' : 'inherit' }}>{validationErrors.length}</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>Errors</div>
              </div>
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: '#ef4444' }}>⚠️ Validation Errors</h4>
                <div style={{ maxHeight: '150px', overflow: 'auto', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)', fontSize: '0.8rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'rgba(239,68,68,0.05)' }}>
                        <th style={{ padding: '0.4rem 0.6rem', textAlign: 'left' }}>Row</th>
                        <th style={{ padding: '0.4rem 0.6rem', textAlign: 'left' }}>Field</th>
                        <th style={{ padding: '0.4rem 0.6rem', textAlign: 'left' }}>Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validationErrors.map((err, i) => (
                        <tr key={i} style={{ borderTop: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '0.4rem 0.6rem' }}>#{err.row}</td>
                          <td style={{ padding: '0.4rem 0.6rem', fontWeight: 500 }}>{err.field}</td>
                          <td style={{ padding: '0.4rem 0.6rem' }}>{err.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Preview Table */}
            {preview.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem' }}>📋 Preview (first {preview.length} valid rows)</h4>
                <div style={{ maxHeight: '200px', overflow: 'auto', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.78rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--color-bg)', position: 'sticky', top: 0 }}>
                        {previewHeaders.map((h) => (
                          <th key={h} style={{ padding: '0.4rem 0.6rem', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, i) => (
                        <tr key={i} style={{ borderTop: '1px solid var(--color-border)' }}>
                          {previewHeaders.map((h) => (
                            <td key={h} style={{ padding: '0.4rem 0.6rem', whiteSpace: 'nowrap', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {row[h] || <span style={{ opacity: 0.3 }}>—</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
              <Button variant="ghost" onClick={() => { reset(); }}>Choose Different File</Button>
              <Button
                variant="primary"
                onClick={handleImport}
                disabled={validRows === 0}
              >
                Import {validRows} Rows
              </Button>
            </div>
          </div>
        )}

        {/* Importing Phase */}
        {phase === 'importing' && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⏳</div>
            <p style={{ fontWeight: 500 }}>Importing {validRows} ingredients...</p>
            <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>Please wait, this may take a moment.</p>
          </div>
        )}

        {/* Results Phase */}
        {phase === 'results' && (
          <div>
            {/* Success summary */}
            <div style={{ padding: '1.25rem', borderRadius: '10px', background: 'rgba(34,197,94,0.08)', marginBottom: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>✅</div>
              <p style={{ margin: '0 0 0.25rem', fontWeight: 600, fontSize: '1.1rem' }}>{created} ingredients created successfully</p>
              {skipped.length > 0 && (
                <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.6 }}>{skipped.length} skipped (duplicates or errors)</p>
              )}
              {importValidationErrors.length > 0 && (
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#ef4444' }}>{importValidationErrors.length} rows had validation errors</p>
              )}
            </div>

            {/* Skipped details */}
            {skipped.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem' }}>⏭️ Skipped Rows</h4>
                <div style={{ maxHeight: '150px', overflow: 'auto', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.8rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--color-bg)' }}>
                        <th style={{ padding: '0.4rem 0.6rem', textAlign: 'left' }}>Name</th>
                        <th style={{ padding: '0.4rem 0.6rem', textAlign: 'left' }}>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {skipped.map((s, i) => (
                        <tr key={i} style={{ borderTop: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '0.4rem 0.6rem', fontWeight: 500 }}>{s.name}</td>
                          <td style={{ padding: '0.4rem 0.6rem' }}>{s.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem' }}>
              <Button variant="primary" onClick={handleClose}>Done</Button>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}
