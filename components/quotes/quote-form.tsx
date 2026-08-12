"use client";

import { useMemo, useState } from "react";
import { Controller, useForm, useWatch, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { quoteSchema, type QuoteFormValues } from "@/lib/validations";
import { useCompanies } from "@/hooks/use-companies";
import { useUpdateClient } from "@/hooks/use-clients";
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
  CardDescription,
} from "@/components/ui/card";
import { ClientCombobox } from "@/components/clients/client-combobox";
import { EditClientDialog } from "@/components/clients/edit-client-dialog";
import { QuoteItemsTable } from "./quote-items-table";
import { CurrencyInput } from "@/components/ui/currency-input";
import { formatCurrencyBRL } from "@/lib/format";
import { computeQuoteTotals } from "@/lib/quote-calc";
import {
  Loader2,
  Save,
  Eye,
  ArrowLeft,
  ClipboardList,
  ListOrdered,
  MessageSquareText,
  Building2,
  Hash,
  User,
  FileText,
  CalendarDays,
  Clock,
  CreditCard,
  Truck,
  Globe2,
  Lock,
  StickyNote,
  Pencil,
  Unlock,
  type LucideIcon,
} from "lucide-react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
}) {
  return (
    <CardHeader className="border-b">
      <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </CardTitle>
      {description && <CardDescription>{description}</CardDescription>}
    </CardHeader>
  );
}

function FieldLabel({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <Label className="flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      {children}
    </Label>
  );
}

function ClosingDiscountField({
  label, typeName, valueName, control, currentType,
}: {
  label: string;
  typeName: "descontoProdutosTipo" | "descontoServicosTipo" | "descontoGeralTipo";
  valueName: "descontoProdutosValor" | "descontoServicosValor" | "descontoGeralValor";
  control: Control<QuoteFormValues>;
  currentType?: "Valor" | "Percentual";
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <Controller control={control} name={typeName} render={({ field }) => (
        <Select value={field.value ?? "Valor"} onValueChange={field.onChange}>
          <SelectTrigger className="w-24"><SelectValue>{(value: string) => value === "Percentual" ? "%" : "R$"}</SelectValue></SelectTrigger>
          <SelectContent><SelectItem value="Valor">R$</SelectItem><SelectItem value="Percentual">%</SelectItem></SelectContent>
        </Select>
      )} />
      <Controller control={control} name={valueName} render={({ field }) => currentType === "Percentual" ? (
        <div className="relative w-32">
          <Input type="number" step="0.01" min="0" max="100" className="pr-6" value={Number(field.value) > 0 ? Number(field.value) : ""} onChange={(e) => field.onChange(e.target.value === "" || Number(e.target.value) === 0 ? null : Number(e.target.value))} onBlur={field.onBlur} />
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
        </div>
      ) : <CurrencyInput className="w-32" value={Number(field.value) > 0 ? Number(field.value) : undefined} onValueChange={(value) => field.onChange(value && value > 0 ? value : null)} onBlur={field.onBlur} />} />
    </div>
  );
}

