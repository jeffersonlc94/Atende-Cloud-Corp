"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientCombobox } from "@/components/clients/client-combobox";
import { QuoteItemsTable } from "./quote-items-table";
import { QuotePrintLayout } from "./quote-print-layout";
import { formatCurrencyBRL } from "@/lib/format";
import { Loader2, Save } from "lucide-react";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function QuoteForm({ initialData }: { initialData?: QuoteRecord }) {
  const router = useRouter();
  const { data: companies = [] } = useCompanies();
  const createQuote = useCreateQuote();
  const updateQuote = useUpdateQuote();

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

  const isSaving = createQuote.isPending || updateQuote.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 xl:grid-cols-2">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados do orçamento</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Número (deixe vazio para gerar automaticamente)</Label>
              <Input placeholder="Ex: 000123" {...register("numero")} />
            </div>
            <div className="space-y-2">
              <Label>Empresa emissora *</Label>
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
            <div className="space-y-2 sm:col-span-2">
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
              <Label>Referência</Label>
              <Input placeholder="Ex: Proposta comercial" {...register("referencia")} />
            </div>
            <div className="space-y-2">
              <Label>Data de emissão *</Label>
              <Input type="date" {...register("dataEmissao")} />
            </div>
            <div className="space-y-2">
              <Label>Validade da proposta (dias)</Label>
              <Input
                type="number"
                min={1}
                {...register("validadeDias", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label>Prazo de entrega</Label>
              <Input placeholder="Ex: 5 dias úteis" {...register("prazoEntrega")} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Condições de pagamento</Label>
              <Input placeholder="Ex: 50% entrada + 50% na entrega" {...register("condicoesPagamento")} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Observações</Label>
              <Textarea rows={3} {...register("observacoes")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Itens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <QuoteItemsTable control={control} register={register} watchItems={values.itens} />
            {errors.itens && !Array.isArray(errors.itens) && (
              <p className="text-sm text-destructive">{errors.itens.message}</p>
            )}
            <div className="flex justify-end border-t pt-4 text-lg font-bold">
              Total: {formatCurrencyBRL(total)}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.push("/orcamentos")}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar orçamento
          </Button>
        </div>
      </div>

      <div className="xl:sticky xl:top-20 xl:self-start">
        <p className="mb-2 text-sm font-medium text-muted-foreground">
          Pré-visualização (impressão A4)
        </p>
        <div className="max-h-[80vh] overflow-y-auto rounded-md border bg-gray-100 p-4 dark:bg-gray-800">
          <QuotePrintLayout
            company={selectedCompany}
            quote={{
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
                valorTotal:
                  (Number(item.quantidade) || 0) * (Number(item.valorUnitario) || 0),
              })),
              total,
            }}
          />
        </div>
      </div>
    </form>
  );
}
