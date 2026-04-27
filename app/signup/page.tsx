'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

function mapAuthError(message: string): string {
  if (message.includes('email rate limit exceeded') || message.includes('rate limit')) {
    return 'Limite de envio de emails atingido. Aguarde alguns minutos e tente novamente.';
  }
  if (message.includes('User already registered') || message.includes('already been registered')) {
    return 'Este email já está cadastrado. Tente fazer login.';
  }
  if (message.includes('Password should be at least')) {
    return 'A senha deve ter no mínimo 6 caracteres.';
  }
  if (message.includes('Unable to validate email') || message.includes('invalid format')) {
    return 'Formato de email inválido.';
  }
  if (message.includes('Email not confirmed')) {
    return 'Email ainda não confirmado. Verifique sua caixa de entrada.';
  }
  return 'Erro ao criar conta. Tente novamente.';
}

export default function SignupPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async () => {
    setError('');
    setLoading(true);

    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (error) {
      setLoading(false);
      setError(mapAuthError(error.message));
      return;
    }

    if (signUpData?.user) {
      await supabase.from('profiles').insert({
        id: signUpData.user.id,
        email,
        full_name: fullName,
        role: 'user',
        status: 'active',
      } as never);
    }

    setLoading(false);

    // If email confirmation is disabled, signUp returns an active session immediately.
    // Otherwise, redirect to login so the user can sign in after confirming their email.
    if (signUpData?.session) {
      router.push('/');
    } else {
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm space-y-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Criar conta</h1>
          <p className="text-sm text-muted-foreground">
            Salve seu currículo, histórico e análises em uma conta segura.
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="fullName">Nome</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Seu nome"
          />
        </div>

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
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            onKeyDown={(e) => e.key === 'Enter' && handleSignup()}
          />
        </div>

        <Button onClick={handleSignup} disabled={loading} className="w-full">
          {loading ? 'Criando conta...' : 'Criar conta'}
        </Button>

        <p className="text-sm text-muted-foreground">
          Já tem conta?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
