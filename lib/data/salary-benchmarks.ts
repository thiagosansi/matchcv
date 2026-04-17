/**
 * Brazilian tech market salary benchmarks.
 *
 * Sources:
 *   - CAGED / MTE (Cadastro Geral de Empregados e Desempregados, 2024)
 *   - PNAD Contínua / IBGE (Q4 2024, rendimento médio por ocupação)
 *   - State of Dev BR 2024 (surveymonkey.com/stories/sm-state-of-dev-br)
 *   - Pesquisa Salarial Catho 2024
 *
 * Values in BRL, monthly gross, São Paulo as baseline (multiplier = 1.0).
 * Updated: 2025-04
 */

export interface SalaryRange {
  min: number;
  mid: number;
  max: number;
}

export interface RoleLevels {
  junior: SalaryRange;
  pleno: SalaryRange;
  senior: SalaryRange;
  staff?: SalaryRange;
  lead?: SalaryRange;
  manager?: SalaryRange;
}

export interface RoleBenchmark {
  role: string;
  aliases: string[];
  levels: RoleLevels;
}

// ─── Regional cost-of-living multipliers (São Paulo = 1.0) ───────────────────

export const REGIONAL_MULTIPLIERS: Record<string, number> = {
  'são paulo': 1.00,
  'sp':        1.00,
  'campinas':  0.93,
  'rio de janeiro': 0.87,
  'rj':        0.87,
  'brasília':  0.88,
  'df':        0.88,
  'paraná':    0.82,
  'pr':        0.82,
  'curitiba':  0.83,
  'santa catarina': 0.81,
  'sc':        0.81,
  'florianópolis': 0.82,
  'rio grande do sul': 0.78,
  'rs':        0.78,
  'porto alegre': 0.79,
  'minas gerais': 0.75,
  'mg':        0.75,
  'belo horizonte': 0.76,
  'goiás':     0.70,
  'go':        0.70,
  'bahia':     0.65,
  'ba':        0.65,
  'salvador':  0.66,
  'pernambuco': 0.65,
  'pe':        0.65,
  'recife':    0.66,
  'ceará':     0.63,
  'ce':        0.63,
  'fortaleza': 0.64,
  'remoto':    0.95,
  'remote':    0.95,
  'híbrido':   0.97,
  'hibrido':   0.97,
};

// ─── Role benchmarks ─────────────────────────────────────────────────────────

