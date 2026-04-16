'use client';

import { useState } from 'react';
import type { JobStructured, OptimizedResume } from '@/types';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';

interface ExportButtonsProps {
  optimizedResume: OptimizedResume;
  jobStructured: JobStructured | null;
}

async function downloadFile(
  endpoint: string,
  payload: {
    optimizedResume: OptimizedResume;
    jobStructured: JobStructured | null;
  }
) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = 'Falha ao exportar arquivo.';
    try {
      const data = await response.json();
      if (data?.error) message = data.error;
    } catch {}
    throw new Error(message);
  }

  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="(.+)"/);
  const filename = match?.[1] || 'curriculo';

  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

export function ExportButtons({
  optimizedResume,
  jobStructured,
}: ExportButtonsProps) {
  const [loadingDocx, setLoadingDocx] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [error, setError] = useState('');

  const payload = {
    optimizedResume,
    jobStructured,
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          variant="outline"
          className="gap-2"
          disabled={loadingDocx || loadingPdf}
          onClick={async () => {
            try {
              setError('');
              setLoadingDocx(true);
              await downloadFile('/api/export/docx', payload);
            } catch (err) {
              setError(
                err instanceof Error ? err.message : 'Erro ao exportar Word.'
              );
            } finally {
              setLoadingDocx(false);
            }
          }}
        >
          <FileText className="w-4 h-4" />
          {loadingDocx ? 'Gerando Word...' : 'Baixar Word'}
        </Button>

        <Button
          variant="outline"
          className="gap-2"
          disabled={loadingDocx || loadingPdf}
          onClick={async () => {
            try {
              setError('');
              setLoadingPdf(true);
              await downloadFile('/api/export/pdf', payload);
            } catch (err) {
              setError(
                err instanceof Error ? err.message : 'Erro ao exportar PDF.'
              );
            } finally {
              setLoadingPdf(false);
            }
          }}
        >
          <Download className="w-4 h-4" />
          {loadingPdf ? 'Gerando PDF...' : 'Baixar PDF'}
        </Button>
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}