import { parseResume } from './resume-parser';
import type { ResumeStructured, SkillCategory } from '@/types';

export interface ImportedExperience {
  company: string;
  title: string;
  location: string;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  description: string;
}

export interface ImportedEducation {
  institution: string;
  degree: string;
  field: string;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
}

export interface ImportedSkill {
  name: string;
  category: SkillCategory;
  proficiency: string;
}

export interface ImportedContact {
  name: string;
  phone: string;
  linkedin: string;
  location: string;
}

export interface ProfileImportPreview {
  contact: ImportedContact;
  experiences: ImportedExperience[];
  education: ImportedEducation[];
  skills: ImportedSkill[];
}

/**
 * Attempts to parse a free-form period string into start/end dates.
 * Period examples: "Jan 2020 – Dez 2022", "2019 – atual", "2021 – presente"
 * Returns null dates when parsing fails — the user fills them in manually.
 */
function parsePeriod(period: string): Pick<ImportedExperience, 'start_date' | 'end_date' | 'is_current'> {
  if (!period) return { start_date: null, end_date: null, is_current: false };

  const lower = period.toLowerCase();
  const isCurrent = /atual|presente|current|now/.test(lower);

  const parts = period.split(/[-–—\/]/).map((p) => p.trim()).filter(Boolean);
  const start = tryParseMonthYear(parts[0] ?? '');
  const end = isCurrent ? null : tryParseMonthYear(parts[1] ?? '');

  return { start_date: start, end_date: end, is_current: isCurrent };
}

const PT_MONTHS: Record<string, string> = {
  jan: '01', fev: '02', mar: '03', abr: '04', mai: '05', jun: '06',
  jul: '07', ago: '08', set: '09', out: '10', nov: '11', dez: '12',
  // English
  feb: '02', apr: '04', may: '05', sep: '09', oct: '10', dec: '12',
};

function tryParseMonthYear(text: string): string | null {
  if (!text) return null;

  // "Jan 2020" or "Janeiro 2020"
  const monthYear = text.match(/([a-záéíóúâêôãõç]+)[.\s]+(\d{4})/i);
  if (monthYear) {
    const monthKey = monthYear[1].toLowerCase().slice(0, 3);
    const month = PT_MONTHS[monthKey];
    if (month) return `${monthYear[2]}-${month}-01`;
  }

  // "2020" alone
  const yearOnly = text.match(/^(\d{4})$/);
  if (yearOnly) return `${yearOnly[1]}-01-01`;

  // "MM/YYYY" or "MM/YY"
  const mmYyyy = text.match(/^(\d{1,2})\/(\d{4})$/);
  if (mmYyyy) return `${mmYyyy[2]}-${mmYyyy[1].padStart(2, '0')}-01`;

  return null;
}

function classifySkills(skills: string[], tools: string[], languages: { name: string; level: string }[], certifications: string[]): ImportedSkill[] {
  const result: ImportedSkill[] = [];

  for (const name of skills) {
    if (name.trim()) result.push({ name: name.trim(), category: 'technical', proficiency: '' });
  }

  for (const name of tools) {
    if (name.trim()) result.push({ name: name.trim(), category: 'tool', proficiency: '' });
  }

  for (const lang of languages) {
    if (lang.name.trim()) result.push({ name: lang.name.trim(), category: 'language', proficiency: lang.level || '' });
  }

  for (const name of certifications) {
    if (name.trim()) result.push({ name: name.trim(), category: 'certification', proficiency: '' });
  }

  return result;
}

export async function extractProfileFromText(rawText: string): Promise<ProfileImportPreview> {
  const parsed: ResumeStructured = await parseResume(rawText);

  const experiences: ImportedExperience[] = parsed.experiences.map((exp) => {
    const { start_date, end_date, is_current } = parsePeriod(exp.period);
    const descriptionParts = [exp.description, ...(exp.achievements ?? [])].filter(Boolean);
    return {
      company: exp.company,
      title: exp.title,
      location: '',
      start_date,
      end_date,
      is_current,
      description: descriptionParts.join('\n'),
    };
  });

  const education: ImportedEducation[] = parsed.education.map((edu) => {
    const { start_date, end_date, is_current } = parsePeriod(edu.period);
    return {
      institution: edu.institution,
      degree: edu.degree,
      field: edu.field ?? '',
      start_date,
      end_date,
      is_current,
    };
  });

  const skills = classifySkills(
    parsed.skills ?? [],
    parsed.tools ?? [],
    parsed.languages ?? [],
    parsed.certifications ?? []
  );

  return {
    contact: {
      name: parsed.contact.name,
      phone: parsed.contact.phone,
      linkedin: parsed.contact.linkedin,
      location: parsed.contact.location,
    },
    experiences,
    education,
    skills,
  };
}
