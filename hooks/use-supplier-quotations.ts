"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SupplierFormValues, SupplierQuotationFormValues } from "@/lib/supplier-quotation-validation";

export type SupplierRecord = SupplierFormValues & { id: string; createdAt: string; updatedAt: string };
export type SupplierQuotationRecord = {
  id: string; numero: string; companyId: string; tipo: "FornecedorUnico" | "MultiplosFornecedores";
  primarySupplierId: string | null; referencia: string | null; dataCotacao: string;
  observacoes: string | null; observacoesInternas: string | null;
  status: "Rascunho" | "EmCotacao" | "Recebida" | "Aprovada" | "NaoAprovada" | "Finalizada";
  total: string; createdAt: string; updatedAt: string;
  company: { id: string; razaoSocial: string; nomeFantasia: string | null; logoUrl?: string | null; cnpj?: string | null; endereco?: string | null; cidade?: string | null; estado?: string | null; telefone1?: string | null; email?: string | null };
  primarySupplier: SupplierRecord | null;
  createdByUser: { id: string; name: string } | null;
  updatedByUser: { id: string; name: string } | null;
  itens: Array<{ id: string; ordem: number; supplierId: string; codigoProduto: string | null; codigoFornecedor: string | null; descricao: string; fotoUrl: string | null; quantidade: string; valorUnitario: string; observacao: string | null; valorTotal: string; supplier: SupplierRecord }>;
};

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(typeof body.error === "string" ? body.error : body.error?.formErrors?.[0] || "Erro na requisição"); }
  return response.json();
}

export function useSuppliers(search = "") { return useQuery({ queryKey: ["suppliers", search], queryFn: () => json<SupplierRecord[]>(`/api/suppliers?search=${encodeURIComponent(search)}`) }); }
export function useSupplier(id?: string) { return useQuery({ queryKey: ["suppliers", id], queryFn: () => json<SupplierRecord>(`/api/suppliers/${id}`), enabled: !!id }); }
export function useCreateSupplier() { const qc = useQueryClient(); return useMutation({ mutationFn: (data: SupplierFormValues) => json<SupplierRecord>("/api/suppliers", { method: "POST", body: JSON.stringify(data) }), onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }) }); }
export function useUpdateSupplier() { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, data }: { id: string; data: SupplierFormValues }) => json<SupplierRecord>(`/api/suppliers/${id}`, { method: "PUT", body: JSON.stringify(data) }), onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }) }); }
export function useDeleteSupplier() { const qc = useQueryClient(); return useMutation({ mutationFn: (id: string) => json(`/api/suppliers/${id}`, { method: "DELETE" }), onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers"] }) }); }

export type SupplierQuotationFilters = { numero?: string; referencia?: string; supplierId?: string; status?: string; tipo?: string; dataInicial?: string; dataFinal?: string };
export function useSupplierQuotations(filters: SupplierQuotationFilters = {}) { const params = new URLSearchParams(); Object.entries(filters).forEach(([k, v]) => v && params.set(k, v)); return useQuery({ queryKey: ["supplier-quotations", filters], queryFn: () => json<SupplierQuotationRecord[]>(`/api/supplier-quotations?${params}`) }); }
export function useSupplierQuotation(id?: string) { return useQuery({ queryKey: ["supplier-quotations", id], queryFn: () => json<SupplierQuotationRecord>(`/api/supplier-quotations/${id}`), enabled: !!id }); }
export function useCreateSupplierQuotation() { const qc = useQueryClient(); return useMutation({ mutationFn: (data: SupplierQuotationFormValues) => json<SupplierQuotationRecord>("/api/supplier-quotations", { method: "POST", body: JSON.stringify(data) }), onSuccess: () => qc.invalidateQueries({ queryKey: ["supplier-quotations"] }) }); }
export function useUpdateSupplierQuotation() { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, data }: { id: string; data: SupplierQuotationFormValues }) => json<SupplierQuotationRecord>(`/api/supplier-quotations/${id}`, { method: "PUT", body: JSON.stringify(data) }), onSuccess: () => qc.invalidateQueries({ queryKey: ["supplier-quotations"] }) }); }
export function useDeleteSupplierQuotation() { const qc = useQueryClient(); return useMutation({ mutationFn: (id: string) => json(`/api/supplier-quotations/${id}`, { method: "DELETE" }), onSuccess: () => qc.invalidateQueries({ queryKey: ["supplier-quotations"] }) }); }
export function useDuplicateSupplierQuotation() { const qc = useQueryClient(); return useMutation({ mutationFn: (id: string) => json<SupplierQuotationRecord>(`/api/supplier-quotations/${id}/duplicate`, { method: "POST" }), onSuccess: () => qc.invalidateQueries({ queryKey: ["supplier-quotations"] }) }); }
