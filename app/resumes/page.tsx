'use client';

import { AppHeader } from '@/components/layout/AppHeader';

export default function ResumesPage() {
  return (
    <>
      <AppHeader />
      <main className="pt-[60px] max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-2">Meu currículo</h1>
        <p className="text-muted-foreground">
          Aqui vamos listar os currículos salvos e definir o currículo principal.
        </p>
      </main>
    </>
  );
}