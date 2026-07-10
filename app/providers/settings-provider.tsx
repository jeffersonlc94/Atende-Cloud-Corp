"use client";

import { useEffect } from "react";
import { useSystemSettings } from "@/hooks/use-settings";

/**
 * Aplica dinamicamente as cores de personalização (SystemSettings) como
 * CSS custom properties no :root, sobrepondo os valores padrão do globals.css.
 *
 * Isso permite trocar a cor principal, da barra lateral, dos botões e de
 * destaque sem precisar rebuildar o CSS — o usuário administrador altera em
 * Configurações > Personalização e o efeito é imediato em toda a aplicação.
 */
export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { data: settings } = useSystemSettings();

  // O primeiro carregamento/F5 já vem correto via SSR (app/layout.tsx lê o
  // SystemSettings direto do banco). Este provider só existe para refletir
  // mudanças em tempo real quando o admin salva uma alteração em
  // Configurações, sem precisar recarregar a página inteira.
  useEffect(() => {
    const root = document.documentElement;

    if (settings?.primaryColor) {
      root.style.setProperty("--primary", settings.primaryColor);
      root.style.setProperty("--ring", settings.primaryColor);
      root.style.setProperty("--sidebar-primary", settings.primaryColor);
    } else {
      root.style.removeProperty("--primary");
      root.style.removeProperty("--ring");
      root.style.removeProperty("--sidebar-primary");
    }

    if (settings?.sidebarColor) {
      root.style.setProperty("--sidebar", settings.sidebarColor);
    } else {
      root.style.removeProperty("--sidebar");
    }

    if (settings?.buttonColor) {
      root.style.setProperty("--button-color", settings.buttonColor);
    } else {
      root.style.removeProperty("--button-color");
    }

    if (settings?.accentColor) {
      root.style.setProperty("--accent", settings.accentColor);
      root.style.setProperty("--sidebar-accent", settings.accentColor);
    } else {
      root.style.removeProperty("--accent");
      root.style.removeProperty("--sidebar-accent");
    }
  }, [settings]);

  useEffect(() => {
    if (!settings?.faviconUrl) return;
    // Remove todos os <link rel="icon"> existentes (incluindo o estático
    // gerado pelo Next a partir de app/favicon.ico) e cria um elemento NOVO
    // — trocar apenas o href de um link já existente é frequentemente
    // ignorado pelo cache de favicon dos navegadores, que só reage de forma
    // confiável a um elemento recém-inserido no DOM.
    document.querySelectorAll<HTMLLinkElement>("link[rel~='icon']").forEach((el) => el.remove());
    const link = document.createElement("link");
    link.rel = "icon";
    link.href = settings.faviconUrl;
    document.head.appendChild(link);
  }, [settings?.faviconUrl]);

  useEffect(() => {
    if (settings?.systemName) {
      document.title = settings.systemName;
    }
  }, [settings?.systemName]);

  return <>{children}</>;
}
