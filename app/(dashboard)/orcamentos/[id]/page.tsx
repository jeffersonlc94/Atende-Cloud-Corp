"use client";

import { use } from "react";
import { useQuote } from "@/hooks/use-quotes";
import { QuoteForm } from "@/components/quotes/quote-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditarOrcamentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: quote, isLoading } = useQuote(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!quote) {
    return <p className="text-muted-foreground">Orçamento não encontrado.</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Editar Orçamento nº {quote.numero}
        </h1>
        <p className="text-sm text-muted-foreground">
          Altere os dados abaixo e salve para atualizar o orçamento.
        </p>
      </div>
      <QuoteForm initialData={quote} />
    </div>
  );
}
