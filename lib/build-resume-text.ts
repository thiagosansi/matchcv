import type { ContactInfo, OptimizedResume } from '@/types';

function buildContactHeader(contact: ContactInfo): string {
  if (!contact.name) return '';

  const lines: string[] = [contact.name];

  const details = [
    contact.location,
    contact.phone,
    contact.email,
    contact.linkedin,
    contact.portfolio,
  ].filter(Boolean);

  if (details.length > 0) {
    lines.push(details.join(' | '));
  }

  return lines.join('\n');
}

function formatExperiences(
  experiences: OptimizedResume['experiences']
): string {
  return experiences
    .map((exp) => {
      const header = [exp.title, exp.company, exp.period]
        .filter(Boolean)
        .join(' | ');
      const bullets = (exp.bullets ?? [])
        .map((b) => `• ${b}`)
        .join('\n');
      return bullets ? `${header}\n${bullets}` : header;
    })
    .join('\n\n');
}

/**
 * Builds the complete resume text deterministically from structured data.
 * This is the single source of truth for fullText — used by exports, copy,
 * and preview. Contact info is always included when present.
 */
export function buildResumeFullText(resume: OptimizedResume): string {
  const sections: string[] = [];

  // Contact header — always first
  if (resume.contact?.name) {
    sections.push(buildContactHeader(resume.contact));
  }

  if (resume.summary?.trim()) {
    sections.push(`RESUMO PROFISSIONAL\n${resume.summary.trim()}`);
  }

  if (resume.experiences?.length) {
    sections.push(
      `EXPERIÊNCIA PROFISSIONAL\n${formatExperiences(resume.experiences)}`
    );
  }

  if (resume.skills?.length) {
    sections.push(`COMPETÊNCIAS\n${resume.skills.join(' • ')}`);
  }

  if (resume.education?.length) {
    sections.push(`FORMAÇÃO\n${resume.education.join('\n')}`);
  }

  if (resume.languages?.length) {
    sections.push(`IDIOMAS\n${resume.languages.join('\n')}`);
  }

  if (resume.certifications?.length) {
    sections.push(`CERTIFICAÇÕES\n${resume.certifications.join('\n')}`);
  }

  return sections.join('\n\n').trim();
}
