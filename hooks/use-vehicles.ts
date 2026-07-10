"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  VehicleFormValues,
  combustivelOptions,
  situacaoVeiculoOptions,
} from "@/lib/validations";

export type VehicleRecord = {
  id: string;
  fotoUrl: string | null;
  placa: string;
  marca: string;
  modelo: string;
  versao: string | null;
  ano: number;
  cor: string | null;
  renavam: string | null;
  chassi: string | null;
  combustivel: (typeof combustivelOptions)[number];
  companyId: string;
  kmAtual: number;
  situacao: (typeof situacaoVeiculoOptions)[number];
  dataAquisicao: string | null;
  observacoes: string | null;
  createdAt: string;
  updatedAt: string;
  company: { id: string; razaoSocial: string; nomeFantasia: string | null };
  _count?: { checklists: number; documentos: number; maintenances: number };
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

export function useVehicles(filters?: {
  placa?: string;
  q?: string;
  situacao?: string;
  companyId?: string;
}) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
  }
  return useQuery({
    queryKey: ["vehicles", filters],
    queryFn: () => fetchJson<VehicleRecord[]>(`/api/frota/vehicles?${params.toString()}`),
  });
}

export function useVehicle(id?: string) {
  return useQuery({
    queryKey: ["vehicles", id],
    queryFn: () => fetchJson<VehicleRecord & Record<string, unknown>>(`/api/frota/vehicles/${id}`),
    enabled: !!id,
  });
}

export function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: VehicleFormValues) =>
      fetchJson<VehicleRecord>("/api/frota/vehicles", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      qc.invalidateQueries({ queryKey: ["fleet-dashboard"] });
    },
  });
}

export function useUpdateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: VehicleFormValues }) =>
      fetchJson<VehicleRecord>(`/api/frota/vehicles/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      qc.invalidateQueries({ queryKey: ["fleet-dashboard"] });
    },
  });
}

export function useDeleteVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchJson(`/api/frota/vehicles/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      qc.invalidateQueries({ queryKey: ["fleet-dashboard"] });
    },
  });
}
