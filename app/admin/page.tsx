'use client';

import { AppHeader } from '@/components/layout/AppHeader';

export default function AdminPage() {
  return (
    <>
      <AppHeader />
      <main className="pt-[60px] max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-2">Painel administrativo</h1>
        <p className="text-muted-foreground">
          Aqui vamos mostrar métricas de uso, usuários e permissões.
        </p>
      </main>
    </>
  );
}