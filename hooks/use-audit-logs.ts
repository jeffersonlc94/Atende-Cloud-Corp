"use client";

import { useQuery } from "@tanstack/react-query";

export type AuditLogRecord = {
  id: string;
  userId: string | null;
  acao: string;
  entidade: string;
  entidadeId: string | null;
  detalhes: unknown;
  ip: string | null;
  createdAt: string;
  user: { id: string; name: string } | null;
};

export type AuditLogFilters = {
  userId?: string;
  entidade?: string;
  dataInicial?: string;
  dataFinal?: string;
  page?: number;
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || "Erro na requisição");
  }
  return res.json();
}

export function useAuditLogs(filters: AuditLogFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v) params.set(k, String(v));
  });

  return useQuery({
    queryKey: ["audit-logs", filters],
    queryFn: () =>
      fetchJson<{ items: AuditLogRecord[]; total: number; page: number; pageSize: number }>(
        `/api/audit-logs?${params.toString()}`
      ),
  });
}
