"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SystemSettingsFormValues } from "@/lib/validations";

export type SystemSettings = {
  id: string;
  systemName: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string | null;
  sidebarColor: string | null;
  buttonColor: string | null;
  accentColor: string | null;
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

export function useSystemSettings() {
  return useQuery({
    queryKey: ["system-settings"],
    queryFn: () => fetchJson<SystemSettings>("/api/settings"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateSystemSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SystemSettingsFormValues) =>
      fetchJson<SystemSettings>("/api/settings", { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["system-settings"] }),
  });
}
