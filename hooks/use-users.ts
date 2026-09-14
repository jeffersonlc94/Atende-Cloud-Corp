"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UserFormValues } from "@/lib/validations";

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  cargo: "TECNICO" | "VENDEDOR" | null;
  canAccessOrcamentos: boolean;
  canAccessFrota: boolean;
  canAccessEstoque: boolean;
  canAccessTreinamentos: boolean;
  canAccessCotacoes: boolean;
  canAccessArquivosTecnicos: boolean;
  canAccessLaudos: boolean;
  receiveNotifications: boolean;
  telegramChatId: string | null;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
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

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: () => fetchJson<AppUser[]>("/api/users"),
  });
}

/**
 * Não há endpoint GET /api/users/:id — reaproveita a listagem já
 * cacheada pelo React Query para obter os dados de um usuário específico
 * (usado na página de edição).
 */
export function useUser(id?: string) {
  const query = useUsers();
  return {
    ...query,
    data: id ? query.data?.find((u) => u.id === id) : undefined,
    isLoading: query.isLoading,
  };
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UserFormValues) =>
      fetchJson<AppUser>("/api/users", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UserFormValues }) =>
      fetchJson<AppUser>(`/api/users/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchJson(`/api/users/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}