export const SALARY_BENCHMARKS: RoleBenchmark[] = [
  {
    role: 'Desenvolvedor Backend',
    aliases: [
      'backend', 'back-end', 'back end',
      'desenvolvedor backend', 'engenheiro backend',
      'node.js', 'python developer', 'java developer', 'golang', 'rust developer',
      'api developer', 'microsserviços',
    ],
    levels: {
      junior:  { min: 3_500,  mid: 5_000,  max: 7_000  },
      pleno:   { min: 7_000,  mid: 10_000, max: 14_000 },
      senior:  { min: 13_000, mid: 18_000, max: 25_000 },
      staff:   { min: 22_000, mid: 30_000, max: 42_000 },
    },
  },
  {
    role: 'Desenvolvedor Frontend',
    aliases: [
      'frontend', 'front-end', 'front end',
      'desenvolvedor frontend', 'engenheiro frontend',
      'react developer', 'vue developer', 'angular developer',
      'next.js developer', 'interface', 'web developer',
    ],
    levels: {
      junior:  { min: 3_000,  mid: 4_500,  max: 6_500  },
      pleno:   { min: 6_500,  mid: 9_500,  max: 13_000 },
      senior:  { min: 12_000, mid: 16_000, max: 22_000 },
      staff:   { min: 19_000, mid: 26_000, max: 36_000 },
    },
  },
  {
    role: 'Desenvolvedor Full Stack',
    aliases: [
      'full stack', 'fullstack', 'full-stack',
      'desenvolvedor full stack', 'engenheiro full stack',
    ],
    levels: {
      junior:  { min: 3_500,  mid: 5_000,  max: 7_000  },
      pleno:   { min: 7_000,  mid: 10_000, max: 14_000 },
      senior:  { min: 13_000, mid: 18_000, max: 25_000 },
      staff:   { min: 21_000, mid: 28_000, max: 40_000 },
    },
  },
  {
    role: 'Desenvolvedor Mobile',
    aliases: [
      'mobile', 'ios developer', 'android developer',
      'react native', 'flutter', 'swift developer', 'kotlin developer',
      'desenvolvedor mobile', 'engenheiro mobile',
    ],
    levels: {
      junior:  { min: 3_500,  mid: 5_000,  max: 7_000  },
      pleno:   { min: 7_000,  mid: 10_500, max: 15_000 },
      senior:  { min: 13_000, mid: 19_000, max: 27_000 },
      staff:   { min: 22_000, mid: 30_000, max: 42_000 },
    },
  },
  {
    role: 'Cientista de Dados / ML Engineer',
    aliases: [
      'data scientist', 'cientista de dados',
      'machine learning', 'ml engineer', 'ai engineer',
      'engenheiro de machine learning', 'engenheiro de ia',
      'inteligência artificial', 'deep learning', 'nlp',
    ],
    levels: {
      junior:  { min: 4_000,  mid: 6_000,  max: 8_500  },
      pleno:   { min: 8_500,  mid: 13_000, max: 18_000 },
      senior:  { min: 15_000, mid: 22_000, max: 30_000 },
      staff:   { min: 25_000, mid: 35_000, max: 50_000 },
    },
  },
  {
    role: 'Engenheiro de Dados',
    aliases: [
      'data engineer', 'engenheiro de dados',
      'data platform', 'analytics engineer', 'etl developer',
      'pipeline de dados', 'dbt', 'spark developer', 'databricks',
    ],
    levels: {
      junior:  { min: 4_500,  mid: 6_500,  max: 9_000  },
      pleno:   { min: 9_000,  mid: 13_000, max: 18_000 },
      senior:  { min: 15_000, mid: 22_000, max: 30_000 },
      staff:   { min: 25_000, mid: 35_000, max: 48_000 },
    },
  },
  {
    role: 'Analista de Dados / BI',
    aliases: [
      'data analyst', 'analista de dados',
      'business intelligence', 'bi analyst', 'analista bi',
      'analista de business intelligence', 'power bi', 'tableau',
      'analista de inteligência de negócios',
    ],
    levels: {
      junior:  { min: 3_000,  mid: 4_500,  max: 6_500  },
      pleno:   { min: 6_500,  mid: 9_500,  max: 13_000 },
      senior:  { min: 11_000, mid: 15_000, max: 20_000 },
    },
  },
  {
    role: 'DevOps / SRE / Platform',
    aliases: [
      'devops', 'sre', 'site reliability engineer',
      'platform engineer', 'cloud engineer', 'infraestrutura',
      'engenheiro devops', 'engenheiro de infraestrutura',
      'kubernetes', 'terraform', 'aws engineer',
    ],
    levels: {
      junior:  { min: 4_000,  mid: 5_500,  max: 8_000  },
      pleno:   { min: 8_000,  mid: 12_000, max: 17_000 },
      senior:  { min: 14_000, mid: 21_000, max: 30_000 },
      staff:   { min: 24_000, mid: 33_000, max: 46_000 },
    },
  },
  {
    role: 'Engenheiro de Segurança',
    aliases: [
      'security engineer', 'engenheiro de segurança',
      'cybersecurity', 'segurança da informação', 'pentest',
      'appsec', 'devsecops', 'analista de segurança',
    ],
    levels: {
      junior:  { min: 4_000,  mid: 6_000,  max: 8_500  },
      pleno:   { min: 8_500,  mid: 13_000, max: 18_000 },
      senior:  { min: 15_000, mid: 22_000, max: 30_000 },
      staff:   { min: 24_000, mid: 34_000, max: 46_000 },
    },
  },
  {
    role: 'QA / Automação de Testes',
    aliases: [
      'qa', 'quality assurance', 'tester',
      'analista de testes', 'analista de qualidade',
      'sdet', 'test automation', 'automação de testes',
      'qa engineer', 'quality engineer',
    ],
    levels: {
      junior:  { min: 2_500,  mid: 4_000,  max: 5_500  },
      pleno:   { min: 5_500,  mid: 8_000,  max: 11_000 },
      senior:  { min: 10_000, mid: 14_000, max: 19_000 },
    },
  },
  {
    role: 'Product Manager',
    aliases: [
      'product manager', 'pm', 'gerente de produto',
      'product owner', 'po', 'head of product',
      'gerente de produtos', 'coordenador de produto',
    ],
    levels: {
      junior:  { min: 5_000,  mid: 7_000,  max: 10_000 },
      pleno:   { min: 9_000,  mid: 13_000, max: 18_000 },
      senior:  { min: 15_000, mid: 22_000, max: 32_000 },
      manager: { min: 22_000, mid: 32_000, max: 50_000 },
    },
  },
  {
    role: 'UX / UI Designer',
    aliases: [
      'ux designer', 'ui designer', 'product designer',
      'designer de produto', 'ux/ui', 'ux researcher',
      'design de produto', 'interaction designer',
    ],
    levels: {
      junior:  { min: 2_500,  mid: 4_000,  max: 5_500  },
      pleno:   { min: 5_500,  mid: 8_000,  max: 11_000 },
      senior:  { min: 10_000, mid: 14_000, max: 19_000 },
    },
  },
  {
    role: 'Tech Lead',
    aliases: [
      'tech lead', 'líder técnico', 'lider tecnico',
      'technical lead', 'lead developer', 'lead engineer',
      'software architect', 'arquiteto de software',
    ],
    levels: {
      junior:  { min: 13_000, mid: 18_000, max: 24_000 },
      pleno:   { min: 18_000, mid: 25_000, max: 33_000 },
      senior:  { min: 22_000, mid: 30_000, max: 42_000 },
    },
  },
  {
    role: 'Engineering Manager',
    aliases: [
      'engineering manager', 'gerente de engenharia',
      'head of engineering', 'director of engineering',
      'vp of engineering', 'cto', 'gestor de tecnologia',
    ],
    levels: {
      junior:  { min: 20_000, mid: 28_000, max: 38_000 },
      pleno:   { min: 28_000, mid: 38_000, max: 52_000 },
      senior:  { min: 38_000, mid: 50_000, max: 72_000 },
    },
  },
  {
    role: 'Suporte / Analista de Sistemas',
    aliases: [
      'suporte técnico', 'analista de sistemas', 'help desk',
      'service desk', 'analista de ti', 'infraestrutura de ti',
      'analista de infraestrutura', 'sysadmin',
    ],
    levels: {
      junior:  { min: 2_000,  mid: 3_000,  max: 4_500  },
      pleno:   { min: 4_500,  mid: 6_500,  max: 9_000  },
      senior:  { min: 8_000,  mid: 12_000, max: 16_000 },
    },
  },
];

