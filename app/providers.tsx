"use client";

import { useState } from "react";
import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { SettingsProvider } from "./providers/settings-provider";
import { useIdleLogout } from "@/hooks/use-idle-logout";

function IdleLogoutWatcher() {
  useIdleLogout();
  return null;
}

export function Providers({
  children,
  session,
  systemSettings,
}: {
  children: React.ReactNode;
  session: Session | null;
  systemSettings?: unknown;
}) {
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30 * 1000,
          refetchOnWindowFocus: false,
        },
      },
    });
    // Semeia o cache com o que já foi buscado no servidor (app/layout.tsx),
    // evitando o flash da logo/nome do sistema (placeholder -> real) que
    // aconteceria enquanto o client refaz esse mesmo fetch do zero.
    if (systemSettings) {
      client.setQueryData(["system-settings"], systemSettings);
    }
    return client;
  });

  return (
    <SessionProvider session={session}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <SettingsProvider>{children}</SettingsProvider>
            <IdleLogoutWatcher />
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
