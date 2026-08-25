"use client";

import { useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { supplierQuotationSchema, supplierQuotationStatuses, type SupplierQuotationFormValues } from "@/lib/supplier-quotation-validation";
import { useCreateSupplierQuotation, useSuppliers, useUpdateSupplierQuotation, type SupplierQuotationRecord } from "@/hooks/use-supplier-quotations";
import { SupplierDialog } from "./supplier-dialog";
import { SupplierItemPhotoCell } from "./supplier-item-photo-cell";
import { QuoteInternalPhotos } from "@/components/quotes/quote-internal-photos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, GripVertical, Loader2, MessageSquarePlus, Plus, Printer, Save, ShoppingCart, Trash2, X } from "lucide-react";
import { formatCurrencyBRL } from "@/lib/format";

const statusLabels = { Rascunho: "Rascunho", EmCotacao: "Em cotação", Recebida: "Recebida", Aprovada: "Aprovada", NaoAprovada: "Não aprovada", Finalizada: "Finalizada" } as const;
const emptyItem = { ordem: 0, supplierId: "", codigoProduto: "", codigoFornecedor: "", descricao: "", fotoUrl: "", quantidade: 1, valorUnitario: 0, observacao: "" };

function initialValues(record?: SupplierQuotationRecord): SupplierQuotationFormValues {
  if (!record) return { numero: "", companyId: "", tipo: "FornecedorUnico", primarySupplierId: "", referencia: "", dataCotacao: new Date().toISOString().slice(0, 10), observacoes: "", observacoesInternas: "", fotosInternas: [], status: "EmCotacao", itens: [{ ...emptyItem }] };
  return { numero: record.numero, companyId: "", tipo: record.tipo, primarySupplierId: record.primarySupplierId || "", referencia: record.referencia || "", dataCotacao: record.dataCotacao.slice(0, 10), observacoes: record.observacoes || "", observacoesInternas: record.observacoesInternas || "", fotosInternas: record.fotosInternas || [], status: record.status, itens: record.itens.map((i, index) => ({ ordem: index, supplierId: i.supplierId, codigoProduto: i.codigoProduto || "", codigoFornecedor: i.codigoFornecedor || "", descricao: i.descricao, fotoUrl: i.fotoUrl || "", quantidade: Number(i.quantidade), valorUnitario: Number(i.valorUnitario), observacao: i.observacao || "" })) };
}

export function SupplierQuotationForm({ record }: { record?: SupplierQuotationRecord }) {
  const router = useRouter();
  const suppliersQuery = useSuppliers();
  const create = useCreateSupplierQuotation();
  const update = useUpdateSupplierQuotation();
  const [supplierDialog, setSupplierDialog] = useState(false);
  const [dragged, setDragged] = useState<number | null>(null);
  const [openObservations, setOpenObservations] = useState<Record<number, boolean>>({});
  const { control, register, handleSubmit, setValue, formState: { errors } } = useForm<SupplierQuotationFormValues>({ resolver: zodResolver(supplierQuotationSchema), defaultValues: initialValues(record) });
  const { fields, append, remove, move } = useFieldArray({ control, name: "itens" });
  const values = useWatch({ control });
  const items = values.itens ?? [];
  const tipo = values.tipo ?? "FornecedorUnico";
  const total = items.reduce((sum, item) => sum + (Number(item?.quantidade) || 0) * (Number(item?.valorUnitario) || 0), 0);
  const supplierMap = new Map((suppliersQuery.data ?? []).map(s => [s.id, s]));
  const subtotals = items.reduce<Record<string, number>>((acc, item) => { const id = tipo === "FornecedorUnico" ? values.primarySupplierId || "" : item?.supplierId || ""; acc[id] = (acc[id] || 0) + (Number(item?.quantidade) || 0) * (Number(item?.valorUnitario) || 0); return acc; }, {});
  const saving = create.isPending || update.isPending;

  return <form className="space-y-6 p-6" onSubmit={handleSubmit(async data => {
    try { const saved = record ? await update.mutateAsync({ id: record.id, data }) : await create.mutateAsync(data); toast.success(record ? "Cotação atualizada" : "Cotação criada"); router.push(`/cotacoes/${saved.id}`); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Erro ao salvar cotação"); }
  }, () => toast.error("Revise os campos obrigatórios da cotação."))}>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="flex items-center gap-2 text-2xl font-bold"><ShoppingCart className="h-6 w-6 text-primary" />{record ? `Cotação Nº ${record.numero}` : "Nova Cotação"}</h1><p className="text-sm text-muted-foreground">Cotação de compras com um ou vários fornecedores.</p></div>
      <div className="flex gap-2"><Button type="button" variant="outline" onClick={() => router.push("/cotacoes")}><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Button>{record && <Button type="button" variant="outline" onClick={() => router.push(`/cotacoes/${record.id}/imprimir`)}><Printer className="mr-2 h-4 w-4" />Imprimir</Button>}<Button type="submit" disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Salvar cotação</Button></div>
    </div>

    <section className="rounded-2xl border bg-card shadow-sm">
      <div className="border-b px-5 py-4"><h2 className="font-semibold">Dados da cotação</h2></div>
      <div className="grid gap-4 p-5 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2"><Label>Número</Label><Input placeholder="Automático" {...register("numero")} /></div>
        <div className="space-y-2"><Label>Data *</Label><Input type="date" {...register("dataCotacao")} /></div>
        <div className="space-y-2"><Label>Tipo de cotação *</Label><Controller control={control} name="tipo" render={({ field }) => <Select value={field.value} onValueChange={field.onChange}><SelectTrigger><SelectValue>{value => value === "MultiplosFornecedores" ? "Vários fornecedores" : "Fornecedor único"}</SelectValue></SelectTrigger><SelectContent><SelectItem value="FornecedorUnico">Fornecedor único</SelectItem><SelectItem value="MultiplosFornecedores">Vários fornecedores</SelectItem></SelectContent></Select>} /></div>
        {tipo === "FornecedorUnico" && <div className="space-y-2"><Label>Fornecedor *</Label><div className="flex gap-2"><Controller control={control} name="primarySupplierId" render={({ field }) => <Select value={field.value} onValueChange={field.onChange}><SelectTrigger className="flex-1"><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{suppliersQuery.data?.map(s => <SelectItem key={s.id} value={s.id}>{s.razaoSocial}</SelectItem>)}</SelectContent></Select>} /><Button type="button" variant="outline" size="icon" onClick={() => setSupplierDialog(true)}><Plus className="h-4 w-4" /></Button></div>{errors.primarySupplierId && <p className="text-xs text-destructive">{errors.primarySupplierId.message}</p>}</div>}
        <div className="space-y-2"><Label>Status</Label><Controller control={control} name="status" render={({ field }) => <Select value={field.value} onValueChange={field.onChange}><SelectTrigger><SelectValue>{value => statusLabels[value as keyof typeof statusLabels] || value}</SelectValue></SelectTrigger><SelectContent>{supplierQuotationStatuses.map(s => <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>)}</SelectContent></Select>} /></div>
        <div className="space-y-2 md:col-span-2 lg:col-span-3"><Label>Referência / Assunto</Label><Input placeholder="Ex.: Compra de equipamentos" {...register("referencia")} /></div>
      </div>
    </section>

    <section className="rounded-2xl border bg-card shadow-sm">
      <div className="border-b px-5 py-4"><h2 className="font-semibold">Itens da cotação</h2><p className="text-xs text-muted-foreground">Arraste pela alça para reorganizar.</p></div>
      <div className="overflow-x-auto"><table className="min-w-[1320px] w-full text-sm">
        <thead className="bg-muted/40 text-left"><tr><th className="w-16 p-3">#</th><th className="w-16 p-3">Foto</th>{tipo === "MultiplosFornecedores" && <th className="w-52 p-3">Fornecedor *</th>}<th className="w-28 p-3">Cód. produto</th><th className="w-32 p-3">Cód. fornecedor</th><th className="p-3">Descrição *</th><th className="w-24 p-3">Qtd. *</th><th className="w-36 p-3">Valor unit. *</th><th className="w-32 p-3 text-right">Total</th><th className="w-12" /></tr></thead>
        <tbody>{fields.map((field, index) => { const item = items[index]; const lineTotal = (Number(item?.quantidade) || 0) * (Number(item?.valorUnitario) || 0); const observationOpen = openObservations[index] || Boolean(item?.observacao); return <tr key={field.id} className="border-t align-top" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (dragged !== null && dragged !== index) { move(dragged, index); fields.forEach((_, i) => setValue(`itens.${i}.ordem`, i, { shouldDirty: true })); } setDragged(null); }}>
          <td className="p-3"><div className="flex items-center gap-1"><button type="button" draggable onDragStart={e => { setDragged(index); e.dataTransfer.effectAllowed = "move"; }} onDragEnd={() => setDragged(null)} className="cursor-grab rounded p-1 text-muted-foreground hover:bg-muted"><GripVertical className="h-4 w-4" /></button>{index + 1}</div></td>
          <td className="p-2"><SupplierItemPhotoCell control={control} index={index} /></td>
          {tipo === "MultiplosFornecedores" && <td className="p-2"><Controller control={control} name={`itens.${index}.supplierId`} render={({ field }) => <Select value={field.value} onValueChange={field.onChange}><SelectTrigger><SelectValue placeholder="Fornecedor" /></SelectTrigger><SelectContent>{suppliersQuery.data?.map(s => <SelectItem key={s.id} value={s.id}>{s.razaoSocial}</SelectItem>)}</SelectContent></Select>} /></td>}
          <td className="p-2"><Input {...register(`itens.${index}.codigoProduto`)} /></td><td className="p-2"><Input {...register(`itens.${index}.codigoFornecedor`)} /></td>
          <td className="p-2"><div className="flex gap-1"><Input placeholder="Descrição do item" {...register(`itens.${index}.descricao`)} /><Button type="button" variant={observationOpen ? "secondary" : "ghost"} size="icon" onClick={() => setOpenObservations(current => ({ ...current, [index]: !observationOpen }))}>{observationOpen ? <X className="h-4 w-4" /> : <MessageSquarePlus className="h-4 w-4" />}</Button></div>{observationOpen && <Textarea rows={2} maxLength={500} className="mt-2 min-h-14 resize-y text-xs" placeholder="Observação opcional do item" {...register(`itens.${index}.observacao`)} />}</td>
          <td className="p-2"><Input type="number" min="0.001" step="0.001" {...register(`itens.${index}.quantidade`, { valueAsNumber: true })} /></td><td className="p-2"><Controller control={control} name={`itens.${index}.valorUnitario`} render={({ field }) => <CurrencyInput value={field.value} onValueChange={field.onChange} onBlur={field.onBlur} />} /></td><td className="p-3 text-right font-medium">{formatCurrencyBRL(lineTotal)}</td><td><Button type="button" variant="ghost" size="icon" disabled={fields.length === 1} onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button></td>
        </tr>; })}</tbody>
      </table></div>
      <div className="border-t px-5 py-3"><Button type="button" variant="outline" size="sm" onClick={() => append({ ...emptyItem, ordem: fields.length })}><Plus className="mr-1 h-4 w-4" />Adicionar item</Button></div>
      <div className="border-t p-5"><div className="ml-auto max-w-sm space-y-2">{tipo === "MultiplosFornecedores" && Object.entries(subtotals).filter(([id]) => id).map(([id, value]) => <div key={id} className="flex justify-between text-sm"><span>{supplierMap.get(id)?.razaoSocial || "Fornecedor"}</span><span>{formatCurrencyBRL(value)}</span></div>)}<div className="flex justify-between border-t pt-3 text-lg font-bold text-primary"><span>TOTAL</span><span>{formatCurrencyBRL(total)}</span></div></div></div>
    </section>

    <section className="grid gap-5 md:grid-cols-2"><div className="rounded-2xl border bg-card p-5 shadow-sm"><Label>Observações</Label><Textarea className="mt-2" rows={5} {...register("observacoes")} /></div><div className="rounded-2xl border bg-card p-5 shadow-sm"><Label>Observações internas</Label><p className="mb-2 text-xs text-muted-foreground">Não aparecem no PDF.</p><Textarea rows={5} {...register("observacoesInternas")} /></div></section>
    <section className="rounded-2xl border bg-card p-5 shadow-sm"><QuoteInternalPhotos photos={values.fotosInternas ?? []} onChange={photos => setValue("fotosInternas", photos, { shouldDirty: true })} /></section>
    <SupplierDialog open={supplierDialog} onOpenChange={setSupplierDialog} onSaved={supplier => setValue("primarySupplierId", supplier.id, { shouldValidate: true })} />
  </form>;
}
