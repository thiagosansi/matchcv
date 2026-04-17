/**
 * End-to-end pipeline test — runs the full analysis chain against real Groq API.
 *
 * Usage:
 *   pnpm test:pipeline
 *
 * Requires GROQ_API_KEY in .env (loaded via node --env-file=.env).
 */

import { parseResume } from '../lib/services/resume-parser';
import { parseJob } from '../lib/services/job-parser';
import { analyzeCompatibility, optimizeResume } from '../lib/services/analysis';
import { buildResumeFullText } from '../lib/build-resume-text';

// ── Test fixtures ─────────────────────────────────────────────────────────────

const SAMPLE_RESUME = `
João Silva
São Paulo, SP | (11) 98765-4321 | joao.silva@email.com | linkedin.com/in/joaosilva

RESUMO PROFISSIONAL
Desenvolvedor Backend com 6 anos de experiência em Node.js e Python, focado em construção de APIs RESTful escaláveis e microsserviços. Experiência com arquiteturas cloud-native na AWS e com metodologias ágeis.

EXPERIÊNCIA PROFISSIONAL

Desenvolvedor Backend Sênior | TechCorp Brasil | Jan 2022 – Atual
- Liderou a migração de monolito para microsserviços usando Node.js e Docker, reduzindo tempo de deploy em 60%
- Construiu pipelines de CI/CD com GitHub Actions e AWS CodePipeline para 8 equipes de produto
- Otimizou queries críticas no PostgreSQL, reduzindo latência média de 850ms para 120ms
- Mentoreou 3 desenvolvedores juniores em boas práticas de código e code review

Desenvolvedor Backend Pleno | Startup XYZ | Mar 2020 – Dez 2021
- Desenvolveu API de pagamentos integrando Stripe, PagSeguro e Mercado Pago com 99.9% de uptime
- Implementou sistema de filas com RabbitMQ para processamento assíncrono de 50k transações/dia
- Criou módulo de relatórios com exportação para PDF e Excel usando Python e Pandas
- Reduziu tempo de resposta da API em 40% através de cache com Redis

Desenvolvedor Backend Júnior | Agência Digital ABC | Jan 2018 – Fev 2020
- Criou e manteve APIs REST em Node.js/Express para 12 clientes de e-commerce
- Implementou autenticação JWT e OAuth2 em sistemas legados PHP
- Desenvolveu scripts de migração de dados entre bancos MySQL e PostgreSQL
- Colaborou em sprints ágeis com equipes de 5-8 pessoas usando Scrum

HABILIDADES
Node.js, Python, TypeScript, JavaScript, Express, Fastify, NestJS

FERRAMENTAS
PostgreSQL, MySQL, Redis, RabbitMQ, Docker, Kubernetes, AWS (EC2, RDS, S3, Lambda), GitHub Actions, Git

FORMAÇÃO
Bacharelado em Ciência da Computação | Universidade Estadual de São Paulo | 2014 – 2018

IDIOMAS
Inglês – Avançado (C1)
Espanhol – Básico

CERTIFICAÇÕES
AWS Certified Developer – Associate (2023)
Docker Certified Associate (2022)
`;

const SAMPLE_JOB = `
Desenvolvedor Backend Sênior — Node.js
Empresa: FinTech Pagamentos S.A.
Localização: São Paulo, SP (Híbrido)
Senioridade: Sênior

Sobre a vaga:
Buscamos um Desenvolvedor Backend Sênior para integrar o time de plataforma, responsável por construir e escalar nossa infraestrutura de processamento de pagamentos. Você vai trabalhar diretamente com o time de produto para entregar soluções de alto impacto para milhões de usuários.

Responsabilidades:
- Desenvolver e manter APIs RESTful de alto desempenho em Node.js e TypeScript
- Projetar soluções escaláveis usando arquitetura de microsserviços
- Garantir alta disponibilidade e performance (SLA 99.99%)
- Realizar code reviews e contribuir para padrões técnicos do time
- Colaborar com times de produto, dados e segurança

Requisitos obrigatórios:
- 5+ anos de experiência com Node.js em produção
- Sólida experiência com TypeScript
- PostgreSQL ou outro banco relacional
- Experiência com mensageria (RabbitMQ, Kafka ou similar)
- Docker e orquestração de containers
- CI/CD e boas práticas DevOps

Diferenciais:
- Experiência com Kubernetes
- AWS (EC2, RDS, Lambda, SQS)
- Processamento de pagamentos ou fintech
- Redis e cache distribuído

Stack da empresa:
Node.js, TypeScript, PostgreSQL, RabbitMQ, Redis, Docker, Kubernetes, AWS
`;

// ── Assertion helper ──────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

// ── Test runner ───────────────────────────────────────────────────────────────

