export interface ResumeStructured {
  summary: string;
  experiences: Experience[];
  skills: string[];
  tools: string[];
  education: Education[];
  languages: Language[];
  projects: Project[];
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
}

export interface AnalysisResult {
  score: number;
  executiveSummary: string;
  strengths: string[];
  gaps: Gap[];
  sectionSuggestions: SectionSuggestion[];
  atsKeywords: string[];
}

export interface Gap {
  type: 'skill' | 'keyword' | 'experience';
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

export interface OptimizedResume {
  summary: string;
  experiences: OptimizedExperience[];
  skills: string[];
  education: string[];
  highlights: string[];
  fullText?: string;
}

export interface OptimizedExperience {
  title: string;
  company: string;
  period: string;
  bullets: string[];
}

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

export interface AnalyzeApiResponse {
  id: string;
  jobStructured: JobStructured;
  analysis: AnalysisResult;
  optimizedResume: OptimizedResume;
  salary: SalarySuggestion;
  gupySuggestions: GupySuggestion | null;
}
