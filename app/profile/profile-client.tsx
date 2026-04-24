'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Briefcase,
  GraduationCap,
  Zap,
  User,
  CheckCircle,
  Loader2,
  Upload,
} from 'lucide-react';
import type { WorkExperience, EducationEntry, ProfileSkill, SkillCategory } from '@/types';
import type { ProfileImportPreview } from '@/lib/services/profile-import';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExperienceForm {
  company: string;
  title: string;
  location: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  description: string;
}

interface EducationForm {
  institution: string;
  degree: string;
  field: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  description: string;
}

const EMPTY_EXP_FORM: ExperienceForm = {
  company: '',
  title: '',
  location: '',
  start_date: '',
  end_date: '',
  is_current: false,
  description: '',
};

const EMPTY_EDU_FORM: EducationForm = {
  institution: '',
  degree: '',
  field: '',
  start_date: '',
  end_date: '',
  is_current: false,
  description: '',
};

const SKILL_CATEGORIES: { value: SkillCategory; label: string }[] = [
  { value: 'technical', label: 'Técnicas' },
  { value: 'tool',      label: 'Ferramentas' },
  { value: 'language',  label: 'Idiomas' },
  { value: 'certification', label: 'Certificações' },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatDateDisplay(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const supabase = getSupabaseBrowserClient();

  // Basic info state
  const [fullName, setFullName] = useState('');
  const [objectives, setObjectives] = useState<string[]>([]);
  const [customObjective, setCustomObjective] = useState('');
  const [baseSummary, setBaseSummary] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [savingBasic, setSavingBasic] = useState(false);
  const [basicSuccess, setBasicSuccess] = useState('');
  const [basicError, setBasicError] = useState('');

  // Experiences state
  const [experiences, setExperiences] = useState<WorkExperience[]>([]);
  const [expLoading, setExpLoading] = useState(true);
  const [expForm, setExpForm] = useState<ExperienceForm>(EMPTY_EXP_FORM);
  const [expEditId, setExpEditId] = useState<string | null>(null);
  const [showExpForm, setShowExpForm] = useState(false);
  const [expSaving, setExpSaving] = useState(false);
  const [expError, setExpError] = useState('');

  // Education state
  const [education, setEducation] = useState<EducationEntry[]>([]);
  const [eduLoading, setEduLoading] = useState(true);
  const [eduForm, setEduForm] = useState<EducationForm>(EMPTY_EDU_FORM);
  const [eduEditId, setEduEditId] = useState<string | null>(null);
  const [showEduForm, setShowEduForm] = useState(false);
  const [eduSaving, setEduSaving] = useState(false);
  const [eduError, setEduError] = useState('');

  // Skills state
  const [skills, setSkills] = useState<ProfileSkill[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(true);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState<SkillCategory>('technical');
  const [skillSaving, setSkillSaving] = useState(false);

  // Import state
  const [importText, setImportText] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importPreview, setImportPreview] = useState<ProfileImportPreview | null>(null);
  const [importError, setImportError] = useState('');
  const [importSaving, setImportSaving] = useState(false);
  const [importSuccess, setImportSuccess] = useState('');

  // ─── Bootstrap ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '');
      setObjectives(profile.professional_objectives ?? []);
      setBaseSummary(profile.base_summary ?? '');
    }
  }, [profile]);

  const loadContactInfo = useCallback(async () => {
    if (!user) return;
    const res = await fetch('/api/profile/contact');
    if (res.ok) {
      const { contact } = await res.json();
      setLinkedin(contact?.linkedin ?? '');
      setPhone(contact?.phone ?? '');
      setLocation(contact?.location ?? '');
    }
  }, [user]);

  const loadExperiences = useCallback(async () => {
    if (!user) return;
    setExpLoading(true);
    const res = await fetch('/api/profile/experiences');
    if (res.ok) {
      const { experiences: data } = await res.json();
      setExperiences(data ?? []);
    }
    setExpLoading(false);
  }, [user]);

  const loadEducation = useCallback(async () => {
    if (!user) return;
    setEduLoading(true);
    const res = await fetch('/api/profile/education');
    if (res.ok) {
      const { education: data } = await res.json();
      setEducation(data ?? []);
    }
    setEduLoading(false);
  }, [user]);

  const loadSkills = useCallback(async () => {
    if (!user) return;
    setSkillsLoading(true);
    const res = await fetch('/api/profile/skills');
    if (res.ok) {
      const { skills: data } = await res.json();
      setSkills(data ?? []);
    }
    setSkillsLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadContactInfo();
    loadExperiences();
    loadEducation();
    loadSkills();
  }, [user, loadContactInfo, loadExperiences, loadEducation, loadSkills]);

  // ─── Basic Info ────────────────────────────────────────────────────────────

  const handleSaveBasic = async () => {
    if (!user) return;
    setSavingBasic(true);
    setBasicError('');
    setBasicSuccess('');

    const [profileRes, contactRes] = await Promise.all([
      supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          professional_objectives: objectives,
          base_summary: baseSummary.trim(),
        })
        .eq('id', user.id),
      fetch('/api/profile/contact', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkedin, phone, location }),
      }),
    ]);

    setSavingBasic(false);

    if (profileRes.error || !contactRes.ok) {
      setBasicError('Erro ao salvar. Tente novamente.');
      return;
    }

    await refreshProfile();
    setBasicSuccess('Salvo com sucesso.');
    setTimeout(() => setBasicSuccess(''), 3000);
  };

  // ─── Experiences ───────────────────────────────────────────────────────────

  const openAddExp = () => {
    setExpEditId(null);
    setExpForm(EMPTY_EXP_FORM);
    setExpError('');
    setShowExpForm(true);
  };

  const openEditExp = (exp: WorkExperience) => {
    setExpEditId(exp.id);
    setExpForm({
      company: exp.company,
      title: exp.title,
      location: exp.location,
      start_date: exp.start_date ?? '',
      end_date: exp.end_date ?? '',
      is_current: exp.is_current,
      description: exp.description,
    });
    setExpError('');
    setShowExpForm(true);
  };

  const cancelExpForm = () => {
    setShowExpForm(false);
    setExpEditId(null);
    setExpForm(EMPTY_EXP_FORM);
    setExpError('');
  };

  const handleSaveExp = async () => {
    if (!expForm.company.trim()) { setExpError('Empresa é obrigatória.'); return; }
    if (!expForm.title.trim()) { setExpError('Cargo é obrigatório.'); return; }

    setExpSaving(true);
    setExpError('');

    const payload = {
      ...expForm,
      start_date: expForm.start_date || null,
      end_date: expForm.is_current ? null : (expForm.end_date || null),
    };

    const url = expEditId
      ? `/api/profile/experiences/${expEditId}`
      : '/api/profile/experiences';
    const method = expEditId ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setExpSaving(false);

    if (!res.ok) {
      const { error } = await res.json();
      setExpError(error ?? 'Erro ao salvar.');
      return;
    }

    cancelExpForm();
    await loadExperiences();
  };

  const handleDeleteExp = async (id: string) => {
    if (!confirm('Remover esta experiência?')) return;
    await fetch(`/api/profile/experiences/${id}`, { method: 'DELETE' });
    setExperiences((prev) => prev.filter((e) => e.id !== id));
  };

  // ─── Education ─────────────────────────────────────────────────────────────

  const openAddEdu = () => {
    setEduEditId(null);
    setEduForm(EMPTY_EDU_FORM);
    setEduError('');
    setShowEduForm(true);
  };

  const openEditEdu = (edu: EducationEntry) => {
    setEduEditId(edu.id);
    setEduForm({
      institution: edu.institution,
      degree: edu.degree,
      field: edu.field,
      start_date: edu.start_date ?? '',
      end_date: edu.end_date ?? '',
      is_current: edu.is_current,
      description: edu.description,
    });
    setEduError('');
    setShowEduForm(true);
  };

  const cancelEduForm = () => {
    setShowEduForm(false);
    setEduEditId(null);
    setEduForm(EMPTY_EDU_FORM);
    setEduError('');
  };

  const handleSaveEdu = async () => {
    if (!eduForm.institution.trim()) { setEduError('Instituição é obrigatória.'); return; }

    setEduSaving(true);
    setEduError('');

    const payload = {
      ...eduForm,
      start_date: eduForm.start_date || null,
      end_date: eduForm.is_current ? null : (eduForm.end_date || null),
    };

    const url = eduEditId
      ? `/api/profile/education/${eduEditId}`
      : '/api/profile/education';
    const method = eduEditId ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setEduSaving(false);

    if (!res.ok) {
      const { error } = await res.json();
      setEduError(error ?? 'Erro ao salvar.');
      return;
    }

    cancelEduForm();
    await loadEducation();
  };

  const handleDeleteEdu = async (id: string) => {
    if (!confirm('Remover esta formação?')) return;
    await fetch(`/api/profile/education/${id}`, { method: 'DELETE' });
    setEducation((prev) => prev.filter((e) => e.id !== id));
  };

  // ─── Skills ────────────────────────────────────────────────────────────────

  const handleAddSkill = async () => {
    const name = newSkillName.trim();
    if (!name) return;

    setSkillSaving(true);
    const res = await fetch('/api/profile/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, category: newSkillCategory }),
    });

    if (res.ok) {
      const { skill } = await res.json();
      setSkills((prev) => [...prev, skill]);
      setNewSkillName('');
    }
    setSkillSaving(false);
  };

  const handleDeleteSkill = async (id: string) => {
    await fetch('/api/profile/skills', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setSkills((prev) => prev.filter((s) => s.id !== id));
  };

  // ─── Import handlers ──────────────────────────────────────────────────────

  const handleExtractImport = async () => {
    if (!importText.trim()) return;
    setImportLoading(true);
    setImportError('');
    setImportPreview(null);
    try {
      const res = await fetch('/api/profile/import-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: importText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha na extração');
      setImportPreview(data as ProfileImportPreview);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Falha ao extrair dados');
    } finally {
      setImportLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!importPreview || !user) return;
    setImportSaving(true);
    setImportError('');

    const postJson = async (url: string, body: unknown) => {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`${url}: ${err.error ?? res.status}`);
      }
    };

    try {
      // Save basic info (name, summary, contact) in parallel
      const newName = importPreview.contact.name || fullName;
      const newSummary = importPreview.summary || baseSummary;
      const newLinkedin = importPreview.contact.linkedin || linkedin;
      const newPhone = importPreview.contact.phone || phone;
      const newLocation = importPreview.contact.location || location;

      const [profileRes, contactRes] = await Promise.all([
        supabase
          .from('profiles')
          .update({ full_name: newName, base_summary: newSummary })
          .eq('id', user.id),
        fetch('/api/profile/contact', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ linkedin: newLinkedin, phone: newPhone, location: newLocation }),
        }),
      ]);

      if (profileRes.error) throw new Error(`Perfil: ${profileRes.error.message}`);
      if (!contactRes.ok) {
        const err = await contactRes.json().catch(() => ({}));
        throw new Error(`Contato: ${err.error ?? contactRes.status}`);
      }

      // Update form states to reflect imported data
      if (newName) setFullName(newName);
      if (newSummary) setBaseSummary(newSummary);
      if (newLinkedin) setLinkedin(newLinkedin);
      if (newPhone) setPhone(newPhone);
      if (newLocation) setLocation(newLocation);

      // Save experiences sequentially to preserve order
      for (const exp of importPreview.experiences) {
        await postJson('/api/profile/experiences', exp);
      }

      // Save education
      for (const edu of importPreview.education) {
        await postJson('/api/profile/education', edu);
      }

      // Save skills
      for (const skill of importPreview.skills) {
        await postJson('/api/profile/skills', skill);
      }

      // Refresh all sections
      await Promise.all([loadExperiences(), loadEducation(), loadSkills(), refreshProfile()]);

      setImportPreview(null);
      setImportText('');
      setImportSuccess('Perfil importado com sucesso! Revise as informações preenchidas.');
      setTimeout(() => setImportSuccess(''), 6000);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Falha ao salvar dados importados');
    } finally {
      setImportSaving(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  if (authLoading) return null;
  if (!user) return null;

  const skillsByCategory = (cat: SkillCategory) =>
    skills.filter((s) => s.category === cat);

  const totalSections = [
    experiences.length > 0,
    education.length > 0,
    skills.length > 0,
    Boolean(fullName || objectives.length > 0),
  ].filter(Boolean).length;

  return (
    <>
      <AppHeader />
      <main className="pt-[60px] max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Meu perfil</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Dados estruturados usados para gerar currículos ATS-otimizados.
            </p>
          </div>
          {totalSections >= 3 && (
            <Badge variant="secondary" className="flex items-center gap-1 mt-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              Perfil completo
            </Badge>
          )}
        </div>

        <Accordion type="multiple" defaultValue={['basic']} className="space-y-3">

          {/* ── Informações Básicas ─────────────────────────────────────── */}
          <AccordionItem value="basic" className="border rounded-lg px-1">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <User className="w-4 h-4 text-primary" />
                Informações básicas
                {(fullName || objectives.length > 0) && (
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 ml-1" />
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={user.email ?? ''} disabled className="bg-muted" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">Nome completo</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Seu nome completo"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Objetivos profissionais</Label>
                <p className="text-xs text-muted-foreground -mt-1">
                  Selecione um ou mais cargos que está buscando. Cada análise será otimizada para o cargo selecionado.
                </p>

                {/* Suggestion chips — toggle add/remove */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Engenheiro(a) de Software Sênior',
                    'Product Manager',
                    'Product Owner',
                    'Analista de Produto',
                    'Tech Lead',
                    'Engenheiro(a) de Dados',
                  ].map((suggestion) => {
                    const selected = objectives.includes(suggestion);
                    return (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() =>
                          setObjectives((prev) =>
                            selected
                              ? prev.filter((o) => o !== suggestion)
                              : [...prev, suggestion]
                          )
                        }
                        className={
                          selected
                            ? 'text-xs px-2.5 py-1 rounded-full border font-medium transition-colors bg-primary text-primary-foreground border-primary'
                            : 'text-xs px-2.5 py-1 rounded-full border border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors'
                        }
                      >
                        {selected ? '✓ ' : '+ '}{suggestion}
                      </button>
                    );
                  })}
                </div>

                {/* Custom objective input */}
                <div className="flex gap-2">
                  <Input
                    value={customObjective}
                    onChange={(e) => setCustomObjective(e.target.value)}
                    placeholder="Outro cargo ou objetivo..."
                    className="h-8 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && customObjective.trim()) {
                        e.preventDefault();
                        if (!objectives.includes(customObjective.trim())) {
                          setObjectives((prev) => [...prev, customObjective.trim()]);
                        }
                        setCustomObjective('');
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 px-3"
                    disabled={!customObjective.trim() || objectives.includes(customObjective.trim())}
                    onClick={() => {
                      if (customObjective.trim() && !objectives.includes(customObjective.trim())) {
                        setObjectives((prev) => [...prev, customObjective.trim()]);
                        setCustomObjective('');
                      }
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {/* Selected objectives */}
                {objectives.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {objectives.map((obj) => (
                      <Badge key={obj} variant="secondary" className="gap-1 pr-1.5 font-normal">
                        {obj}
                        <button
                          type="button"
                          onClick={() => setObjectives((prev) => prev.filter((o) => o !== obj))}
                          className="hover:text-destructive transition-colors"
                          aria-label={`Remover ${obj}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="summary">Resumo base</Label>
                <Textarea
                  id="summary"
                  value={baseSummary}
                  onChange={(e) => setBaseSummary(e.target.value)}
                  placeholder="Um parágrafo sobre sua experiência e diferenciais."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    placeholder="linkedin.com/in/..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="location">Localização</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="São Paulo, SP"
                  />
                </div>
              </div>

              {basicError && (
                <Alert variant="destructive">
                  <AlertDescription>{basicError}</AlertDescription>
                </Alert>
              )}
              {basicSuccess && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{basicSuccess}</AlertDescription>
                </Alert>
              )}

              <Button onClick={handleSaveBasic} disabled={savingBasic} size="sm">
                {savingBasic ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Salvando...</> : 'Salvar informações'}
              </Button>
            </AccordionContent>
          </AccordionItem>

          {/* ── Experiências Profissionais ─────────────────────────────── */}
          <AccordionItem value="experiences" className="border rounded-lg px-1">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Briefcase className="w-4 h-4 text-primary" />
                Experiências profissionais
                <Badge variant="outline" className="ml-1 text-xs font-normal">
                  {experiences.length}
                </Badge>
                {experiences.length > 0 && (
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-3">
              {expLoading ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : (
                <>
                  {experiences.length === 0 && !showExpForm && (
                    <p className="text-sm text-muted-foreground py-2">
                      Nenhuma experiência cadastrada. Adicione sua trajetória profissional.
                    </p>
                  )}

                  {experiences.map((exp) => (
                    <div
                      key={exp.id}
                      className="border rounded-lg p-3 bg-muted/30 flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{exp.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {exp.company}
                          {exp.location ? ` · ${exp.location}` : ''}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDateDisplay(exp.start_date)}
                          {' – '}
                          {exp.is_current ? 'atual' : formatDateDisplay(exp.end_date)}
                        </p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEditExp(exp)}
                          aria-label="Editar"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteExp(exp.id)}
                          aria-label="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {showExpForm && (
                    <div className="border rounded-lg p-4 space-y-3 bg-background">
                      <p className="text-sm font-medium">
                        {expEditId ? 'Editar experiência' : 'Nova experiência'}
                      </p>

                      {expError && (
                        <p className="text-xs text-destructive">{expError}</p>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Empresa *</Label>
                          <Input
                            value={expForm.company}
                            onChange={(e) => setExpForm((f) => ({ ...f, company: e.target.value }))}
                            placeholder="Nome da empresa"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Cargo *</Label>
                          <Input
                            value={expForm.title}
                            onChange={(e) => setExpForm((f) => ({ ...f, title: e.target.value }))}
                            placeholder="Seu cargo"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Localização</Label>
                          <Input
                            value={expForm.location}
                            onChange={(e) => setExpForm((f) => ({ ...f, location: e.target.value }))}
                            placeholder="São Paulo, SP"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Data de início</Label>
                          <Input
                            type="date"
                            value={expForm.start_date}
                            onChange={(e) => setExpForm((f) => ({ ...f, start_date: e.target.value }))}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={expForm.is_current}
                            onChange={(e) => setExpForm((f) => ({ ...f, is_current: e.target.checked }))}
                            className="rounded"
                          />
                          Trabalho atual
                        </label>
                        {!expForm.is_current && (
                          <div className="flex items-center gap-2 flex-1">
                            <Label className="text-xs whitespace-nowrap">Data de saída</Label>
                            <Input
                              type="date"
                              value={expForm.end_date}
                              onChange={(e) => setExpForm((f) => ({ ...f, end_date: e.target.value }))}
                              className="h-8 text-sm"
                            />
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Descrição e realizações</Label>
                        <Textarea
                          value={expForm.description}
                          onChange={(e) => setExpForm((f) => ({ ...f, description: e.target.value }))}
                          placeholder="Descreva suas responsabilidades e conquistas. Use verbos de ação e inclua métricas quando possível.&#10;- Liderou migração de sistema legado, reduzindo latência em 40%&#10;- Implementou CI/CD com GitHub Actions"
                          rows={4}
                          className="text-sm"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveExp} disabled={expSaving}>
                          {expSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Salvar'}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={cancelExpForm}>
                          <X className="w-3.5 h-3.5 mr-1" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}

                  {!showExpForm && (
                    <Button variant="outline" size="sm" onClick={openAddExp} className="gap-1.5">
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar experiência
                    </Button>
                  )}
                </>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* ── Formação Acadêmica ─────────────────────────────────────── */}
          <AccordionItem value="education" className="border rounded-lg px-1">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <GraduationCap className="w-4 h-4 text-primary" />
                Formação acadêmica
                <Badge variant="outline" className="ml-1 text-xs font-normal">
                  {education.length}
                </Badge>
                {education.length > 0 && (
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-3">
              {eduLoading ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : (
                <>
                  {education.length === 0 && !showEduForm && (
                    <p className="text-sm text-muted-foreground py-2">
                      Nenhuma formação cadastrada. Adicione sua trajetória acadêmica.
                    </p>
                  )}

                  {education.map((edu) => (
                    <div
                      key={edu.id}
                      className="border rounded-lg p-3 bg-muted/30 flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {[edu.degree, edu.field].filter(Boolean).join(' em ') || edu.institution}
                        </p>
                        <p className="text-xs text-muted-foreground">{edu.institution}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDateDisplay(edu.start_date)}
                          {' – '}
                          {edu.is_current ? 'em andamento' : formatDateDisplay(edu.end_date)}
                        </p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEditEdu(edu)}
                          aria-label="Editar"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteEdu(edu.id)}
                          aria-label="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {showEduForm && (
                    <div className="border rounded-lg p-4 space-y-3 bg-background">
                      <p className="text-sm font-medium">
                        {eduEditId ? 'Editar formação' : 'Nova formação'}
                      </p>

                      {eduError && (
                        <p className="text-xs text-destructive">{eduError}</p>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1 sm:col-span-2">
                          <Label className="text-xs">Instituição *</Label>
                          <Input
                            value={eduForm.institution}
                            onChange={(e) => setEduForm((f) => ({ ...f, institution: e.target.value }))}
                            placeholder="Universidade / Faculdade / Instituição"
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Grau</Label>
                          <Input
                            value={eduForm.degree}
                            onChange={(e) => setEduForm((f) => ({ ...f, degree: e.target.value }))}
                            placeholder="Bacharel, Técnico, MBA..."
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Curso</Label>
                          <Input
                            value={eduForm.field}
                            onChange={(e) => setEduForm((f) => ({ ...f, field: e.target.value }))}
                            placeholder="Ciência da Computação..."
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Início</Label>
                          <Input
                            type="date"
                            value={eduForm.start_date}
                            onChange={(e) => setEduForm((f) => ({ ...f, start_date: e.target.value }))}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={eduForm.is_current}
                            onChange={(e) => setEduForm((f) => ({ ...f, is_current: e.target.checked }))}
                            className="rounded"
                          />
                          Em andamento
                        </label>
                        {!eduForm.is_current && (
                          <div className="flex items-center gap-2 flex-1">
                            <Label className="text-xs whitespace-nowrap">Conclusão</Label>
                            <Input
                              type="date"
                              value={eduForm.end_date}
                              onChange={(e) => setEduForm((f) => ({ ...f, end_date: e.target.value }))}
                              className="h-8 text-sm"
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveEdu} disabled={eduSaving}>
                          {eduSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Salvar'}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={cancelEduForm}>
                          <X className="w-3.5 h-3.5 mr-1" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}

                  {!showEduForm && (
                    <Button variant="outline" size="sm" onClick={openAddEdu} className="gap-1.5">
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar formação
                    </Button>
                  )}
                </>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* ── Skills ─────────────────────────────────────────────────── */}
          <AccordionItem value="skills" className="border rounded-lg px-1">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Zap className="w-4 h-4 text-primary" />
                Skills e habilidades
                <Badge variant="outline" className="ml-1 text-xs font-normal">
                  {skills.length}
                </Badge>
                {skills.length >= 5 && (
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-4">
              {skillsLoading ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : (
                <>
                  <Tabs
                    value={newSkillCategory}
                    onValueChange={(v) => setNewSkillCategory(v as SkillCategory)}
                  >
                    <TabsList className="h-8 gap-1">
                      {SKILL_CATEGORIES.map((cat) => (
                        <TabsTrigger key={cat.value} value={cat.value} className="text-xs h-7 px-3">
                          {cat.label}
                          {skillsByCategory(cat.value).length > 0 && (
                            <span className="ml-1.5 text-[10px] text-muted-foreground">
                              {skillsByCategory(cat.value).length}
                            </span>
                          )}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {SKILL_CATEGORIES.map((cat) => (
                      <TabsContent key={cat.value} value={cat.value} className="mt-3 space-y-3">
                        <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                          {skillsByCategory(cat.value).length === 0 ? (
                            <p className="text-xs text-muted-foreground py-1">
                              Nenhuma {cat.label.toLowerCase()} cadastrada.
                            </p>
                          ) : (
                            skillsByCategory(cat.value).map((skill) => (
                              <Badge
                                key={skill.id}
                                variant="secondary"
                                className="gap-1 pr-1 text-xs"
                              >
                                {skill.name}
                                <button
                                  onClick={() => handleDeleteSkill(skill.id)}
                                  className="hover:text-destructive transition-colors"
                                  aria-label={`Remover ${skill.name}`}
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                            ))
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Input
                            value={newSkillCategory === cat.value ? newSkillName : ''}
                            onChange={(e) => {
                              setNewSkillCategory(cat.value);
                              setNewSkillName(e.target.value);
                            }}
                            placeholder={
                              cat.value === 'technical' ? 'Ex: Python, TypeScript, React...' :
                              cat.value === 'tool' ? 'Ex: Docker, Figma, Jira...' :
                              cat.value === 'language' ? 'Ex: Inglês, Espanhol...' :
                              'Ex: AWS Solutions Architect...'
                            }
                            className="h-8 text-sm"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddSkill();
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            onClick={handleAddSkill}
                            disabled={skillSaving || !newSkillName.trim()}
                            className="h-8 px-3"
                          >
                            {skillSaving ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Plus className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* ── Importar do PDF ──────────────────────────────────────── */}
          <AccordionItem value="import" className="border rounded-lg px-1">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Upload className="w-4 h-4 text-primary" />
                Importar do PDF / currículo existente
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-4">
              <p className="text-xs text-muted-foreground">
                Cole o texto do seu currículo abaixo. A IA vai extrair experiências,
                formação e skills para pré-preencher seu perfil. Você revisa antes de confirmar.
              </p>

              {importSuccess && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 text-sm">{importSuccess}</AlertDescription>
                </Alert>
              )}

              {!importPreview && (
                <div className="space-y-3">
                  <Textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder="Cole aqui o texto completo do seu currículo..."
                    rows={8}
                    className="text-sm font-mono resize-y"
                  />
                  {importError && (
                    <p className="text-xs text-destructive">{importError}</p>
                  )}
                  <Button
                    size="sm"
                    onClick={handleExtractImport}
                    disabled={importLoading || importText.trim().length < 50}
                    className="gap-1.5"
                  >
                    {importLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    Extrair dados
                  </Button>
                </div>
              )}

              {importPreview && (
                <div className="space-y-4">
                  {/* Contact info extracted */}
                  {importPreview.contact.name && (
                    <div className="rounded-lg border bg-blue-50 border-blue-200 p-3 text-xs space-y-0.5">
                      <p className="font-semibold text-blue-800 mb-1">Informações básicas extraídas</p>
                      {importPreview.contact.name && <p className="text-blue-700">Nome: {importPreview.contact.name}</p>}
                      {importPreview.summary && <p className="text-blue-700 line-clamp-2">Resumo: {importPreview.summary}</p>}
                      {importPreview.contact.linkedin && <p className="text-blue-700">LinkedIn: {importPreview.contact.linkedin}</p>}
                      {importPreview.contact.location && <p className="text-blue-700">Localização: {importPreview.contact.location}</p>}
                    </div>
                  )}

                  <div className="rounded-lg border bg-muted/30 p-3 space-y-3 text-sm">
                    <p className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                      Dados estruturados extraídos
                    </p>

                    {/* Experiences — always show count */}
                    <div>
                      <p className={`font-medium mb-1 flex items-center gap-1 ${importPreview.experiences.length === 0 ? 'text-amber-600' : ''}`}>
                        <Briefcase className="w-3.5 h-3.5" />
                        {importPreview.experiences.length} experiência(s) encontrada(s)
                      </p>
                      {importPreview.experiences.length > 0 ? (
                        <ul className="space-y-1 pl-5 text-muted-foreground text-xs list-disc">
                          {importPreview.experiences.map((exp, i) => (
                            <li key={i}>{exp.title} — {exp.company}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-amber-600 pl-5">Nenhuma experiência identificada no texto.</p>
                      )}
                    </div>

                    {/* Education — always show count */}
                    <div>
                      <p className={`font-medium mb-1 flex items-center gap-1 ${importPreview.education.length === 0 ? 'text-amber-600' : ''}`}>
                        <GraduationCap className="w-3.5 h-3.5" />
                        {importPreview.education.length} formação(ões) encontrada(s)
                      </p>
                      {importPreview.education.length > 0 && (
                        <ul className="space-y-1 pl-5 text-muted-foreground text-xs list-disc">
                          {importPreview.education.map((edu, i) => (
                            <li key={i}>{edu.degree} — {edu.institution}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Skills — always show count */}
                    <div>
                      <p className={`font-medium mb-1 flex items-center gap-1 ${importPreview.skills.length === 0 ? 'text-amber-600' : ''}`}>
                        <Zap className="w-3.5 h-3.5" />
                        {importPreview.skills.length} skill(s) encontrada(s)
                      </p>
                      {importPreview.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {importPreview.skills.slice(0, 12).map((skill, i) => (
                            <Badge key={i} variant="outline" className="text-xs px-2 py-0.5 font-normal">
                              {skill.name}
                            </Badge>
                          ))}
                          {importPreview.skills.length > 12 && (
                            <Badge variant="outline" className="text-xs px-2 py-0.5 font-normal text-muted-foreground">
                              +{importPreview.skills.length - 12}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {importPreview.experiences.length === 0 && importPreview.education.length === 0 && importPreview.skills.length === 0 && (
                      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                        A IA não conseguiu identificar dados estruturados. Verifique se o texto colado é um currículo completo e tente novamente.
                      </p>
                    )}
                  </div>

                  {importError && (
                    <p className="text-xs text-destructive">{importError}</p>
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleConfirmImport}
                      disabled={importSaving}
                      className="gap-1.5"
                    >
                      {importSaving ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle className="w-3.5 h-3.5" />
                      )}
                      Confirmar e salvar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { setImportPreview(null); setImportError(''); }}
                      disabled={importSaving}
                    >
                      <X className="w-3.5 h-3.5 mr-1" />
                      Tentar novamente
                    </Button>
                  </div>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

        </Accordion>
      </main>
    </>
  );
}