export function QuoteForm({ initialData }: { initialData?: QuoteRecord }) {
  const router = useRouter();
  const { data: session } = useSession();
  const { data: companies = [] } = useCompanies();
  const createQuote = useCreateQuote();
  const updateQuote = useUpdateQuote();
  const [previewing, setPreviewing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reopenConfirmOpen, setReopenConfirmOpen] = useState(false);
  const [reopening, setReopening] = useState(false);
  const [approvedLocked, setApprovedLocked] = useState(initialData?.status === "Aprovado");
  const [pendingData, setPendingData] = useState<QuoteFormValues | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(
    initialData?.client.id ?? null
  );
  const [editClientOpen, setEditClientOpen] = useState(false);

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
          validadeDias: initialData.validadeDias ?? undefined,
          condicoesPagamento: initialData.condicoesPagamento ?? "",
          prazoEntrega: initialData.prazoEntrega ?? "",
          observacoes: initialData.observacoes ?? "",
          observacoesInternas: initialData.observacoesInternas ?? "",
          visibilidade: initialData.visibilidade ?? "Global",
          status: initialData.status ?? "Negociacao",
          itens: initialData.itens.map((i) => ({
            ordem: i.ordem,
            tipoItem: i.tipoItem ?? "Produto",
            descricao: i.descricao,
            fotoUrl: i.fotoUrl ?? undefined,
            quantidade: Number(i.quantidade),
            valorUnitario: Number(i.valorUnitario),
            calcularPorMargem: i.calcularPorMargem ?? false,
            custoUnitario: i.custoUnitario !== null ? Number(i.custoUnitario) : undefined,
            margemLucro: i.margemLucro !== null ? Number(i.margemLucro) : undefined,
            freteHabilitado: i.freteHabilitado ?? false,
            freteUnitario: i.freteUnitario !== null ? Number(i.freteUnitario) : undefined,
            descontoTipo: i.descontoTipo ?? undefined,
            descontoValor: i.descontoValor !== null && i.descontoValor !== undefined ? Number(i.descontoValor) : undefined,
          })),
          descontoGeralTipo: initialData.descontoGeralTipo ?? undefined,
          descontoGeralValor:
            initialData.descontoGeralValor !== null && initialData.descontoGeralValor !== undefined
              ? Number(initialData.descontoGeralValor) || undefined
              : undefined,
          descontoProdutosTipo: initialData.descontoProdutosTipo ?? undefined,
          descontoProdutosValor: initialData.descontoProdutosValor !== null ? Number(initialData.descontoProdutosValor) || undefined : undefined,
          descontoServicosTipo: initialData.descontoServicosTipo ?? undefined,
          descontoServicosValor: initialData.descontoServicosValor !== null ? Number(initialData.descontoServicosValor) || undefined : undefined,
        }
      : {
          numero: "",
          companyId: "",
          clientNome: "",
          referencia: "",
          dataEmissao: todayISO(),
          validadeDias: undefined,
          condicoesPagamento: "",
          prazoEntrega: "",
          observacoes: "",
          observacoesInternas: "",
          visibilidade: "Global",
          status: "Negociacao",
          itens: [{ ordem: 0, tipoItem: "Produto", descricao: "", fotoUrl: undefined, quantidade: 1, valorUnitario: undefined, calcularPorMargem: false, custoUnitario: undefined, margemLucro: undefined, freteHabilitado: false, freteUnitario: undefined, descontoTipo: undefined, descontoValor: undefined }],
          descontoGeralTipo: undefined,
          descontoGeralValor: undefined,
          descontoProdutosTipo: undefined,
          descontoProdutosValor: undefined,
          descontoServicosTipo: undefined,
          descontoServicosValor: undefined,
        },
  });

  const values = watch();
  const itens = useWatch({ control, name: "itens" });
  const descontoGeralTipo = useWatch({ control, name: "descontoGeralTipo" });
  const descontoGeralValor = useWatch({ control, name: "descontoGeralValor" });
  const descontoProdutosTipo = useWatch({ control, name: "descontoProdutosTipo" });
  const descontoProdutosValor = useWatch({ control, name: "descontoProdutosValor" });
  const descontoServicosTipo = useWatch({ control, name: "descontoServicosTipo" });
  const descontoServicosValor = useWatch({ control, name: "descontoServicosValor" });

  const { total, descontoGeral, descontoProdutos, descontoServicos, totalProdutos, totalServicos } = useMemo(() => {
    const itensNormalizados = (itens ?? []).map((item) => ({
      quantidade: Number(item?.quantidade) || 0,
      valorUnitario: Number(item?.valorUnitario) || 0,
      descontoTipo: item?.descontoTipo as "Valor" | "Percentual" | undefined,
      descontoValor: Number(item?.descontoValor) || 0,
      tipoItem: item?.tipoItem as "Produto" | "Servico" | undefined,
    }));
    const result = computeQuoteTotals(
      itensNormalizados,
      descontoGeralTipo as "Valor" | "Percentual" | undefined,
      Number(descontoGeralValor) || 0,
      descontoProdutosTipo as "Valor" | "Percentual" | undefined,
      Number(descontoProdutosValor) || 0,
      descontoServicosTipo as "Valor" | "Percentual" | undefined,
      Number(descontoServicosValor) || 0
    );
    return {
      total: result.total,
      descontoGeral: result.descontoGeral,
      descontoProdutos: result.descontoProdutos,
      descontoServicos: result.descontoServicos,
      totalProdutos: result.totalProdutos,
      totalServicos: result.totalServicos,
    };
  }, [itens, descontoGeralTipo, descontoGeralValor, descontoProdutosTipo, descontoProdutosValor, descontoServicosTipo, descontoServicosValor]);

  const dataValidade = useMemo(() => {
    if (!values.dataEmissao || !values.validadeDias) return "";
    const base = new Date(`${values.dataEmissao}T00:00:00`);
    if (Number.isNaN(base.getTime())) return "";
    base.setDate(base.getDate() + Number(values.validadeDias));
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

  async function confirmAndPersist(data: QuoteFormValues) {
    try {
      await persist(data);
      toast.success(initialData ? "Orçamento atualizado com sucesso" : "Orçamento criado com sucesso");
      router.push("/orcamentos");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar orçamento");
    }
  }

  async function onSubmit(data: QuoteFormValues) {
    setPendingData(data);
    setConfirmOpen(true);
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
        router.push(`/orcamentos/${id}/imprimir`);
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

  async function handleReopen() {
    if (!initialData) return;
    setReopening(true);
    try {
      const res = await fetch(`/api/quotes/${initialData.id}/reopen`, { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Erro ao reabrir orçamento");
      setValue("status", "Negociacao", { shouldDirty: false });
      setApprovedLocked(false);
      toast.success("Orçamento reaberto para edição");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao reabrir orçamento");
    } finally {
      setReopening(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit, () =>
        toast.error("Preencha a descrição, a quantidade e o valor obrigatório de todos os itens")
      )}
      className="space-y-4"
    >
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
          {!approvedLocked && <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar
          </Button>}
          {approvedLocked && (
            <Button type="button" onClick={() => setReopenConfirmOpen(true)} disabled={reopening}>
              {reopening ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Unlock className="mr-2 h-4 w-4" />}
              Reabrir orçamento
            </Button>
          )}
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

      {approvedLocked && (
        <Card className="border-emerald-300 bg-emerald-50 text-emerald-900">
          <CardContent className="py-3 text-sm font-medium">Orçamento aprovado e bloqueado para edição.</CardContent>
        </Card>
      )}

      <fieldset disabled={approvedLocked} className="space-y-6 disabled:opacity-75">
        <Card className="py-0 gap-0 rounded-2xl">
          <SectionHeader icon={ClipboardList} title="Dados do Orçamento" description="Informações gerais do orçamento" />
          <CardContent className="grid gap-4 pt-4 pb-5 sm:grid-cols-2">
            <div className="space-y-2">
              <FieldLabel icon={Building2}>Empresa Emissora *</FieldLabel>
              <Select
                value={values.companyId}
                onValueChange={(v) => setValue("companyId", v as string, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a empresa">
                    {(value) =>
                      value
                        ? companies.find((c) => c.id === value)?.nomeFantasia ||
                          companies.find((c) => c.id === value)?.razaoSocial ||
                          "Selecione a empresa"
                        : "Selecione a empresa"
                    }
                  </SelectValue>
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
              <FieldLabel icon={Hash}>Nº do Orçamento</FieldLabel>
              <Input
                placeholder="Deixe em branco para gerar automático"
                {...register("numero")}
              />
            </div>
            <div className="space-y-2">
              <FieldLabel icon={User}>Cliente *</FieldLabel>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <ClientCombobox
                    value={values.clientNome}
                    onChange={(nome, clientId) => {
                      setValue("clientNome", nome, { shouldValidate: true });
                      setSelectedClientId(clientId ?? null);
                    }}
                  />
                </div>
                {selectedClientId && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    title="Corrigir nome do cliente"
                    onClick={() => setEditClientOpen(true)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {errors.clientNome && (
                <p className="text-sm text-destructive">{errors.clientNome.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <FieldLabel icon={FileText}>Referência / Assunto *</FieldLabel>
              <Input placeholder="Ex: Proposta comercial" {...register("referencia")} />
            </div>
            <div className="space-y-2">
              <FieldLabel icon={CalendarDays}>Data de Emissão *</FieldLabel>
              <Input type="date" disabled={isEditing} {...register("dataEmissao")} />
              {isEditing && (
                <p className="text-xs text-muted-foreground">
                  Atualizada automaticamente para a data em que o orçamento for salvo.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <FieldLabel icon={Clock}>Validade da Proposta (dias)</FieldLabel>
              <Input
                type="number"
                min={1}
                placeholder="Ex: 15"
                {...register("validadeDias", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <FieldLabel icon={CalendarDays}>Data de Validade</FieldLabel>
              <Input value={dataValidade} disabled placeholder="Calculada automaticamente" />
            </div>
            <div className="space-y-2">
              <FieldLabel icon={Truck}>Prazo de Entrega</FieldLabel>
              <Input placeholder="Ex: 7 dias úteis" {...register("prazoEntrega")} />
            </div>
            <div className="space-y-2">
              <FieldLabel icon={CreditCard}>Condições de Pagamento</FieldLabel>
              <Input placeholder="Ex: À vista, 30 dias, etc." {...register("condicoesPagamento")} />
            </div>
            <div className="space-y-2">
              <FieldLabel icon={values.visibilidade === "Privado" ? Lock : Globe2}>
                Visibilidade
              </FieldLabel>
              <Select
                value={values.visibilidade ?? "Global"}
                onValueChange={(v) =>
                  setValue("visibilidade", v as QuoteFormValues["visibilidade"], {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a visibilidade">
                    {(value) => (value === "Privado" ? "Privado" : "Global")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Global">Global (visível para todos)</SelectItem>
                  <SelectItem value="Privado">Privado (visível só para mim)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <FieldLabel icon={FileText}>Status</FieldLabel>
              <Controller control={control} name="status" render={({ field }) => (
                <Select value={field.value ?? "Negociacao"} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Negociacao">Em negociação</SelectItem>
                    <SelectItem value="Enviado">Enviado</SelectItem>
                    <SelectItem value="NaoAprovado">Não aprovado</SelectItem>
                    <SelectItem value="Aprovado">Aprovado</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>
          </CardContent>
        </Card>

        <Card className="py-0 gap-0 rounded-2xl">
          <SectionHeader icon={ListOrdered} title="Itens do Orçamento" description="Lista de produtos ou serviços" />
          <CardContent className="space-y-4 pt-4 pb-5">
          <QuoteItemsTable control={control} register={register} watchItems={itens} setValue={setValue} />
            {errors.itens && !Array.isArray(errors.itens) && (
              <p className="text-sm text-destructive">{errors.itens.message}</p>
            )}

            <div className="flex flex-col items-end gap-3 border-t pt-4">
              <ClosingDiscountField label="Desconto em produtos" typeName="descontoProdutosTipo" valueName="descontoProdutosValor" control={control} currentType={descontoProdutosTipo} />
              <ClosingDiscountField label="Desconto em serviços" typeName="descontoServicosTipo" valueName="descontoServicosValor" control={control} currentType={descontoServicosTipo} />
              <ClosingDiscountField label="Desconto geral" typeName="descontoGeralTipo" valueName="descontoGeralValor" control={control} currentType={descontoGeralTipo} />

              <div className="w-full max-w-xs space-y-1 text-right">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Produtos</span>
                  <span>{formatCurrencyBRL(totalProdutos)}</span>
                </div>
                {descontoProdutos > 0 && <div className="flex items-center justify-between text-sm text-muted-foreground"><span>Desconto produtos</span><span>- {formatCurrencyBRL(descontoProdutos)}</span></div>}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Serviços</span>
                  <span>{formatCurrencyBRL(totalServicos)}</span>
                </div>
                {descontoServicos > 0 && <div className="flex items-center justify-between text-sm text-muted-foreground"><span>Desconto serviços</span><span>- {formatCurrencyBRL(descontoServicos)}</span></div>}
                {descontoGeral > 0 && <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Desconto geral</span>
                  <span>{formatCurrencyBRL(descontoGeral)}</span>
                </div>}
                <div className="flex items-center justify-between border-t pt-1">
                  <span className="text-sm font-medium text-muted-foreground">TOTAL</span>
                  <span className="text-2xl font-bold text-primary">{formatCurrencyBRL(total)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="py-0 gap-0 rounded-2xl">
          <SectionHeader icon={MessageSquareText} title="Observações" description="Observações gerais sobre o orçamento" />
          <CardContent className="pt-4 pb-5">
            <Textarea
              rows={4}
              placeholder="Observações gerais sobre o orçamento..."
              {...register("observacoes")}
            />
          </CardContent>
        </Card>

        <Card className="py-0 gap-0 rounded-2xl">
          <SectionHeader
            icon={StickyNote}
            title="Observações Internas"
            description="Uso interno da equipe — não aparece no orçamento impresso/PDF nem é visível ao cliente"
          />
          <CardContent className="pt-4 pb-5">
            <Textarea
              rows={4}
              placeholder="Anotações internas sobre este orçamento..."
              {...register("observacoesInternas")}
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
      </fieldset>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={isEditing ? "Deseja salvar as alterações?" : "Confirma a criação deste orçamento?"}
        description={isEditing ? "O orçamento será atualizado com os dados informados." : "Um novo orçamento será criado com os dados informados."}
        onConfirm={() => pendingData && confirmAndPersist(pendingData)}
      />

      <ConfirmDialog
        open={reopenConfirmOpen}
        onOpenChange={setReopenConfirmOpen}
        title="Orçamento faturado. Deseja reabrir?"
        description="O status voltará para Em negociação e todos os campos serão liberados para edição."
        confirmLabel="Reabrir"
        onConfirm={handleReopen}
      />

      {selectedClientId && (
        <EditClientDialog
          open={editClientOpen}
          onOpenChange={setEditClientOpen}
          clientId={selectedClientId}
          clientNome={values.clientNome}
          onSaved={(nome) => setValue("clientNome", nome, { shouldValidate: true })}
        />
      )}
    </form>
  );
}
