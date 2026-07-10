"use client";

import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
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
  CardDescription,
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

export function QuoteForm({ initialData }: { initialData?: QuoteRecord }) {
  const router = useRouter();
  const { data: session } = useSession();
  const { data: companies = [] } = useCompanies();
  const createQuote = useCreateQuote();
  const updateQuote = useUpdateQuote();
  const [previewing, setPreviewing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingData, setPendingData] = useState<QuoteFormValues | null>(null);

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
          visibilidade: initialData.visibilidade ?? "Global",
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
          visibilidade: "Global",
          itens: [{ ordem: 0, descricao: "", quantidade: 1, valorUnitario: undefined }],
        },
  });

  const values = watch();
  const itens = useWatch({ control, name: "itens" });

  const total = useMemo(() => {
    return (itens ?? []).reduce(
      (acc, item) => acc + (Number(item?.quantidade) || 0) * (Number(item?.valorUnitario) || 0),
      0
    );
  }, [itens]);

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
    if (initialData) {
      setPendingData(data);
      setConfirmOpen(true);
      return;
    }
    await confirmAndPersist(data);
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
              <ClientCombobox
                value={values.clientNome}
                onChange={(nome) => setValue("clientNome", nome, { shouldValidate: true })}
              />
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
              <Input type="date" {...register("dataEmissao")} />
            </div>
            <div className="space-y-2">
              <FieldLabel icon={Clock}>Validade da Proposta (dias)</FieldLabel>
              <Input
                type="number"
                min={1}
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
          </CardContent>
        </Card>

        <Card className="py-0 gap-0 rounded-2xl">
          <SectionHeader icon={ListOrdered} title="Itens do Orçamento" description="Lista de produtos ou serviços" />
          <CardContent className="space-y-4 pt-4 pb-5">
            <QuoteItemsTable control={control} register={register} watchItems={itens} />
            {errors.itens && !Array.isArray(errors.itens) && (
              <p className="text-sm text-destructive">{errors.itens.message}</p>
            )}
            <div className="flex items-center justify-end gap-3 border-t pt-4">
              <span className="text-sm font-medium text-muted-foreground">TOTAL</span>
              <span className="text-2xl font-bold text-primary">{formatCurrencyBRL(total)}</span>
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

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Deseja salvar as alterações?"
        description="O orçamento será atualizado com os dados informados."
        onConfirm={() => pendingData && confirmAndPersist(pendingData)}
      />
    </form>
  );
}
