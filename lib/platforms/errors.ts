import type { Platform } from '@/types';

export class PlatformError extends Error {
  constructor(
    public readonly platform: Platform,
    message: string
  ) {
    super(message);
    this.name = 'PlatformError';
  }
}

export const PLATFORM_PASTE_INSTRUCTIONS: Record<Platform, string> = {
  gupy: 'Abra a vaga no Gupy, role até a descrição completa aparecer e copie todo o texto.',
  inhire: 'Abra a vaga no Inhire, clique em "Ver descrição completa" e copie o texto.',
  linkedin: 'Abra a vaga no LinkedIn, clique em "Ver mais" para expandir a descrição e copie todo o texto.',
  greenhouse: 'Abra a vaga no Greenhouse e copie a descrição completa da posição.',
  lever: 'Abra a vaga no Lever e copie a descrição completa da posição.',
  catho: 'Abra a vaga na Catho e copie a descrição completa.',
  vagas_com: 'Abra a vaga no Vagas.com e copie a descrição da posição.',
  infojobs: 'Abra a vaga no InfoJobs e copie a descrição completa.',
  kenoby: 'Abra a vaga no Kenoby e copie a descrição completa.',
  generic: 'Não foi possível ler a URL. Cole o texto da vaga manualmente.',
};

export const PLATFORM_DISPLAY_NAMES: Record<Platform, string> = {
  gupy: 'Gupy',
  inhire: 'Inhire',
  linkedin: 'LinkedIn',
  greenhouse: 'Greenhouse',
  lever: 'Lever',
  catho: 'Catho',
  vagas_com: 'Vagas.com',
  infojobs: 'InfoJobs',
  kenoby: 'Kenoby',
  generic: 'URL',
};
