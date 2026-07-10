"use client";

import { useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { quoteSchema, type QuoteFormValues } from "@/lib/validations";
import { useCompanies } from "@/hooks/use-companies";
import { useCreateQuote, useUpdateQuote, type QuoteRecord } from "@/hooks/use-quotes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ClientCombobox } from "@/components/clients/client-combobox";
import { QuoteItemsTable } from "./quote-items-table";
import { QuotePrintLayout } from "./quote-print-layout";
import { formatCurrencyBRL } from "@/lib/format";
import {
  Loader2,
  Save,
  Eye,
  Printer,
  FileDown,
  ArrowLeft,
  ClipboardList,
  ListOrdered,
  MessageSquareText,
} from "lucide-react";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <CardHeader className="border-b">
      <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">
        <Icon className="h-4 w-4 text-emerald-600" />
        {title}
      </CardTitle>
    </CardHeader>
  );
}

export function QuoteForm({ initialData }: { initialData?: QuoteRecord }) {
  const router = useRouter();
  const { data: session } = useSession();
  const { data: companies = [] } = useCompanies();
  const createQuote = useCreateQuote();
  const updateQuote = useUpdateQuote();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteSchema),
    defaultValues: initialData
      ? {
          numero: initialData.numero,
          companyId: initialData.companyId,
          clientNome: initialData.client.nome,
          referencia: initialData.referencia ?? "",
          dataEmissao: initialData.dataEmissao.slice(0, 10),
          validadeDias: initialData.validadeDias,
          condicoesPagamento: initialData.condicoesPagamento ?? "",
          prazoEntrega: initialData.prazoEntrega ?? "",
          observacoes: initialData.observacoes ?? "",
          itens: initialData.itens.map((i) => ({
            ordem: i.ordem,
            descricao: i.descricao,
            quantidade: Number(i.quantidade),
            valorUnitario: Number(i.valorUnitario),
          })),
        }
      : {
          numero: "",
          companyId: "",
          clientNome: "",
          referencia: "",
          dataEmissao: todayISO(),
          validadeDias: 15,
          condicoesPagamento: "",
          prazoEntrega: "",
          observacoes: "",
          itens: [{ ordem: 0, descricao: "", quantidade: 1, valorUnitario: 0 }],
        },
  });

  const values = watch();
  const selectedCompany = companies.find((c) => c.id === values.companyId);

  const total = useMemo(() => {
    return (values.itens ?? []).reduce(
      (acc, item) => acc + (Number(item?.quantidade) || 0) * (Number(item?.valorUnitario) || 0),
      0
    );
  }, [values.itens]);

  const dataValidade = useMemo(() => {
    if (!values.dataEmissao) return "";
    const base = new Date(`${values.dataEmissao}T00:00:00`);
    if (Number.isNaN(base.getTime())) return "";
    base.setDate(base.getDate() + (Number(values.validadeDias) || 0));
    return base.toLocaleDateString("pt-BR");
  }, [values.dataEmissao, values.validadeDias]);

  const previewData = {
    numero: values.numero || "(automático)",
    clienteNome: values.clientNome,
    referencia: values.referencia,
    dataEmissao: values.dataEmissao,
    validadeDias: values.validadeDias ?? 15,
    condicoesPagamento: values.condicoesPagamento,
    prazoEntrega: values.prazoEntrega,
    observacoes: values.observacoes,
    itens: (values.itens ?? []).map((item) => ({
      ...item,
      valorTotal: (Number(item.quantidade) || 0) * (Number(item.valorUnitario) || 0),
    })),
    total,
  };

  async function onSubmit(data: QuoteFormValues) {
    try {
      if (initialData) {
        await updateQuote.mutateAsync({ id: initialData.id, data });
        toast.success("Orçamento atualizado com sucesso");
      } else {
        const created = await createQuote.mutateAsync(data);
        toast.success(`Orçamento nº ${created.numero} criado com sucesso`);
      }
      router.push("/orcamentos");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar orçamento");
    }
  }

  async function handleGeneratePdf() {
    if (!printRef.current) return;
    setGeneratingPdf(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
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

      pdf.save(`orcamento-${values.numero || "novo"}.pdf`);
    } finally {
      setGeneratingPdf(false);
    }
  }

  const isSaving = createQuote.isPending || updateQuote.isPending;
  const isEditing = !!initialData;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditing ? "Editar Orçamento" : "Novo Orçamento"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Orçamentos <span className="mx-1">›</span>{" "}
            {isEditing ? "Editar Orçamento" : "Novo Orçamento"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar
          </Button>
          <Button type="button" variant="outline" onClick={() => setPreviewOpen(true)}>
            <Eye className="mr-2 h-4 w-4" /> Pré-visualizar
          </Button>
          <Button type="button" variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Imprimir
          </Button>
          <Button type="button" variant="outline" onClick={handleGeneratePdf} disabled={generatingPdf}>
            {generatingPdf ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            Gerar PDF
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/orcamentos")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[3fr_2fr]">
        <div className="space-y-6 print:hidden">
          <Card className="py-0 gap-0">
            <SectionHeader icon={ClipboardList} title="Dados do Orçamento" />
            <CardContent className="grid gap-4 pt-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Empresa Emissora *</Label>
                <Select
                  value={values.companyId}
                  onValueChange={(v) => setValue("companyId", v as string, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nomeFantasia || c.razaoSocial}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.companyId && (
                  <p className="text-sm text-destructive">{errors.companyId.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Nº do Orçamento</Label>
                <Input
                  placeholder="Deixe em branco para gerar automático"
                  {...register("numero")}
                />
              </div>
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <ClientCombobox
                  value={values.clientNome}
                  onChange={(nome) => setValue("clientNome", nome, { shouldValidate: true })}
                />
                {errors.clientNome && (
                  <p className="text-sm text-destructive">{errors.clientNome.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Referência / Assunto *</Label>
                <Input placeholder="Ex: Proposta comercial" {...register("referencia")} />
              </div>
              <div className="space-y-2">
                <Label>Data de Emissão *</Label>
                <Input type="date" {...register("dataEmissao")} />
              </div>
              <div className="space-y-2">
                <Label>Validade da Proposta (dias)</Label>
                <Input
                  type="number"
                  min={1}
                  {...register("validadeDias", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label>Data de Validade</Label>
                <Input value={dataValidade} disabled placeholder="Calculada automaticamente" />
              </div>
              <div className="space-y-2">
                <Label>Prazo de Entrega</Label>
                <Input placeholder="Ex: 7 dias úteis" {...register("prazoEntrega")} />
              </div>
              <div className="space-y-2">
                <Label>Condições de Pagamento</Label>
                <Input placeholder="Ex: À vista, 30 dias, etc." {...register("condicoesPagamento")} />
              </div>
            </CardContent>
          </Card>

          <Card className="py-0 gap-0">
            <SectionHeader icon={ListOrdered} title="Itens do Orçamento" />
            <CardContent className="space-y-4 pt-4">
              <QuoteItemsTable control={control} register={register} watchItems={values.itens} />
              {errors.itens && !Array.isArray(errors.itens) && (
                <p className="text-sm text-destructive">{errors.itens.message}</p>
              )}
              <div className="flex items-center justify-between border-t pt-4">
                <span className="text-sm font-medium text-muted-foreground">TOTAL</span>
                <span className="text-2xl font-bold">{formatCurrencyBRL(total)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="py-0 gap-0">
            <SectionHeader icon={MessageSquareText} title="Observações" />
            <CardContent className="pt-4">
              <Textarea
                rows={4}
                placeholder="Observações gerais sobre o orçamento..."
                {...register("observacoes")}
              />
            </CardContent>
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>Usuário responsável: {session?.user?.name ?? "—"}</span>
            <span>
              Criado em:{" "}
              {initialData
                ? new Date(initialData.createdAt).toLocaleString("pt-BR")
                : new Date().toLocaleString("pt-BR")}
            </span>
          </div>
        </div>

        <div className="xl:sticky xl:top-20 xl:self-start">
          <Card className="py-0 gap-0">
            <CardHeader className="border-b print:hidden">
              <CardTitle className="text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                Pré-visualização do Orçamento
              </CardTitle>
            </CardHeader>
            <CardContent className="bg-slate-100 p-4 dark:bg-slate-800 print:bg-transparent print:p-0">
              <div
                ref={printRef}
                className="max-h-[80vh] overflow-y-auto print:max-h-none print:overflow-visible"
              >
                <QuotePrintLayout company={selectedCompany} quote={previewData} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto print:hidden">
          <DialogHeader>
            <DialogTitle>Pré-visualização do Orçamento</DialogTitle>
          </DialogHeader>
          <QuotePrintLayout
            id="quote-print-area-preview"
            company={selectedCompany}
            quote={previewData}
          />
        </DialogContent>
      </Dialog>
    </form>
  );
}
