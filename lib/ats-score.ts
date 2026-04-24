import type { ResumeStructured, JobStructured, ATSScoreResult, ATSScoreDimension } from '@/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const WEIGHTS = {
  keywords:     0.40,
  skills:       0.25,
  experience:   0.20,
  format:       0.10,
  completeness: 0.05,
} as const;

// Required resume sections for completeness check
const REQUIRED_SECTIONS_KEYS: Array<keyof ResumeStructured> = [
  'summary', 'experiences', 'skills', 'education',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-záàâãéèêíïóôõöúüçñ0-9\s]/gi, ' ').trim();
}

function tokenize(text: string): string[] {
  return normalize(text).split(/\s+/).filter(Boolean);
}

/**
 * Returns the set of meaningful keywords extracted from a job description.
 * Uses required + differentials + stack + soft skills.
 */
function extractJobKeywords(job: JobStructured): string[] {
  const raw = [
    job.title,
    ...job.responsibilities,
    ...job.required,
    ...job.differentials,
    ...job.stack,
    ...job.softSkills,
  ].join(' ');

  const tokens = tokenize(raw);

  // Filter stopwords and short tokens
  const stopwords = new Set([
    'de', 'da', 'do', 'em', 'e', 'a', 'o', 'as', 'os', 'para', 'com',
    'que', 'se', 'por', 'um', 'uma', 'nos', 'nas', 'ao', 'no', 'na',
    'the', 'and', 'or', 'of', 'to', 'in', 'for', 'with', 'on', 'at',
    'is', 'are', 'be', 'will', 'have', 'has',
  ]);

  const unique = Array.from(new Set(tokens)).filter(
    (t) => t.length > 2 && !stopwords.has(t)
  );

  // Prioritize stack + required (deduplicate with job.required + job.stack)
  const priority = new Set([
    ...job.required.map(normalize),
    ...job.stack.map(normalize),
  ].join(' ').split(/\s+/).filter((t) => t.length > 2));

  // Return priority keywords first, then others — capped at 60
  return [
    ...unique.filter((t) => priority.has(t)),
    ...unique.filter((t) => !priority.has(t)),
  ].slice(0, 60);
}

function resumeFullText(resume: ResumeStructured): string {
  const parts: string[] = [
    resume.summary ?? '',
    ...(resume.experiences ?? []).map((e) =>
      [e.title, e.company, e.description, ...(e.achievements ?? [])].join(' ')
    ),
    ...(resume.skills ?? []),
    ...(resume.tools ?? []),
    ...(resume.education ?? []).map((e) => [e.degree, e.institution, e.field ?? ''].join(' ')),
    ...(resume.languages ?? []).map((l) => l.name),
    ...(resume.certifications ?? []),
    ...(resume.projects ?? []).map((p) => [p.name, p.description].join(' ')),
  ];
  return normalize(parts.join(' '));
}

// ─── Dimension Scorers ───────────────────────────────────────────────────────

/**
 * KEYWORDS (40%): keyword presence + section-weighted density.
 * Keywords found in summary/skills score 1.5× vs body.
 */
function scoreKeywords(
  resume: ResumeStructured,
  jobKeywords: string[]
): { score: number; found: string[]; missing: string[] } {
  if (jobKeywords.length === 0) {
    return { score: 80, found: [], missing: [] };
  }

  const summaryText = normalize(resume.summary ?? '');
  const skillsText = normalize((resume.skills ?? []).concat(resume.tools ?? []).join(' '));
  const bodyText = resumeFullText(resume);

  let weightedFound = 0;
  const found: string[] = [];
  const missing: string[] = [];

  for (const kw of jobKeywords) {
    const inHighValue = summaryText.includes(kw) || skillsText.includes(kw);
    const inBody = bodyText.includes(kw);

    if (inHighValue) {
      weightedFound += 1.5;
      found.push(kw);
    } else if (inBody) {
      weightedFound += 1;
      found.push(kw);
    } else {
      missing.push(kw);
    }
  }

  // Score = weighted matches / max possible (all in high-value sections)
  const maxWeighted = jobKeywords.length * 1.5;
  const raw = Math.min(weightedFound / maxWeighted, 1);

  // Scale: 0.5+ coverage → 80+, 0.8+ → 95+
  const score = Math.round(Math.min(raw * 120, 100));

  return { score, found, missing };
}

