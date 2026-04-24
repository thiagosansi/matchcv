'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Upload,
  FileText,
  Link,
  CircleAlert as AlertCircle,
  Loader as Loader2,
  ArrowRight,
  CircleCheck as CheckCircle,
  X,
  Eye,
  ChevronDown,
  ChevronUp,
  Star,
  User,
} from 'lucide-react';
import { detectPlatform } from '@/lib/platforms/detect';
import { PLATFORM_DISPLAY_NAMES } from '@/lib/platforms/errors';

type ResumeMode = 'profile' | 'pdf' | 'text';
type PdfStatus = 'idle' | 'uploading' | 'success' | 'error';

interface SavedResume {
  id: string;
  file_name: string;
  raw_text: string;
  created_at: string;
  is_primary: boolean;
}

export default function AnalyzePage() {
  const router = useRouter();
  const { user, loading: authLoading, profile } = useAuth();

  const [resumeMode, setResumeMode] = useState<ResumeMode>('profile');
  const [resumeText, setResumeText] = useState('');
  const [pdfStatus, setPdfStatus] = useState<PdfStatus>('idle');
  const [pdfFileName, setPdfFileName] = useState('');
  const [pdfPreview, setPdfPreview] = useState('');
  const [pdfCharCount, setPdfCharCount] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const [savedPrimaryResume, setSavedPrimaryResume] = useState<SavedResume | null>(null);
  const [loadingPrimaryResume, setLoadingPrimaryResume] = useState(true);
  const [profileExpCount, setProfileExpCount] = useState(0);
  const [profileSkillCount, setProfileSkillCount] = useState(0);

  const [jobText, setJobText] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [jobTab, setJobTab] = useState('text');
  const [isGupyJob, setIsGupyJob] = useState(false);
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState('');
  const [urlInstruction, setUrlInstruction] = useState('');
  const [fetchedPlatform, setFetchedPlatform] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps = [
    'Lendo seu currículo...',
    'Analisando a vaga...',
    'Calculando compatibilidade...',
    'Gerando currículo aderente...',
    'Finalizando...',
  ];

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!authLoading && profile && profile.status !== 'active') {
      setError('Sua conta está inativa ou suspensa. Entre em contato com o suporte.');
    }
  }, [authLoading, profile]);

  useEffect(() => {
    if (!user) return;

    setLoadingPrimaryResume(true);

    // Load profile structure count and saved primary resume in parallel
    Promise.all([
      fetch('/api/profile/experiences').then((r) => r.json()).catch(() => ({ experiences: [] })),
      fetch('/api/profile/skills').then((r) => r.json()).catch(() => ({ skills: [] })),
      fetch(`/api/resumes?userId=${encodeURIComponent(user.id)}`).then((r) => r.json()).catch(() => ({})),
    ]).then(([expData, skillData, resumeData]) => {
      const expCount = expData.experiences?.length ?? 0;
      const skillCount = skillData.skills?.length ?? 0;
      setProfileExpCount(expCount);
      setProfileSkillCount(skillCount);

      // Auto-select profile mode if user has structured data
      if (expCount > 0 || skillCount > 0) {
        setResumeMode('profile');
      } else {
        // Fall back to PDF mode and load primary resume
        setResumeMode('pdf');
        const primary = resumeData.primaryResume ?? null;
        setSavedPrimaryResume(primary);
        if (primary?.raw_text) {
          setResumeText(primary.raw_text);
          setPdfFileName(primary.file_name || 'Currículo principal');
          setPdfPreview(primary.raw_text.slice(0, 600));
          setPdfCharCount(primary.raw_text.length);
          setPdfStatus('success');
        }
      }
    }).finally(() => setLoadingPrimaryResume(false));
  }, [user]);

  const handlePdfUpload = async (file: File) => {
    if (!user) {
      setPdfError('Você precisa estar autenticado para enviar currículo.');
      return;
    }

    if (file.type !== 'application/pdf') {
      setPdfError('Apenas arquivos PDF são aceitos neste modo.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setPdfError('Arquivo muito grande (máx. 10MB).');
      return;
    }

    setPdfStatus('uploading');
    setPdfError('');
    setPdfFileName(file.name);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', user.id);

    try {
      const res = await fetch('/api/upload-resume', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Falha ao extrair texto do PDF');
      }

      setResumeText(data.rawText);
      setPdfPreview(data.preview);
      setPdfCharCount(data.charCount);
      setPdfStatus('success');
      setSavedPrimaryResume(null);
    } catch (err) {
      setPdfError(
        err instanceof Error
          ? err.message
          : 'Não foi possível extrair texto do PDF. Tente outro arquivo ou cole o texto manualmente.'
      );
      setPdfStatus('error');
      setPdfFileName('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handlePdfUpload(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handlePdfUpload(file);
  };

  const handleFetchUrl = async () => {
    if (!jobUrl.trim()) return;

    setUrlLoading(true);
    setUrlError('');
    setUrlInstruction('');
    setFetchedPlatform('');

    try {
      const res = await fetch('/api/parse-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: jobUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        setUrlError(data.error || 'Falha ao buscar a vaga');
        if (data.instruction) setUrlInstruction(data.instruction);
        return;
      }

      setJobText(data.text);
      setFetchedPlatform(data.platform ? PLATFORM_DISPLAY_NAMES[data.platform as keyof typeof PLATFORM_DISPLAY_NAMES] ?? '' : '');
      setJobTab('text');
    } catch {
      setUrlError('Erro ao buscar a URL. Cole o texto manualmente.');
    } finally {
      setUrlLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setError('');

    if (!user) {
      setError('Você precisa estar autenticado para analisar uma vaga.');
      return;
    }

    if (profile && profile.status !== 'active') {
      setError('Sua conta está inativa ou suspensa.');
      return;
    }

    const usingProfile = resumeMode === 'profile';
    const effectiveResume = resumeText.trim();

    if (!usingProfile && (!effectiveResume || effectiveResume.length < 80)) {
      setError(
        resumeMode === 'pdf'
          ? 'Faça o upload do seu currículo em PDF para continuar.'
          : 'Seu currículo precisa ter pelo menos 80 caracteres.'
      );
      return;
    }

    if (!jobText.trim() || jobText.trim().length < 50) {
      setError('A descrição da vaga precisa ter pelo menos 50 caracteres.');
      return;
    }

    setLoading(true);
    let stepIndex = 0;
    setStep(steps[0]);

    const interval = setInterval(() => {
      stepIndex = (stepIndex + 1) % steps.length;
      setStep(steps[stepIndex]);
    }, 3500);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText: usingProfile ? '' : effectiveResume,
          jobText: jobText.trim(),
          jobUrl,
          userId: user.id,
          useProfile: usingProfile,
          forceGupy: isGupyJob,
        }),
      });

      clearInterval(interval);

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro na análise');
      }

      if (data.id) {
        router.push(`/results/${data.id}`);
      } else {
        sessionStorage.setItem('matchcv_result', JSON.stringify(data));
        router.push('/results/preview');
      }
    } catch (err) {
      clearInterval(interval);
      setError(
        err instanceof Error ? err.message : 'Erro inesperado. Tente novamente.'
      );
      setLoading(false);
      setStep('');
      return;
    }

    setLoading(false);
    setStep('');
  };

  if (authLoading) {
    return (
      <>
        <AppHeader />
        <main className="pt-[60px] max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </main>
      </>
    );
  }

  if (!user) return null;

  const hasStructuredProfile = profileExpCount > 0 || profileSkillCount > 0;

  const resumeReady =
    resumeMode === 'profile'
      ? hasStructuredProfile
      : resumeMode === 'pdf'
      ? pdfStatus === 'success'
      : resumeText.trim().length >= 80;

  const jobReady = jobText.trim().length >= 50;
  const isReady = resumeReady && jobReady && (!profile || profile.status === 'active');

  return (
    <>
      <AppHeader />
      <main className="pt-[60px] max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1.5">Nova análise</h1>
          <p className="text-muted-foreground text-sm">
            Envie seu currículo e a descrição da vaga para receber uma análise completa com currículo aderente.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loadingPrimaryResume && (
          <Alert className="mb-6">
            <AlertDescription>Carregando currículo principal...</AlertDescription>
          </Alert>
        )}

        {savedPrimaryResume && (
          <Alert className="mb-6 border-primary/20 bg-primary/5">
            <Star className="h-4 w-4 text-primary" />
            <AlertDescription>
              Currículo principal carregado automaticamente: <strong>{savedPrimaryResume.file_name}</strong>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">1</div>
              <Label className="text-base font-semibold">Seu currículo</Label>
              {resumeReady && <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />}
            </div>

            <Tabs value={resumeMode} onValueChange={(v) => setResumeMode(v as ResumeMode)}>
              <TabsList className="w-full grid grid-cols-3 h-9">
                <TabsTrigger value="profile" className="text-sm gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  Meu perfil
                </TabsTrigger>
                <TabsTrigger value="pdf" className="text-sm gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  PDF
                </TabsTrigger>
                <TabsTrigger value="text" className="text-sm gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Texto
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="mt-3">
                {loadingPrimaryResume ? (
                  <div className="border rounded-xl p-6 text-center text-sm text-muted-foreground">
                    Verificando perfil...
                  </div>
                ) : hasStructuredProfile ? (
                  <div className="border border-primary/30 bg-primary/5 rounded-xl p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Perfil estruturado pronto</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Seus dados serão usados diretamente. Nenhum upload necessário.
                        </p>
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5 ml-auto" />
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {profileExpCount > 0 && (
                        <span className="text-xs bg-background border rounded-full px-2.5 py-1 text-muted-foreground">
                          {profileExpCount} experiência{profileExpCount !== 1 ? 's' : ''}
                        </span>
                      )}
                      {profileSkillCount > 0 && (
                        <span className="text-xs bg-background border rounded-full px-2.5 py-1 text-muted-foreground">
                          {profileSkillCount} skill{profileSkillCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Quer usar um currículo diferente?{' '}
                      <button
                        type="button"
                        onClick={() => setResumeMode('pdf')}
                        className="text-primary underline-offset-2 hover:underline"
                      >
                        Enviar PDF
                      </button>
                    </p>
                  </div>
                ) : (
                  <div className="border border-dashed rounded-xl p-6 text-center space-y-3">
                    <User className="w-8 h-8 text-muted-foreground mx-auto" />
                    <p className="text-sm font-medium">Perfil ainda não preenchido</p>
                    <p className="text-xs text-muted-foreground">
                      Preencha seu perfil com experiências e skills para usar esta opção.
                    </p>
                    <a
                      href="/profile"
                      className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
                    >
                      Ir para o perfil
                      <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="pdf" className="mt-3 space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {pdfStatus === 'idle' && (
                  <div
                    className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-all"
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm font-medium text-foreground mb-1">Clique ou arraste seu PDF</p>
                    <p className="text-xs text-muted-foreground">PDF até 10MB</p>
                  </div>
                )}

                {pdfStatus === 'uploading' && (
                  <div className="border-2 border-primary/30 rounded-xl p-8 text-center bg-primary/5">
                    <Loader2 className="w-8 h-8 text-primary mx-auto mb-3 animate-spin" />
                    <p className="text-sm font-medium text-primary">Extraindo texto do PDF...</p>
                    <p className="text-xs text-muted-foreground mt-1">{pdfFileName}</p>
                  </div>
                )}

                {pdfStatus === 'success' && (
                  <div className="space-y-2">
                    <div className="border border-green-200 bg-green-50 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-green-800">{pdfFileName}</p>
                            <p className="text-xs text-green-600 mt-0.5">
                              {pdfCharCount.toLocaleString('pt-BR')} caracteres disponíveis
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setPdfStatus('idle');
                            setPdfFileName('');
                            setResumeText('');
                            setPdfPreview('');
                            setSavedPrimaryResume(null);
                          }}
                          className="text-green-600 hover:text-green-800 flex-shrink-0"
                          type="button"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {pdfPreview && (
                      <div>
                        <button
                          onClick={() => setShowPreview(!showPreview)}
                          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
                          type="button"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          {showPreview ? 'Ocultar' : 'Ver'} prévia do texto
                          {showPreview ? (
                            <ChevronUp className="w-3 h-3 ml-auto" />
                          ) : (
                            <ChevronDown className="w-3 h-3 ml-auto" />
                          )}
                        </button>
                        {showPreview && (
                          <div className="mt-2 p-3 bg-muted/40 rounded-lg border border-border text-xs font-mono text-muted-foreground leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
                            {pdfPreview}
                            {pdfCharCount > 600 && (
                              <span className="text-primary font-medium">
                                ... ({pdfCharCount - 600} caracteres a mais)
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {pdfStatus === 'error' && (
                  <div className="space-y-3">
                    <div className="border border-destructive/30 bg-destructive/5 rounded-xl p-4 flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-destructive">Falha ao extrair texto</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{pdfError}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setPdfStatus('idle');
                        setPdfError('');
                      }}
                    >
                      Tentar outro arquivo
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="text" className="mt-3 space-y-2">
                <Textarea
                  placeholder="Cole aqui o texto completo do seu currículo..."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  className="min-h-[280px] resize-none font-mono text-xs leading-relaxed"
                  disabled={loading}
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{resumeText.length} caracteres</span>
                  {resumeText.length < 80 && resumeText.length > 0 && (
                    <span className="text-yellow-600">{80 - resumeText.length} a mais para mínimo</span>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">2</div>
              <Label className="text-base font-semibold">A vaga</Label>
              {jobReady && <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />}
            </div>

            <Tabs value={jobTab} onValueChange={setJobTab}>
              <TabsList className="w-full grid grid-cols-2 h-9">
                <TabsTrigger value="text" className="text-sm gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Texto
                </TabsTrigger>
                <TabsTrigger value="url" className="text-sm gap-1.5">
                  <Link className="w-3.5 h-3.5" />
                  URL
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="mt-3 space-y-2">
                <Textarea
                  placeholder="Cole aqui o texto completo da vaga de emprego..."
                  value={jobText}
                  onChange={(e) => setJobText(e.target.value)}
                  className="min-h-[280px] resize-none text-sm leading-relaxed"
                  disabled={loading}
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{jobText.length} caracteres</span>
                  {jobText.length < 50 && jobText.length > 0 && (
                    <span className="text-yellow-600">{50 - jobText.length} a mais para mínimo</span>
                  )}
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
                  <input
                    type="checkbox"
                    checked={isGupyJob}
                    onChange={(e) => setIsGupyJob(e.target.checked)}
                    disabled={loading}
                    className="w-3.5 h-3.5 accent-primary"
                  />
                  <span className="text-xs text-muted-foreground">
                    Esta vaga é da <span className="font-medium text-foreground">Gupy</span>
                    {isGupyJob && (
                      <span className="ml-1.5 text-primary font-medium">
                        → texto de candidatura será gerado
                      </span>
                    )}
                  </span>
                </label>
              </TabsContent>

              <TabsContent value="url" className="mt-3 space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      placeholder="https://jobs.gupy.io/..."
                      value={jobUrl}
                      onChange={(e) => {
                        setJobUrl(e.target.value);
                        setUrlError('');
                        setUrlInstruction('');
                        setFetchedPlatform('');
                      }}
                      className="h-10 text-sm pr-20"
                      disabled={urlLoading || loading}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleFetchUrl();
                      }}
                    />
                    {jobUrl.trim() && (() => {
                      const p = detectPlatform(jobUrl);
                      if (p !== 'generic') {
                        return (
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full pointer-events-none">
                            {PLATFORM_DISPLAY_NAMES[p]}
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <Button
                    onClick={handleFetchUrl}
                    disabled={!jobUrl.trim() || urlLoading || loading}
                    className="h-10 px-4 flex-shrink-0"
                  >
                    {urlLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
                  </Button>
                </div>

                {urlError && (
                  <div className="space-y-1">
                    <p className="text-xs text-destructive flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      {urlError}
                    </p>
                    {urlInstruction && (
                      <p className="text-xs text-muted-foreground pl-5">{urlInstruction}</p>
                    )}
                  </div>
                )}

                {jobText && !urlError && (
                  <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-xs text-green-700 flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    {fetchedPlatform ? `Texto extraído do ${fetchedPlatform}.` : 'Texto extraído.'} Verifique na aba Texto.
                  </div>
                )}

                <Textarea
                  placeholder="O texto da vaga aparecerá aqui após a extração..."
                  value={jobText}
                  onChange={(e) => setJobText(e.target.value)}
                  className="min-h-[200px] resize-none text-sm leading-relaxed"
                  disabled={loading}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          <Button
            onClick={handleAnalyze}
            disabled={!isReady || loading}
            size="lg"
            className="gap-2 h-12 px-8 text-base w-full sm:w-auto min-w-[280px]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {step || 'Analisando...'}
              </>
            ) : (
              <>
                Gerar currículo aderente
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>

          {loading && (
            <p className="text-xs text-muted-foreground animate-pulse">
              Isso pode levar até 30–40 segundos
            </p>
          )}

          {!isReady && !loading && (
            <p className="text-xs text-muted-foreground">
              {!resumeReady
                ? resumeMode === 'profile'
                  ? 'Preencha seu perfil com experiências antes de continuar'
                  : 'Adicione ou mantenha um currículo válido'
                : 'Cole a descrição da vaga (mín. 50 caracteres)'}
            </p>
          )}
        </div>
      </main>
    </>
  );
}