async function run() {
  console.log('\n═══════════════════════════════════════════════');
  console.log('  MatchCV Pipeline — E2E Test');
  console.log('═══════════════════════════════════════════════\n');

  // ── Step 1: Parse resume ────────────────────────────────────────────────────
  console.log('Step 1: parseResume');
  const resume = await parseResume(SAMPLE_RESUME);

  assert(Boolean(resume.contact?.name), 'contact.name extracted', resume.contact?.name);
  assert(Boolean(resume.contact?.email), 'contact.email extracted', resume.contact?.email);
  assert(Boolean(resume.contact?.phone), 'contact.phone extracted', resume.contact?.phone);
  assert(Boolean(resume.contact?.location), 'contact.location extracted', resume.contact?.location);
  assert(resume.experiences.length === 3, `all 3 experiences parsed (got ${resume.experiences.length})`);
  assert(resume.experiences.every(e => Boolean(e.title)), 'all experiences have title');
  assert(resume.experiences.every(e => Boolean(e.company)), 'all experiences have company');
  assert(resume.experiences.every(e => Boolean(e.period)), 'all experiences have period');
  assert(resume.skills.length > 0, `skills extracted (got ${resume.skills.length})`);
  assert(resume.certifications !== undefined && resume.certifications.length > 0,
    `certifications extracted (got ${resume.certifications?.length ?? 0})`);
  assert(resume.languages.length > 0, `languages extracted (got ${resume.languages.length})`);

  console.log(`  → name: "${resume.contact?.name}", experiences: ${resume.experiences.length}\n`);

  // ── Step 2: Parse job ───────────────────────────────────────────────────────
  console.log('Step 2: parseJob');
  const job = await parseJob(SAMPLE_JOB, 'generic');

  assert(Boolean(job.title), 'job title extracted', job.title);
  assert(job.stack.length > 0, `tech stack extracted (got ${job.stack.length})`);
  assert(job.required.length > 0, `required skills extracted (got ${job.required.length})`);
  assert(job.seniority === 'Sênior', `seniority normalized (got "${job.seniority}")`);
  assert(job.workModel === 'Híbrido', `workModel normalized (got "${job.workModel}")`);

  console.log(`  → title: "${job.title}", seniority: "${job.seniority}"\n`);

  // ── Step 3: Analyze compatibility ──────────────────────────────────────────
  console.log('Step 3: analyzeCompatibility');
  const analysis = await analyzeCompatibility(resume, job, SAMPLE_RESUME);

  assert(analysis.score > 0 && analysis.score <= 100, `score in range (got ${analysis.score})`);
  assert(Boolean(analysis.executiveSummary), 'executiveSummary present');
  assert(analysis.atsKeywords.length > 0, `atsKeywords generated (got ${analysis.atsKeywords.length})`);
  assert(analysis.keywordMatch.length > 0, `keywordMatch computed (got ${analysis.keywordMatch.length})`);
  assert(analysis.keywordMatch.length === analysis.atsKeywords.length, 'keywordMatch count matches atsKeywords');
  assert(analysis.scoreBreakdown.length === 5, `5 scoreBreakdown dimensions (got ${analysis.scoreBreakdown.length})`);

  const foundKeywords = analysis.keywordMatch.filter(k => k.found);
  assert(foundKeywords.length > 0, `at least 1 keyword matched in resume (got ${foundKeywords.length})`);

  console.log(`  → score: ${analysis.score}, keywords: ${analysis.atsKeywords.length}, found in resume: ${foundKeywords.length}\n`);

  // ── Step 4: Optimize resume ─────────────────────────────────────────────────
  console.log('Step 4: optimizeResume');
  const optimized = await optimizeResume(resume, job, analysis, SAMPLE_RESUME);

  // Contact must be preserved exactly
  assert(optimized.contact?.name === resume.contact?.name,
    `contact.name preserved (got "${optimized.contact?.name}")`);
  assert(Boolean(optimized.contact?.email), 'contact.email preserved');
  assert(Boolean(optimized.contact?.phone), 'contact.phone preserved');

  // All experiences must be present
  assert(optimized.experiences.length === resume.experiences.length,
    `all ${resume.experiences.length} experiences in output (got ${optimized.experiences.length})`);

  // Every experience must have bullets
  const experiencesWithBullets = optimized.experiences.filter(e => e.bullets && e.bullets.length > 0);
  assert(experiencesWithBullets.length === optimized.experiences.length,
    `all experiences have bullets (${experiencesWithBullets.length}/${optimized.experiences.length})`);

  // Every experience must have title and company
  assert(optimized.experiences.every(e => Boolean(e.title)), 'all experiences have title');
  assert(optimized.experiences.every(e => Boolean(e.company)), 'all experiences have company');

  // Original companies must be present (AI must not invent companies)
  const originalCompanies = resume.experiences.map(e => e.company.toLowerCase());
  const outputCompanies = optimized.experiences.map(e => e.company.toLowerCase());
  const companiesPreserved = originalCompanies.every(c =>
    outputCompanies.some(oc => oc.includes(c) || c.includes(oc))
  );
  assert(companiesPreserved, 'original company names preserved in output');

  assert(Boolean(optimized.summary?.trim()), 'summary generated');
  assert(optimized.skills.length > 0, `skills present (got ${optimized.skills.length})`);

  // fullText must start with candidate name and include all company names
  assert(Boolean(optimized.fullText?.trim()), 'fullText generated');
  assert(
    Boolean(optimized.fullText?.startsWith(resume.contact?.name ?? '__NOMATCH__')),
    `fullText starts with candidate name (starts with: "${optimized.fullText?.slice(0, 40)}")`
  );

  for (const exp of resume.experiences) {
    const companyInText = optimized.fullText?.toLowerCase().includes(exp.company.toLowerCase());
    assert(companyInText === true, `"${exp.company}" present in fullText`);
  }

  // ── Step 5: buildResumeFullText standalone ─────────────────────────────────
  console.log('\nStep 5: buildResumeFullText (deterministic)');
  const rebuilt = buildResumeFullText(optimized);

  assert(rebuilt.startsWith(resume.contact?.name ?? '__NOMATCH__'), 'rebuilt fullText starts with name');
  assert(rebuilt.includes('RESUMO PROFISSIONAL'), 'rebuilt includes summary section');
  assert(rebuilt.includes('EXPERIÊNCIA PROFISSIONAL'), 'rebuilt includes experience section');
  assert(rebuilt.includes('COMPETÊNCIAS'), 'rebuilt includes skills section');
  assert(rebuilt.includes('IDIOMAS'), 'rebuilt includes languages section');

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════');
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log('═══════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('\n✗ Fatal error:', err instanceof Error ? err.message : err);
  process.exit(1);
});
