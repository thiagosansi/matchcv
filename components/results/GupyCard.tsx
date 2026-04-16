'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import type { GupySuggestion } from '@/types';
import { Copy, Check, MessageSquare } from 'lucide-react';

interface GupyCardProps {
  suggestions: GupySuggestion;
}

function CopyableText({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <div className="p-4 bg-muted/40 rounded-lg border border-border text-sm leading-relaxed text-foreground whitespace-pre-wrap min-h-[120px]">
        {text}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopy}
        className="absolute top-2 right-2 gap-1.5 h-7 text-xs"
      >
        {copied ? (
          <>
            <Check className="w-3 h-3 text-green-500" />
            Copiado!
          </>
        ) : (
          <>
            <Copy className="w-3 h-3" />
            Copiar
          </>
        )}
      </Button>
    </div>
  );
}

export function GupyCard({ suggestions }: GupyCardProps) {
  if (!suggestions?.formal && !suggestions?.human && !suggestions?.objective) return null;

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            Texto para candidatura
          </CardTitle>
          <Badge className="text-xs bg-primary/10 text-primary border-0 font-medium">
            Gupy
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          3 versões para você escolher a que melhor representa seu perfil.
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="formal">
          <TabsList className="w-full grid grid-cols-3 h-8 mb-4">
            <TabsTrigger value="formal" className="text-xs">Formal</TabsTrigger>
            <TabsTrigger value="human" className="text-xs">Pessoal</TabsTrigger>
            <TabsTrigger value="objective" className="text-xs">Objetiva</TabsTrigger>
          </TabsList>
          {suggestions.formal && (
            <TabsContent value="formal">
              <CopyableText text={suggestions.formal} />
            </TabsContent>
          )}
          {suggestions.human && (
            <TabsContent value="human">
              <CopyableText text={suggestions.human} />
            </TabsContent>
          )}
          {suggestions.objective && (
            <TabsContent value="objective">
              <CopyableText text={suggestions.objective} />
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}
