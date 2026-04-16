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

export function buildResumePlainText(
  optimizedResume: OptimizedResume,
  jobStructured: JobStructured | null
): string {
  if (optimizedResume.fullText?.trim()) {
    return optimizedResume.fullText.trim();
  }

  const sections: string[] = [];

  if (jobStructured?.title) {
    sections.push(`Currículo aderente à vaga: ${jobStructured.title}`);
  } else {
    sections.push('Currículo aderente à vaga');
  }

  if (jobStructured?.company) {
    sections.push(`Empresa: ${jobStructured.company}`);
  }

  if (optimizedResume.summary?.trim()) {
    sections.push(`RESUMO PROFISSIONAL\n${optimizedResume.summary.trim()}`);
  }

  if (optimizedResume.highlights?.length) {
    sections.push(
      `DESTAQUES\n${optimizedResume.highlights.map((item) => `- ${item}`).join('\n')}`
    );
  }

  if (optimizedResume.experiences?.length) {
    sections.push(
      `EXPERIÊNCIAS\n${optimizedResume.experiences
        .map((exp) => {
          const bullets = exp.bullets?.length
            ? `\n${exp.bullets.map((b) => `- ${b}`).join('\n')}`
            : '';
          return `${exp.title} | ${exp.company} | ${exp.period}${bullets}`;
        })
        .join('\n\n')}`
    );
  }

  if (optimizedResume.skills?.length) {
    sections.push(`COMPETÊNCIAS\n${optimizedResume.skills.join(', ')}`);
  }

  if (optimizedResume.education?.length) {
    sections.push(
      `FORMAÇÃO\n${optimizedResume.education.map((item) => `- ${item}`).join('\n')}`
    );
  }

  return sections.join('\n\n');
}