import { NextRequest, NextResponse } from 'next/server';
import { parseResume } from '@/lib/services/resume-parser';
import { parseJob } from '@/lib/services/job-parser';
import { analyzeCompatibility, optimizeResume } from '@/lib/services/analysis';
import { estimateSalary } from '@/lib/services/salary';
import { generateGupyTexts } from '@/lib/services/gupy';
import type { OptimizedResume } from '@/types';

// Test-only route: runs the full AI pipeline without saving to the database.
// Do not use in production flows.

function buildFallbackOptimizedText(optimized: OptimizedResume): string {
  return [
    optimized.summary ? `RESUMO PROFISSIONAL\n${optimized.summary}` : '',
    optimized.highlights?.length
      ? `DESTAQUES\n${optimized.highlights.map((item) => `• ${item}`).join('\n')}`
      : '',
    optimized.experiences?.length
      ? `EXPERIÊNCIAS\n${optimized.experiences
          .map(
            (exp) =>
              `${exp.title} | ${exp.company} | ${exp.period}\n${(exp.bullets ?? [])
                .map((bullet) => `• ${bullet}`)
                .join('\n')}`
          )
          .join('\n\n')}`
      : '',
    optimized.skills?.length ? `HABILIDADES\n${optimized.skills.join(', ')}` : '',
    optimized.education?.length ? `FORMAÇÃO\n${optimized.education.join('\n')}` : '',
  ]
    .filter(Boolean)
    .join('\n\n')
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resumeText, jobText } = body;

    if (!resumeText || typeof resumeText !== 'string' || resumeText.trim().length < 100) {
      return NextResponse.json(
        { error: 'O currículo precisa ter pelo menos 100 caracteres válidos.' },
        { status: 400 }
      );
    }

    if (!jobText || typeof jobText !== 'string' || jobText.trim().length < 50) {
      return NextResponse.json(
        { error: 'A descrição da vaga precisa ter pelo menos 50 caracteres válidos.' },
        { status: 400 }
      );
    }

    const [resumeStructured, jobStructured] = await Promise.all([
      parseResume(resumeText.trim()),
      parseJob(jobText.trim()),
    ]);

    const [analysis, salary] = await Promise.all([
      analyzeCompatibility(resumeStructured, jobStructured, resumeText.trim()),
      estimateSalary(jobStructured),
    ]);

    const [optimized, gupySuggestions] = await Promise.all([
      optimizeResume(resumeStructured, jobStructured, analysis),
      jobStructured.isGupy
        ? generateGupyTexts(resumeStructured, jobStructured)
        : Promise.resolve(null),
    ]);

    const optimizedText =
      optimized.fullText?.trim() || buildFallbackOptimizedText(optimized);

    return NextResponse.json({
      jobStructured,
      resumeStructured,
      analysis,
      optimizedResume: { ...optimized, fullText: optimizedText },
      salary,
      gupySuggestions,
    });
  } catch (error) {
    console.error('Test analysis error:', error);
    const message = error instanceof Error ? error.message : 'Analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
