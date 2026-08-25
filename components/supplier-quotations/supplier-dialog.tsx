"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { supplierSchema, type SupplierFormValues } from "@/lib/supplier-quotation-validation";
import { useCreateSupplier, useUpdateSupplier, type SupplierRecord } from "@/hooks/use-supplier-quotations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, X } from "lucide-react";

const empty: SupplierFormValues = { razaoSocial: "", nomeFantasia: "", cnpjCpf: "", telefone: "", email: "", endereco: "", contato: "", observacoes: "" };

export function SupplierDialog({ open, onOpenChange, supplier, onSaved }: { open: boolean; onOpenChange: (open: boolean) => void; supplier?: SupplierRecord | null; onSaved?: (supplier: SupplierRecord) => void }) {
  const create = useCreateSupplier(); const update = useUpdateSupplier();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<SupplierFormValues>({ resolver: zodResolver(supplierSchema), defaultValues: empty });
  useEffect(() => { if (open) reset(supplier ? { ...supplier } : empty); }, [open, supplier, reset]);
  if (!open) return null;
  const saving = create.isPending || update.isPending;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <form className="w-full max-w-md rounded-2xl bg-background p-6 shadow-xl" onSubmit={handleSubmit(async data => {
      try { const saved = supplier ? await update.mutateAsync({ id: supplier.id, data }) : await create.mutateAsync(data); toast.success(supplier ? "Fornecedor atualizado" : "Fornecedor cadastrado"); onSaved?.(saved); onOpenChange(false); } catch (e) { toast.error(e instanceof Error ? e.message : "Erro ao salvar"); }
    })}>
      <div className="mb-5 flex items-center justify-between"><div><h2 className="text-lg font-semibold">{supplier ? "Editar fornecedor" : "Novo fornecedor"}</h2><p className="text-sm text-muted-foreground">Informe somente o nome do fornecedor.</p></div><Button type="button" variant="ghost" size="icon" onClick={() => onOpenChange(false)}><X className="h-4 w-4" /></Button></div>
      <div className="space-y-2"><Label>Nome do fornecedor *</Label><Input autoFocus placeholder="Digite o nome" {...register("razaoSocial")} />{errors.razaoSocial && <p className="text-xs text-destructive">{errors.razaoSocial.message}</p>}</div>
      <div className="mt-6 flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button><Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar fornecedor</Button></div>
    </form>
  </div>;
}
