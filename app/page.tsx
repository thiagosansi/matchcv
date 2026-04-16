'use client';

import Link from 'next/link';
import { ArrowRight, FileText, Zap, Target, TrendingUp, CircleCheck as CheckCircle, ChartBar as BarChart3, Star, Shield, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth/AuthProvider';

const features = [
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: 'Score de aderência',
    desc: 'Saiba exatamente o quão compatível seu currículo é com a vaga — de 0 a 100.',
  },
  {
    icon: <Target className="w-5 h-5" />,
    title: 'Lacunas identificadas',
    desc: 'Descubra competências ausentes, palavras-chave faltantes e experiências pouco evidenciadas.',
  },
  {
    icon: <FileText className="w-5 h-5" />,
    title: 'Currículo otimizado',
    desc: 'Versão reescrita e editável do seu currículo, alinhada à vaga — sem inventar nada.',
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: 'Palavras-chave ATS',
    desc: 'Lista completa de termos que os sistemas de triagem automática buscam.',
  },
  {
    icon: <TrendingUp className="w-5 h-5" />,
    title: 'Pretensão salarial',
    desc: 'Faixa salarial estimada com base em benchmarks reais de mercado (Glassdoor, LinkedIn).',
  },
  {
    icon: <CheckCircle className="w-5 h-5" />,
    title: 'Texto para Gupy',
    desc: '3 versões de texto de candidatura — formal, humana e objetiva — para plataformas como Gupy.',
  },
];

const steps = [
  { step: '01', title: 'Envie seu currículo', desc: 'Cole o texto ou faça upload do PDF do seu currículo atual.' },
  { step: '02', title: 'Cole a vaga', desc: 'Insira o texto da vaga ou o link direto. Extraímos automaticamente.' },
  { step: '03', title: 'Receba sua análise', desc: 'Em segundos, você recebe score, lacunas, currículo otimizado e mais.' },
];

const testimonials = [
  { name: 'Marina Costa', role: 'Product Manager', text: 'Recebi 3 entrevistas na semana seguinte. O score e as sugestões foram precisos demais.', rating: 5 },
  { name: 'Rafael Andrade', role: 'Dev Senior', text: 'A estimativa salarial me deu confiança na negociação. Fechei 20% acima do que esperava.', rating: 5 },
  { name: 'Juliana Melo', role: 'Analista de Dados', text: 'O texto para Gupy era exatamente o que eu precisava. Economizei horas.', rating: 5 },
];

export default function LandingPage() {
  const { user, loading: authLoading } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-lg text-foreground">MatchCV</span>
          </div>
          <div className="flex items-center gap-3">
            {!authLoading && user ? (
              <Link href="/dashboard">
                <Button size="sm">Ir para o dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">Entrar</Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">Criar conta</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-4 gradient-mesh">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="secondary" className="mb-6 gap-1.5 text-xs font-medium">
            <Zap className="w-3 h-3" />
            IA para candidaturas mais inteligentes
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground leading-[1.12] mb-6 text-balance">
            Adapte seu currículo para{' '}
            <span className="text-primary">cada vaga</span>{' '}
            com inteligência
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Score de aderência, lacunas, currículo otimizado, palavras-chave ATS, texto para Gupy e estimativa salarial — em segundos.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/analyze">
              <Button size="lg" className="gap-2 h-12 px-7 text-base font-medium w-full sm:w-auto">
                Analisar meu currículo
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/history">
              <Button size="lg" variant="outline" className="h-12 px-7 text-base font-medium w-full sm:w-auto">
                Ver histórico
              </Button>
            </Link>
          </div>
          <p className="mt-5 text-sm text-muted-foreground">
  Crie sua conta para salvar currículo, histórico e análises.
</p>
        </div>
      </section>

      <section className="py-16 px-4 border-y border-border/50 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {[
              { value: '92%', label: 'taxa de satisfação' },
              { value: '3x', label: 'mais entrevistas' },
              { value: '<30s', label: 'para o resultado' },
              { value: '100%', label: 'dados reais' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-bold text-primary mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">Tudo que você precisa para se destacar</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Uma análise completa, do score à pretensão salarial, em um único lugar.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-base mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-primary">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3 text-white">Como funciona</h2>
            <p className="text-white/75 text-lg">Três passos. Resultado em segundos.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {steps.map((step, i) => (
              <div key={step.step} className="relative">
                <div className="p-6 rounded-2xl bg-white text-center shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-lg flex items-center justify-center mx-auto mb-4">
                    {step.step}
                  </div>
                  <h3 className="font-semibold text-base mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-white/30" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">O que dizem os usuários</h2>
            <p className="text-muted-foreground text-lg">Resultados reais de pessoas reais.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <div key={t.name} className="p-6 rounded-2xl border border-border bg-card">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-foreground leading-relaxed mb-4">"{t.text}"</p>
                <div>
                  <div className="font-medium text-sm">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex flex-wrap justify-center gap-6 mb-8">
            {[
              { icon: <Shield className="w-4 h-4" />, label: 'Dados seguros' },
              { icon: <Clock className="w-4 h-4" />, label: 'Resultado em segundos' },
              { icon: <CheckCircle className="w-4 h-4" />, label: 'Sem invenção de dados' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="text-primary">{item.icon}</span>
                {item.label}
              </div>
            ))}
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Pronto para se candidatar com confiança?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            Analise sua compatibilidade com a vaga agora e aumente suas chances de ser chamado.
          </p>
          <Link href="/analyze">
            <Button size="lg" className="gap-2 h-12 px-8 text-base font-medium">
              Começar análise gratuita
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <FileText className="w-3 h-3 text-white" />
            </div>
            <span className="font-medium text-foreground">MatchCV</span>
          </div>
          <p>© 2025 MatchCV. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-foreground cursor-pointer transition-colors">Termos de uso</span>
            <span className="hover:text-foreground cursor-pointer transition-colors">Privacidade</span>
            <span className="hover:text-foreground cursor-pointer transition-colors">Contato</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