/**
 * SKILLS (25%): required skills coverage + stack alignment.
 */
function scoreSkills(resume: ResumeStructured, job: JobStructured): number {
  const resumeSkillsText = normalize(
    [...(resume.skills ?? []), ...(resume.tools ?? [])].join(' ')
  );

  const required = job.required.map(normalize);
  const stack = job.stack.map(normalize);

  if (required.length + stack.length === 0) return 75;

  let matched = 0;
  const total = required.length + stack.length;

  for (const req of required) {
    if (resumeSkillsText.includes(req)) matched += 1;
    // partial match for compound terms
    else if (req.split(' ').some((part) => part.length > 3 && resumeSkillsText.includes(part))) {
      matched += 0.5;
    }
  }
  for (const tech of stack) {
    if (resumeSkillsText.includes(tech)) matched += 1;
    else if (tech.split(' ').some((part) => part.length > 3 && resumeSkillsText.includes(part))) {
      matched += 0.5;
    }
  }

  return Math.round(Math.min((matched / total) * 110, 100));
}

/**
 * EXPERIENCE (20%): title match + seniority alignment + years estimation.
 */
function scoreExperience(resume: ResumeStructured, job: JobStructured): number {
  let score = 50; // base

  const jobTitle = normalize(job.title);
  const jobSeniority = normalize(job.seniority ?? '');

  const expTitles = (resume.experiences ?? []).map((e) => normalize(e.title));

  // Title match in any experience
  const hasExactTitle = expTitles.some((t) => t.includes(jobTitle) || jobTitle.includes(t));
  if (hasExactTitle) score += 30;
  else {
    // Partial word overlap
    const jobWords = jobTitle.split(' ').filter((w) => w.length > 3);
    const hasPartial = expTitles.some((t) =>
      jobWords.some((w) => t.includes(w))
    );
    if (hasPartial) score += 15;
  }

  // Seniority match
  const seniorityTerms: Record<string, string[]> = {
    junior:  ['junior', 'jr', 'júnior', 'estágio', 'estagiário'],
    pleno:   ['pleno', 'mid', 'intermediate', 'intermediário'],
    senior:  ['senior', 'sr', 'sênior', 'lead', 'especialista'],
    gestao:  ['manager', 'gerente', 'coordenador', 'diretor', 'head', 'vp', 'c-level'],
  };

  let jobSeniorityLevel = 'pleno';
  for (const [level, terms] of Object.entries(seniorityTerms)) {
    if (terms.some((t) => jobSeniority.includes(t) || jobTitle.includes(t))) {
      jobSeniorityLevel = level;
      break;
    }
  }

  const expText = expTitles.join(' ');
  const resumeSeniorityTerms = seniorityTerms[jobSeniorityLevel] ?? [];
  if (resumeSeniorityTerms.some((t) => expText.includes(t))) score += 20;

  return Math.min(score, 100);
}

/**
 * FORMAT (10%): structural signals that ATS parsers require.
 * Checks: section presence, contact completeness, summary length.
 */
function scoreFormat(resume: ResumeStructured): number {
  let score = 100;
  const deductions: string[] = [];

  if (!resume.summary || resume.summary.trim().length < 30) {
    score -= 25;
    deductions.push('summary ausente ou muito curta');
  }

  if (!resume.experiences || resume.experiences.length === 0) {
    score -= 30;
    deductions.push('seção de experiências ausente');
  }

  if (!resume.skills || resume.skills.length === 0) {
    score -= 20;
    deductions.push('seção de habilidades ausente');
  }

  if (!resume.education || resume.education.length === 0) {
    score -= 15;
    deductions.push('seção de formação ausente');
  }

  // Contact completeness
  const contact = resume.contact;
  if (!contact?.email) score -= 10;

  return Math.max(score, 0);
}

