import { buildResumeFullText } from '@/lib/build-resume-text';
import type { JobStructured, OptimizedResume } from '@/types';

function sanitizePart(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase();
}

export function buildExportFileName(
  optimizedResume: OptimizedResume,
  jobStructured: JobStructured | null,
  extension: 'docx' | 'pdf'
): string {
  const role = sanitizePart(jobStructured?.title || 'curriculo');
  const company = sanitizePart(jobStructured?.company || 'vaga');
  return `matchcv-${role}-${company}.${extension}`;
}

/**
 * Returns the full resume text for export.
 * Uses buildResumeFullText (deterministic, includes contact header) when the
 * resume has structured data; falls back to stored fullText for legacy records.
 */
export function buildResumePlainText(
  optimizedResume: OptimizedResume,
  _jobStructured: JobStructured | null
): string {
  // Prefer deterministic build if we have structured content
  if (optimizedResume.experiences?.length || optimizedResume.summary) {
    return buildResumeFullText(optimizedResume);
  }

  // Legacy fallback for old DB records without structured data
  return optimizedResume.fullText?.trim() ?? '';
}