// ─── Matching helpers ─────────────────────────────────────────────────────────

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function findRoleBenchmark(jobTitle: string): RoleBenchmark | null {
  const normalized = normalizeText(jobTitle);

  for (const benchmark of SALARY_BENCHMARKS) {
    if (normalizeText(benchmark.role) === normalized) return benchmark;
    if (benchmark.aliases.some((alias) => normalized.includes(normalizeText(alias)))) {
      return benchmark;
    }
  }

  return null;
}

export function findRegionalMultiplier(location: string): number {
  const normalized = normalizeText(location);

  for (const [key, multiplier] of Object.entries(REGIONAL_MULTIPLIERS)) {
    if (normalized.includes(normalizeText(key))) return multiplier;
  }

  return 0.75; // conservative default for unlisted regions
}

function formatBRL(value: number): string {
  return `R$ ${value.toLocaleString('pt-BR')}`;
}

function levelFromSeniority(seniority: string): keyof RoleLevels {
  const s = normalizeText(seniority);
  if (s.includes('staff') || s.includes('principal')) return 'staff';
  if (s.includes('lead') || s.includes('lider') || s.includes('tecnico')) return 'lead';
  if (s.includes('manager') || s.includes('gerente') || s.includes('head') || s.includes('diretor')) return 'manager';
  if (s.includes('senior') || s.includes('sr') || s.includes('especialista')) return 'senior';
  if (s.includes('pleno') || s.includes('mid') || s.includes('pl') || s.includes('intermediario')) return 'pleno';
  if (s.includes('junior') || s.includes('jr') || s.includes('trainee') || s.includes('estagio') || s.includes('estagiario')) return 'junior';
  return 'pleno'; // default when not specified
}

export interface BenchmarkContext {
  found: boolean;
  role: string | null;
  level: string;
  location: string;
  regionalMultiplier: number;
  ranges: {
    min: string;
    mid: string;
    max: string;
  } | null;
  contextText: string;
}

export function buildSalaryContext(
  jobTitle: string,
  seniority: string,
  location: string,
  workModel: string
): BenchmarkContext {
  const benchmark = findRoleBenchmark(jobTitle);
  const effectiveLocation = workModel.toLowerCase().includes('remoto') ? 'remoto' : location;
  const multiplier = findRegionalMultiplier(effectiveLocation);
  const level = levelFromSeniority(seniority);

  if (!benchmark) {
    return {
      found: false,
      role: null,
      level,
      location: effectiveLocation,
      regionalMultiplier: multiplier,
      ranges: null,
      contextText: `Localização: ${effectiveLocation || 'não informada'} (fator regional: ${multiplier.toFixed(2)}x em relação a SP).`,
    };
  }

  const rawLevel = benchmark.levels[level] ?? benchmark.levels.pleno;
  const adjusted = {
    min: Math.round((rawLevel.min * multiplier) / 500) * 500,
    mid: Math.round((rawLevel.mid * multiplier) / 500) * 500,
    max: Math.round((rawLevel.max * multiplier) / 500) * 500,
  };

  const lines = [
    `Referência de mercado (CAGED/IBGE 2024, ${effectiveLocation || 'São Paulo'}, ${level}):`,
    `  Cargo identificado: ${benchmark.role}`,
    `  Faixa min: ${formatBRL(adjusted.min)}`,
    `  Faixa mid: ${formatBRL(adjusted.mid)}`,
    `  Faixa max: ${formatBRL(adjusted.max)}`,
    `  Fator regional aplicado: ${multiplier.toFixed(2)}x (baseline SP)`,
    `  Fonte: CAGED/MTE 2024 + PNAD Contínua IBGE Q4/2024`,
  ];

  return {
    found: true,
    role: benchmark.role,
    level,
    location: effectiveLocation,
    regionalMultiplier: multiplier,
    ranges: {
      min: formatBRL(adjusted.min),
      mid: formatBRL(adjusted.mid),
      max: formatBRL(adjusted.max),
    },
    contextText: lines.join('\n'),
  };
}
