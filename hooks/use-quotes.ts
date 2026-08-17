"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { QuoteFormValues } from "@/lib/validations";

export type QuoteItemRecord = {
  id: string;
  ordem: number;
  tipoItem: "Produto" | "Servico";
  descricao: string;
  fotoUrl: string | null;
  quantidade: string;
  valorUnitario: string;
  calcularPorMargem: boolean;
  custoUnitario: string | null;
  margemLucro: string | null;
  freteHabilitado: boolean;
  freteUnitario: string | null;
  descontoTipo: "Valor" | "Percentual" | null;
  descontoValor: string | null;
  valorTotal: string;
};

export type QuoteRecord = {
  id: string;
  numero: string;
  companyId: string;
  clientId: string;
  referencia: string | null;
  dataEmissao: string;
  dataValidade: string | null;
  validadeDias: number | null;
  condicoesPagamento: string | null;
  prazoEntrega: string | null;
  observacoes: string | null;
  observacoesInternas: string | null;
  fotosInternas: string[];
  subtotal: string | null;
  descontoGeralTipo: "Valor" | "Percentual" | null;
  descontoGeralValor: string | null;
  descontoProdutosTipo: "Valor" | "Percentual" | null;
  descontoProdutosValor: string | null;
  descontoServicosTipo: "Valor" | "Percentual" | null;
  descontoServicosValor: string | null;
  total: string;
  visibilidade: "Global" | "Privado";
  status: "Negociacao" | "Enviado" | "NaoAprovado" | "Aprovado";
  createdByUserId: string | null;
  createdAt: string;
  company: { id: string; razaoSocial: string; nomeFantasia: string | null } & Record<string, unknown>;
  client: { id: string; nome: string };
  createdByUser: { id: string; name: string } | null;
  updatedByUser: { id: string; name: string } | null;
  itens: QuoteItemRecord[];
};

export type QuoteFilters = {
  numero?: string;
  cliente?: string;
  companyId?: string;
  userId?: string;
  dataInicial?: string;
  dataFinal?: string;
  page?: number;
  scope?: "mine" | "global";
  status?: "Negociacao" | "Enviado" | "NaoAprovado" | "Aprovado";
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.formErrors?.[0] || body?.error || "Erro na requisição");
  }
  return res.json();
}

export function useQuotesList(filters: QuoteFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v) params.set(k, String(v));
  });

  return useQuery({
    queryKey: ["quotes", filters],
    queryFn: () =>
      fetchJson<{ items: QuoteRecord[]; total: number; page: number; pageSize: number }>(
        `/api/quotes?${params.toString()}`
      ),
  });
}

export function useQuote(id?: string) {
  return useQuery({
    queryKey: ["quotes", id],
    queryFn: () => fetchJson<QuoteRecord>(`/api/quotes/${id}`),
    enabled: !!id,
  });
}

export function useCreateQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: QuoteFormValues) =>
      fetchJson<QuoteRecord>("/api/quotes", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotes"] });
      qc.invalidateQueries({ queryKey: ["quotes-dashboard"] });
    },
  });
}

export function useUpdateQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: QuoteFormValues }) =>
      fetchJson<QuoteRecord>(`/api/quotes/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotes"] });
      qc.invalidateQueries({ queryKey: ["quotes-dashboard"] });
    },
  });
}

export function useDeleteQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchJson(`/api/quotes/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotes"] });
      qc.invalidateQueries({ queryKey: ["quotes-dashboard"] });
    },
  });
}

export function useDuplicateQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<QuoteRecord>(`/api/quotes/${id}/duplicate`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotes"] });
      qc.invalidateQueries({ queryKey: ["quotes-dashboard"] });
    },
  });
}

export type DashboardStats = {
  totalOrcamentos: number;
  valorTotal: number;
  valorMedio: number;
  totalMes: number;
  quantidadeMes: number;
  totalAno: number;
  quantidadeAno: number;
  ultimosOrcamentos: QuoteRecord[];
  topEmpresas: { companyId: string; nome: string; total: number }[];
  serieMensal: { mes: string; total: number; quantidade: number }[];
};

export function useQuotesDashboard() {
  return useQuery({
    queryKey: ["quotes-dashboard"],
    queryFn: () => fetchJson<DashboardStats>("/api/quotes/dashboard"),
  });
}
