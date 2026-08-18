"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { QuoteForm } from "@/components/quotes/quote-form";
import { useQuoteDraft } from "@/hooks/use-quotes";
import { Skeleton } from "@/components/ui/skeleton";

function NovoOrcamentoContent() {
  const draftId = useSearchParams().get("draftId");
  const { data: draft, isLoading } = useQuoteDraft(draftId);
  if (draftId && isLoading) return <Skeleton className="h-96 w-full" />;
  return <QuoteForm draft={draft} />;
}

export default function NovoOrcamentoPage() {
  return <Suspense fallback={<Skeleton className="h-96 w-full" />}><NovoOrcamentoContent /></Suspense>;
}
