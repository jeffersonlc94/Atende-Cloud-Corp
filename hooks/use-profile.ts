"use client";

import { useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import type { ProfileFormValues } from "@/lib/validations";

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

export function useUpdateProfile() {
  const { update } = useSession();
  return useMutation({
    mutationFn: (data: ProfileFormValues) =>
      fetchJson("/api/profile", { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => update(),
  });
}
