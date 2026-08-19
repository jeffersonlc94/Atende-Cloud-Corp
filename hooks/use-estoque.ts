"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { StockMovementFormValues } from "@/lib/validations";

export type StockMovementRecord = {
  id: string;
  cod: string;
  descricao: string;
  qtd: number;
  respRetirada: string;
  respEntrega: string | null;
  data: string;
  numeroSerie: string | null;
  destino: string | null;
  devolvido: boolean;
  status: string;
  observacoes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StockFilters = {
  q?: string;
  devolvido?: "sim" | "nao" | "";
  status?: string;
  dataInicial?: string;
  dataFinal?: string;
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: init?.body ? { "Content-Type": "application/json", ...init?.headers } : init?.headers,
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      typeof body?.error === "string" ? body.error : "Erro na requisição";
    throw new Error(message);
  }
  return body as T;
}

export function useStockMovements(filters: StockFilters = {}) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.devolvido) params.set("devolvido", filters.devolvido);
  if (filters.status) params.set("status", filters.status);
  if (filters.dataInicial) params.set("dataInicial", filters.dataInicial);
  if (filters.dataFinal) params.set("dataFinal", filters.dataFinal);

  return useQuery({
    queryKey: ["stock-movements", filters],
    queryFn: () => fetchJson<StockMovementRecord[]>(`/api/estoque/movements?${params.toString()}`),
  });
}

export function useStockMovement(id?: string) {
  return useQuery({
    queryKey: ["stock-movement", id],
    queryFn: () => fetchJson<StockMovementRecord>(`/api/estoque/movements/${id}`),
    enabled: !!id,
  });
}

export function useCreateStockMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: StockMovementFormValues) =>
      fetchJson<StockMovementRecord>("/api/estoque/movements", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stock-movements"] }),
  });
}

export function useUpdateStockMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: StockMovementFormValues }) =>
      fetchJson<StockMovementRecord>(`/api/estoque/movements/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stock-movements"] }),
  });
}

export function useDeleteStockMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchJson(`/api/estoque/movements/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stock-movements"] }),
  });
}
