"use client";

import { useEffect, useRef } from "react";
import { signOut, useSession } from "next-auth/react";
import { useSystemSettings } from "@/hooks/use-settings";

const ACTIVITY_EVENTS = ["mousemove", "keydown", "click", "scroll", "touchstart"] as const;

/**
 * Desconecta automaticamente o usuário após N minutos de inatividade,
 * configurável em Configurações > Segurança (SystemSettings.autoLogoutMinutes).
 * Valor 0/nulo desabilita o recurso.
 */
export function useIdleLogout() {
  const { data: session } = useSession();
  const { data: settings } = useSystemSettings();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const minutes = settings?.autoLogoutMinutes;
    if (!session || !minutes || minutes <= 0) {
      return;
    }

    const timeoutMs = minutes * 60 * 1000;

    function resetTimer() {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        signOut({ callbackUrl: "/login" });
      }, timeoutMs);
    }

    resetTimer();
    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, resetTimer));

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [session, settings?.autoLogoutMinutes]);
}
