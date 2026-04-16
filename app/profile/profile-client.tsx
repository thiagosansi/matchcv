'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { AppHeader } from '@/components/layout/AppHeader';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  if (authLoading) return null;
  if (!user) return null;

  return (
    <>
      <AppHeader />
      <main className="pt-[60px] max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-2">Meu perfil</h1>
        <p className="text-muted-foreground">
          Aqui vamos editar nome, objetivo profissional e resumo-base.
        </p>
      </main>
    </>
  );
}