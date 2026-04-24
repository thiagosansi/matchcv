import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { parseResume } from '@/lib/services/resume-parser';
import { parseJob } from '@/lib/services/job-parser';
import { analyzeCompatibility, optimizeResume } from '@/lib/services/analysis';
import { estimateSalary } from '@/lib/services/salary';
import { generateGupyTexts } from '@/lib/services/gupy';
import { detectPlatform } from '@/lib/platforms';
import { getFullProfile, fullProfileToResumeStructured } from '@/lib/data/profile';
import { calculateATSScore } from '@/lib/ats-score';
import type { Platform } from '@/types';

function parseMoneyToNumber(val: string): number {
  const num = parseFloat(val.replace(/[^\d,]/g, '').replace(',', '.'));
  return Number.isNaN(num) ? 0 : num;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resumeText, jobText, jobUrl, userId, useProfile } = body;

    if (!userId || typeof userId !== 'string' || userId.length < 10) {
      return NextResponse.json({ error: 'Usuário inválido.' }, { status: 400 });
    }

    if (!jobText || typeof jobText !== 'string' || jobText.trim().length < 50) {
      return NextResponse.json(
        { error: 'A descrição da vaga precisa ter pelo menos 50 caracteres válidos.' },
        { status: 400 }
      );
    }

    if (jobText.length > 10000) {
      return NextResponse.json(
        { error: 'O texto da vaga excede o limite permitido.' },
        { status: 400 }
      );
    }

    // When useProfile is true, resume text is optional (profile data will be used)
    if (!useProfile) {
      if (!resumeText || typeof resumeText !== 'string' || resumeText.trim().length < 100) {
        return NextResponse.json(
          { error: 'O currículo precisa ter pelo menos 100 caracteres válidos.' },
          { status: 400 }
        );
      }
      if (resumeText.length > 15000) {
        return NextResponse.json(
          { error: 'O texto do currículo excede o limite permitido.' },
          { status: 400 }
        );
      }
    }

    // Detect platform from URL so parseJob can set isGupy and platform correctly
    const platform: Platform = jobUrl ? detectPlatform(jobUrl) : 'generic';

    // Attempt to load structured profile — fall back to raw text parsing if not available
    const fullProfile = await getFullProfile(userId).catch(() => null);
    const hasStructuredProfile =
      fullProfile !== null &&
      (fullProfile.work_experiences.length > 0 || fullProfile.skills.length > 0);

    if (useProfile && !hasStructuredProfile) {
      return NextResponse.json(
        { error: 'Nenhum perfil estruturado encontrado. Preencha seu perfil antes de usar esta opção.' },
        { status: 400 }
      );
    }

    const effectiveResumeText = (resumeText ?? '').trim();

    const [resumeStructured, jobStructured] = await Promise.all([
      hasStructuredProfile
        ? Promise.resolve(fullProfileToResumeStructured(fullProfile!))
        : parseResume(effectiveResumeText),
      parseJob(jobText.trim(), platform),
    ]);

    const [analysis, salary] = await Promise.all([
      analyzeCompatibility(resumeStructured, jobStructured, effectiveResumeText),
      estimateSalary(jobStructured),
    ]);

    // Hybrid ATS score: deterministic rule-based engine (complements AI score)
    const atsScore = calculateATSScore(resumeStructured, jobStructured);

    const [optimized, gupySuggestions] = await Promise.all([
      optimizeResume(resumeStructured, jobStructured, analysis, effectiveResumeText),
      jobStructured.isGupy
        ? generateGupyTexts(resumeStructured, jobStructured)
        : Promise.resolve(null),
    ]);

    const db = createServerClient();

    const { data: resumeRecord, error: resumeInsertError } = await db
      .from('resumes')
      .insert({
        user_id: userId,
        file_name: useProfile ? 'profile_resume' : 'uploaded_resume.txt',
        file_path: '',
        raw_text: effectiveResumeText,
        structured_json: resumeStructured,
      })
      .select('id')
      .maybeSingle();

    if (resumeInsertError) {
      throw new Error(resumeInsertError.message);
    }

    const { data: analysisRecord, error: analysisInsertError } = await db
      .from('job_analyses')
      .insert({
        user_id: userId,
        resume_id: resumeRecord?.id ?? null,
        job_source_type: jobUrl ? 'url' : 'text',
        job_url: jobUrl ?? '',
        job_raw_text: jobText.trim(),
        job_structured_json: jobStructured,
        match_score: atsScore.total,
        strengths_json: analysis.strengths,
        gaps_json: analysis.gaps,
        missing_keywords_json: atsScore.missingKeywords.length > 0
          ? atsScore.missingKeywords
          : analysis.atsKeywords,
        section_recommendations_json: analysis.sectionSuggestions,
        optimized_resume_text: optimized.fullText ?? '',
        optimized_resume_json: optimized,
        executive_summary: analysis.executiveSummary,
        ats_keywords: atsScore.foundKeywords.length > 0
          ? atsScore.foundKeywords
          : analysis.atsKeywords,
        ats_score_json: atsScore,
        is_gupy: jobStructured.isGupy,
        status: 'completed',
      })
      .select('id')
      .maybeSingle();

    if (analysisInsertError) {
      throw new Error(analysisInsertError.message);
    }

    const analysisId = analysisRecord?.id ?? null;

    if (analysisId && gupySuggestions) {
      const { error } = await db.from('gupy_suggestions').insert({
        analysis_id: analysisId,
        formal_text: gupySuggestions.formal ?? '',
        human_text: gupySuggestions.human ?? '',
        objective_text: gupySuggestions.objective ?? '',
      });
      if (error) throw new Error(error.message);
    }

    if (analysisId && salary) {
      const { error } = await db.from('salary_suggestions').insert({
        analysis_id: analysisId,
        salary_min: parseMoneyToNumber(salary.min),
        salary_mid: parseMoneyToNumber(salary.mid),
        salary_max: parseMoneyToNumber(salary.max),
        currency: 'BRL',
        explanation: salary.explanation,
        source_summary: salary.factors?.join('; ') ?? '',
      });
      if (error) throw new Error(error.message);
    }

    return NextResponse.json({
      id: analysisId,
      jobStructured,
      analysis,
      atsScore,
      optimizedResume: optimized,
      salary,
      gupySuggestions,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    const message = error instanceof Error ? error.message : 'Analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
