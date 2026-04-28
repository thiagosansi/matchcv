'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, History, LayoutDashboard, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AppHeader() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { href: '/history', label: 'Histórico', icon: <History className="w-4 h-4" /> },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
      <div
        className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between"
        style={{ height: '60px' }}
      >
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-base">MatchCV</span>
          </Link>

          <nav className="hidden sm:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <Link href="/analyze">
          <Button size="sm" className="gap-1.5 h-8 px-4">
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nova análise</span>
            <span className="sm:hidden">Nova</span>
          </Button>
        </Link>
      </div>
    </header>
  );
}