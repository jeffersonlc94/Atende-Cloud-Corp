"use client";

import { use, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useQuote } from "@/hooks/use-quotes";
import {
  QuotePrintLayout,
  quotePrintLayoutOptions,
  type QuotePrintLayoutId,
} from "@/components/quotes/quote-print-layout";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Printer, FileDown, Loader2, Pencil } from "lucide-react";

const fontFamilyOptions = [
  { value: "default", label: "Padrão do layout", css: "" },
  { value: "sans", label: "Sans-serif", css: "Arial, Helvetica, sans-serif" },
  { value: "serif", label: "Serifada", css: "Georgia, 'Times New Roman', serif" },
  { value: "mono", label: "Monoespaçada", css: "'Courier New', Courier, monospace" },
] as const;

const fontSizeOptions = [
  { value: "0.875", label: "Pequena" },
  { value: "1", label: "Padrão" },
  { value: "1.125", label: "Grande" },
  { value: "1.25", label: "Extra grande" },
] as const;

export default function ImprimirOrcamentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: quote, isLoading } = useQuote(id);
  const printRef = useRef<HTMLDivElement>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [layout, setLayout] = useState<QuotePrintLayoutId>("classico");
  const [fontFamilyKey, setFontFamilyKey] = useState<(typeof fontFamilyOptions)[number]["value"]>("default");
  const [fontSizeKey, setFontSizeKey] = useState<(typeof fontSizeOptions)[number]["value"]>("1");

  async function handleGeneratePdf() {
    if (!printRef.current || !quote) return;
    setGeneratingPdf(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);

      const targetEl = printRef.current.firstElementChild as HTMLElement | null;
      const captureWidth = targetEl?.scrollWidth || printRef.current.scrollWidth;
      const captureHeight = targetEl?.scrollHeight || printRef.current.scrollHeight;

      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        width: captureWidth,
        height: captureHeight,
        windowWidth: captureWidth,
        windowHeight: captureHeight,
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
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/orcamentos/${id}`} className={buttonVariants({ variant: "outline" })}>
            <Pencil className="mr-2 h-4 w-4" /> Editar
          </Link>
          <Select value={layout} onValueChange={(v) => setLayout(v as QuotePrintLayoutId)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {quotePrintLayoutOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={fontFamilyKey} onValueChange={(v) => setFontFamilyKey(v as typeof fontFamilyKey)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fontFamilyOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={fontSizeKey} onValueChange={(v) => setFontSizeKey(v as typeof fontSizeKey)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fontSizeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            layout={layout}
            fontFamily={fontFamilyOptions.find((opt) => opt.value === fontFamilyKey)?.css || undefined}
            fontScale={Number(fontSizeKey)}
            company={quote.company}
            quote={{
              numero: quote.numero,
              clienteNome: quote.client.nome,
              createdByUserName: quote.updatedByUser?.name ?? quote.createdByUser?.name,
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
              descontoProdutosTipo: quote.descontoProdutosTipo,
              descontoProdutosValor: quote.descontoProdutosValor,
              descontoServicosTipo: quote.descontoServicosTipo,
              descontoServicosValor: quote.descontoServicosValor,
              total: quote.total,
            }}
          />
        </div>
      </div>
    </div>
  );
}
