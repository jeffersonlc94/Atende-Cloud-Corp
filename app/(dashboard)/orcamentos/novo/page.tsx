import { QuoteForm } from "@/components/quotes/quote-form";

export default function NovoOrcamentoPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Novo Orçamento</h1>
        <p className="text-sm text-muted-foreground">
          Preencha os dados abaixo. A pré-visualização é atualizada em tempo real.
        </p>
      </div>
      <QuoteForm />
    </div>
  );
}
