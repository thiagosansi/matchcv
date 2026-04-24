import { createServerClient } from '@/lib/supabase';
import type { FullProfile, WorkExperience, EducationEntry, ProfileSkill, ProfileContactInfo } from '@/types';

/**
 * Fetches the complete structured profile for a user.
 * Used by the analyze pipeline to build the AI input from structured data.
 *
 * Returns null if the user has no profile record.
 */
export async function getFullProfile(userId: string): Promise<FullProfile | null> {
  const db = createServerClient();

  const [profileRes, experiencesRes, educationRes, skillsRes] = await Promise.all([
    db
      .from('profiles')
      .select('full_name, professional_goal, base_summary, contact_info')
      .eq('id', userId)
      .maybeSingle(),

    db
      .from('work_experiences')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('display_order', { ascending: true }),

    db
      .from('education_entries')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('display_order', { ascending: true }),

    db
      .from('profile_skills')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('category', { ascending: true })
      .order('display_order', { ascending: true }),
  ]);

  if (!profileRes.data) return null;

  return {
    full_name: profileRes.data.full_name ?? '',
    professional_goal: profileRes.data.professional_goal ?? '',
    base_summary: profileRes.data.base_summary ?? '',
    contact_info: (profileRes.data.contact_info as ProfileContactInfo) ?? {},
    work_experiences: (experiencesRes.data ?? []) as WorkExperience[],
    education: (educationRes.data ?? []) as EducationEntry[],
    skills: (skillsRes.data ?? []) as ProfileSkill[],
  };
}

/**
 * Converts a FullProfile to a ResumeStructured-compatible format
 * for use in the existing analysis pipeline.
 */
export function fullProfileToResumeStructured(profile: FullProfile) {
  const technicalSkills = profile.skills
    .filter((s) => s.category === 'technical' || s.category === 'tool')
    .map((s) => s.name);

  const tools = profile.skills
    .filter((s) => s.category === 'tool')
    .map((s) => s.name);

  const languages = profile.skills
    .filter((s) => s.category === 'language')
    .map((s) => ({ name: s.name, level: s.proficiency || 'fluente' }));

  const certifications = profile.skills
    .filter((s) => s.category === 'certification')
    .map((s) => s.name);

  return {
    contact: {
      name: profile.full_name,
      email: '',
      phone: profile.contact_info.phone ?? '',
      linkedin: profile.contact_info.linkedin ?? '',
      location: profile.contact_info.location ?? '',
      portfolio: profile.contact_info.website ?? '',
    },
    summary: profile.base_summary || profile.professional_goal,
    experiences: profile.work_experiences.map((exp) => ({
      title: exp.title,
      company: exp.company,
      period: formatPeriod(exp.start_date, exp.end_date, exp.is_current),
      description: exp.description,
      achievements: exp.description
        ? exp.description.split('\n').filter((line) => line.trim().startsWith('-') || line.trim().startsWith('•'))
        : [],
    })),
    skills: technicalSkills,
    tools,
    education: profile.education.map((edu) => ({
      degree: [edu.degree, edu.field].filter(Boolean).join(' em '),
      institution: edu.institution,
      period: formatPeriod(edu.start_date, edu.end_date, edu.is_current),
      field: edu.field,
    })),
    languages,
    projects: [],
    certifications,
  };
}

function formatPeriod(
  startDate: string | null,
  endDate: string | null,
  isCurrent: boolean
): string {
  const start = startDate ? formatDate(startDate) : '';
  const end = isCurrent ? 'atual' : (endDate ? formatDate(endDate) : '');
  if (!start && !end) return '';
  if (!start) return end;
  if (!end) return start;
  return `${start} – ${end}`;
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' });
  } catch {
    return dateStr;
  }
}
