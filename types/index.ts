// ─── Platform ────────────────────────────────────────────────────────────────

export type Platform =
  | 'gupy'
  | 'inhire'
  | 'greenhouse'
  | 'lever'
  | 'linkedin'
  | 'catho'
  | 'vagas_com'
  | 'infojobs'
  | 'kenoby'
  | 'generic';

// ─── Resume ──────────────────────────────────────────────────────────────────

export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  location: string;
  portfolio?: string;
}

export interface Experience {
  title: string;
  company: string;
  period: string;
  description: string;
  achievements: string[];
}

export interface Education {
  degree: string;
  institution: string;
  period: string;
  field?: string;
}

export interface Language {
  name: string;
  level: string;
}

export interface Project {
  name: string;
  description: string;
  technologies: string[];
}

export interface ResumeStructured {
  contact: ContactInfo;
  summary: string;
  experiences: Experience[];
  skills: string[];
  tools: string[];
  education: Education[];
  languages: Language[];
  projects: Project[];
  certifications?: string[];
}

// ─── Job ─────────────────────────────────────────────────────────────────────

export interface JobStructured {
  title: string;
  company: string;
  responsibilities: string[];
  required: string[];
  differentials: string[];
  stack: string[];
  softSkills: string[];
  seniority: string;
  location: string;
  workModel: string;
  isGupy: boolean;
  platform: Platform;
}

// ─── Analysis ────────────────────────────────────────────────────────────────

export interface Gap {
  type: 'skill' | 'keyword' | 'experience' | 'tool' | 'seniority';
  description: string;
  importance: 'high' | 'medium' | 'low';
}

export interface SectionSuggestion {
  section: string;
  keep: string[];
  adjust: string[];
  include: string[];
  reduce: string[];
}

export interface KeywordMatch {
  keyword: string;
  found: boolean;
  location?: string;
}

export interface ScoreDimension {
  label: string;
  score: number;
  weight: number;
  note: string;
}

export interface AnalysisResult {
  score: number;
  executiveSummary: string;
  strengths: string[];
  gaps: Gap[];
  sectionSuggestions: SectionSuggestion[];
  atsKeywords: string[];
  keywordMatch: KeywordMatch[];
  scoreBreakdown: ScoreDimension[];
}

// ─── Optimized Resume ────────────────────────────────────────────────────────

export interface OptimizedExperience {
  title: string;
  company: string;
  period: string;
  bullets: string[];
}

export interface OptimizedResume {
  contact?: ContactInfo;
  summary: string;
  experiences: OptimizedExperience[];
  skills: string[];
  education: string[];
  highlights: string[];
  languages?: string[];
  certifications?: string[];
  fullText?: string;
}

// ─── Salary & Gupy ───────────────────────────────────────────────────────────

export interface SalarySuggestion {
  min: string;
  mid: string;
  max: string;
  explanation: string;
  factors: string[];
}

export interface GupySuggestion {
  formal: string;
  human: string;
  objective: string;
}

// ─── DB models ───────────────────────────────────────────────────────────────

export interface DbResume {
  id: string;
  session_id: string;
  file_name: string;
  file_path: string;
  raw_text: string;
  structured_json: ResumeStructured;
  created_at: string;
}

export interface DbJobAnalysis {
  id: string;
  session_id: string;
  resume_id: string | null;
  job_source_type: string;
  job_url: string;
  job_raw_text: string;
  job_structured_json: JobStructured;
  match_score: number;
  strengths_json: string[];
  gaps_json: Gap[];
  missing_keywords_json: string[];
  section_recommendations_json: SectionSuggestion[];
  optimized_resume_text: string;
  optimized_resume_json?: OptimizedResume | null;
  executive_summary: string;
  ats_keywords: string[];
  is_gupy: boolean;
  status: string;
  created_at: string;
  gupy_suggestions?: DbGupySuggestion[];
  salary_suggestions?: DbSalarySuggestion[];
}

export interface DbGupySuggestion {
  id: string;
  analysis_id: string;
  formal_text: string;
  human_text: string;
  objective_text: string;
  created_at: string;
}

export interface DbSalarySuggestion {
  id: string;
  analysis_id: string;
  salary_min: number;
  salary_mid: number;
  salary_max: number;
  currency: string;
  explanation: string;
  source_summary: string;
  created_at: string;
}

// ─── API response ─────────────────────────────────────────────────────────────

export interface AnalyzeApiResponse {
  id: string;
  jobStructured: JobStructured;
  analysis: AnalysisResult;
  optimizedResume: OptimizedResume;
  salary: SalarySuggestion;
  gupySuggestions: GupySuggestion | null;
}
