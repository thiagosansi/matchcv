'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = getSupabaseBrowserClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    if (searchParams.get('reset') === 'success') {
      setInfo('Senha redefinida com sucesso. Faça login com a nova senha.');
    }
  }, [searchParams]);

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const authPromise = supabase.auth.signInWithPassword({ email, password });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 10000)
      );

      const { error } = await Promise.race([authPromise, timeoutPromise]);

      clearTimeout(timeoutId);
      setLoading(false);

      if (error) {
        setError('Email ou senha incorretos.');
        return;
      }

      const next = searchParams.get('next') ?? '/dashboard';
      router.push(next);
    } catch (err) {
      setLoading(false);
      const isTimeout = err instanceof Error && err.message === 'timeout';
      setError(
        isTimeout
          ? 'Servidor demorou para responder. Verifique sua conexão e tente novamente.'
          : 'Erro ao conectar. Tente novamente em instantes.'
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm space-y-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Entrar</h1>
          <p className="text-sm text-muted-foreground">
            Acesse sua conta para salvar currículo, histórico e análises.
          </p>
        </div>

        {info && (
          <Alert>
            <AlertDescription>{info}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@email.com"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-primary">
              Esqueceu a senha?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Sua senha"
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
        </div>

        <Button onClick={handleLogin} disabled={loading} className="w-full">
          {loading ? 'Entrando...' : 'Entrar'}
        </Button>

        <p className="text-sm text-muted-foreground">
          Ainda não tem conta?{' '}
          <Link href="/signup" className="text-primary hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
