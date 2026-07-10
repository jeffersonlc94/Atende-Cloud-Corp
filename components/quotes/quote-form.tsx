"use client";

import { useEffect, useMemo, useState } from "react";
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
import { ClientCombobox } from "@/components/clients/client-combobox";
import { QuoteItemsTable } from "./quote-items-table";
import { formatCurrencyBRL } from "@/lib/format";
import {
  Loader2,
  Save,
  Eye,
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
  const [previewing, setPreviewing] = useState(false);

  const defaultCompany = companies.find((c) => c.isDefault);

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

  // Pré-seleciona a empresa marcada como padrão em Configurações > Empresas Emissoras
  // ao criar um novo orçamento (não afeta orçamentos já existentes/edição).
  useEffect(() => {
    if (!initialData && !values.companyId && defaultCompany) {
      setValue("companyId", defaultCompany.id, { shouldValidate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, defaultCompany, values.companyId]);

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

  async function persist(data: QuoteFormValues) {
    if (initialData) {
      await updateQuote.mutateAsync({ id: initialData.id, data });
      return initialData.id;
    }
    const created = await createQuote.mutateAsync(data);
    return created.id;
  }

  async function onSubmit(data: QuoteFormValues) {
    try {
      await persist(data);
      toast.success(initialData ? "Orçamento atualizado com sucesso" : "Orçamento criado com sucesso");
      router.push("/orcamentos");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar orçamento");
    }
  }

  // A pré-visualização, impressão e geração de PDF usam a MESMA página
  // (/orcamentos/[id]/imprimir) como única fonte de verdade — nada de preview
  // client-side desconectado do banco. Para um orçamento novo, salvamos como
  // rascunho (validando os campos obrigatórios) e só então abrimos a página
  // com o ID gerado.
  const handlePreview = handleSubmit(
    async (data) => {
      setPreviewing(true);
      try {
        const id = await persist(data);
        if (!initialData) {
          toast.success("Orçamento salvo como rascunho para pré-visualização");
          router.refresh();
        }
        window.open(`/orcamentos/${id}/imprimir`, "_blank", "noopener,noreferrer");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao salvar orçamento para pré-visualização");
      } finally {
        setPreviewing(false);
      }
    },
    () => {
      toast.error("Preencha os campos obrigatórios antes de pré-visualizar");
    }
  );

  const isSaving = createQuote.isPending || updateQuote.isPending;
  const isEditing = !!initialData;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
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
          <Button type="button" variant="outline" onClick={handlePreview} disabled={previewing}>
            {previewing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Eye className="mr-2 h-4 w-4" />
            )}
            Pré-visualizar
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/orcamentos")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="py-0 gap-0 rounded-2xl">
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

        <Card className="py-0 gap-0 rounded-2xl">
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

        <Card className="py-0 gap-0 rounded-2xl">
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
    </form>
  );
}
