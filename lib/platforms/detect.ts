import type { Platform } from '@/types';

export function detectPlatform(url: string): Platform {
  const u = url.toLowerCase();

  if (u.includes('.gupy.io') || u.includes('portal.gupy.io')) return 'gupy';
  if (u.includes('inhire.app'))                                return 'inhire';
  if (u.includes('boards.greenhouse.io'))                      return 'greenhouse';
  if (u.includes('jobs.lever.co'))                             return 'lever';
  if (u.includes('linkedin.com/jobs'))                         return 'linkedin';
  if (u.includes('catho.com.br'))                              return 'catho';
  if (u.includes('vagas.com'))                                 return 'vagas_com';
  if (u.includes('infojobs.com.br'))                           return 'infojobs';
  if (u.includes('kenoby.com'))                                return 'kenoby';

  return 'generic';
}