/**
 * COMPLETENESS (5%): all expected sections present and non-empty.
 */
function scoreCompleteness(resume: ResumeStructured): number {
  let present = 0;
  const total = REQUIRED_SECTIONS_KEYS.length;

  for (const key of REQUIRED_SECTIONS_KEYS) {
    const val = resume[key];
    if (Array.isArray(val) ? val.length > 0 : Boolean(val)) {
      present++;
    }
  }

  // Bonus for optional sections
  const bonus = [
    (resume.languages ?? []).length > 0,
    (resume.certifications ?? []).length > 0,
    Boolean(resume.contact?.linkedin),
  ].filter(Boolean).length;

  return Math.min(Math.round((present / total) * 100) + bonus * 3, 100);
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Calculates a multi-dimensional ATS score for a resume against a job description.
 *
 * Returns:
 *  - total: weighted average (0-100)
 *  - dimensions: breakdown by category with score, weight, note
 *  - foundKeywords: job keywords present in the resume
 *  - missingKeywords: job keywords absent from the resume
 *  - passesThreshold: total >= 80 (industry benchmark to reach human review)
 */
export function calculateATSScore(
  resume: ResumeStructured,
  job: JobStructured
): ATSScoreResult {
  const jobKeywords = extractJobKeywords(job);
  const { score: kwScore, found, missing } = scoreKeywords(resume, jobKeywords);
  const skillsScore    = scoreSkills(resume, job);
  const experienceScore = scoreExperience(resume, job);
  const formatScore    = scoreFormat(resume);
  const completenessScore = scoreCompleteness(resume);

  const dimensions: ATSScoreDimension[] = [
    {
      key: 'keywords',
      label: 'Palavras-chave',
      score: kwScore,
      weight: WEIGHTS.keywords,
      note: missing.length === 0
        ? 'Excelente cobertura de keywords da vaga'
        : `${missing.slice(0, 3).join(', ')}${missing.length > 3 ? ` +${missing.length - 3} ausentes` : ' ausentes'}`,
    },
    {
      key: 'skills',
      label: 'Skills & Ferramentas',
      score: skillsScore,
      weight: WEIGHTS.skills,
      note: skillsScore >= 80
        ? 'Boa cobertura das skills exigidas'
        : 'Adicione as tecnologias exigidas na vaga à seção de habilidades',
    },
    {
      key: 'experience',
      label: 'Experiência',
      score: experienceScore,
      weight: WEIGHTS.experience,
      note: experienceScore >= 80
        ? 'Cargo e nível alinhados com a vaga'
        : 'Destaque cargos e responsabilidades alinhados ao título da vaga',
    },
    {
      key: 'format',
      label: 'Formato ATS',
      score: formatScore,
      weight: WEIGHTS.format,
      note: formatScore >= 80
        ? 'Estrutura compatível com parsers ATS'
        : 'Verifique seções obrigatórias: Resumo, Experiência, Habilidades, Formação',
    },
    {
      key: 'completeness',
      label: 'Completude',
      score: completenessScore,
      weight: WEIGHTS.completeness,
      note: completenessScore >= 80
        ? 'Perfil completo'
        : 'Adicione LinkedIn, certificações ou idiomas para melhorar a pontuação',
    },
  ];

  const total = Math.round(
    dimensions.reduce((sum, d) => sum + d.score * d.weight, 0)
  );

  return {
    total,
    dimensions,
    foundKeywords: found,
    missingKeywords: missing,
    passesThreshold: total >= 80,
  };
}
