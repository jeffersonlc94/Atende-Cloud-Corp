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
    if (settings?.faviconUrl) {
      let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = settings.faviconUrl;
    }
  }, [settings?.faviconUrl]);

  useEffect(() => {
    if (settings?.systemName) {
      document.title = settings.systemName;
    }
  }, [settings?.systemName]);

  return <>{children}</>;
}
