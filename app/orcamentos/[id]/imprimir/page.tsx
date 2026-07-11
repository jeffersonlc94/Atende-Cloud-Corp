"use client";

import { use, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useQuote } from "@/hooks/use-quotes";
import { QuotePrintLayout } from "@/components/quotes/quote-print-layout";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Printer, FileDown, Loader2 } from "lucide-react";

export default function ImprimirOrcamentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: quote, isLoading } = useQuote(id);
  const printRef = useRef<HTMLDivElement>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  async function handleGeneratePdf() {
    if (!printRef.current || !quote) return;
    setGeneratingPdf(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);

      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pageWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`orcamento-${quote.numero}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF do orçamento:", error);
      toast.error("Erro ao gerar PDF. Tente novamente.");
    } finally {
      setGeneratingPdf(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!quote) {
    return <p className="p-6 text-muted-foreground">Orçamento não encontrado.</p>;
  }

  return (
    <div className="min-h-screen bg-gray-200 dark:bg-gray-900">
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 border-b bg-background p-4 print:hidden">
        <Link href="/orcamentos" className={buttonVariants({ variant: "ghost" })}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Imprimir
          </Button>
          <Button onClick={handleGeneratePdf} disabled={generatingPdf}>
            {generatingPdf ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            Gerar PDF
          </Button>
        </div>
      </div>

      <div className="py-8">
        <div ref={printRef}>
          <QuotePrintLayout
            company={quote.company}
            quote={{
              numero: quote.numero,
              clienteNome: quote.client.nome,
              referencia: quote.referencia,
              dataEmissao: quote.dataEmissao,
              validadeDias: quote.validadeDias,
              condicoesPagamento: quote.condicoesPagamento,
              prazoEntrega: quote.prazoEntrega,
              observacoes: quote.observacoes,
              itens: quote.itens,
              subtotal: quote.subtotal,
              descontoGeralTipo: quote.descontoGeralTipo,
              descontoGeralValor: quote.descontoGeralValor,
              total: quote.total,
            }}
          />
        </div>
      </div>
    </div>
  );
}
