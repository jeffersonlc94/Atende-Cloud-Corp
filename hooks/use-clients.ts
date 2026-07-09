"use client";

import { useQuery } from "@tanstack/react-query";

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
