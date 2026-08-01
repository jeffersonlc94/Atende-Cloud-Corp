"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type ClientRecord = {
  id: string;
  nome: string;
};

export function useClientsSearch(query: string) {
  return useQuery({
    queryKey: ["clients", query],
    queryFn: async (): Promise<ClientRecord[]> => {
      const res = await fetch(`/api/clients?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Erro ao buscar clientes");
      return res.json();
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, nome }: { id: string; nome: string }): Promise<ClientRecord> => {
      const res = await fetch(`/api/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? "Erro ao corrigir cliente");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}
