import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { getSystemSettingsForSSR } from "@/lib/system-settings.server";
import { auth } from "@/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DEFAULT_TITLE = "Atende Cloud Corp";

// Força renderização por requisição (nunca estática no build). O Dockerfile
// roda "npm run build" com um DATABASE_URL fictício só para o "prisma
// generate" funcionar — sem isso, uma página estática prerenderizada nesse
// momento congelaria os valores padrão (sem banco real) para sempre, mesmo
// depois do banco de verdade estar disponível em produção.
export const dynamic = "force-dynamic";

// Título e favicon são resolvidos no servidor (a partir do SystemSettings
// salvo no banco) para que já saiam corretos no HTML inicial — depender só
// de um efeito no client (rodando depois do primeiro paint) é o motivo do
// favicon não "grudar" (navegadores cacheiam favicon de forma agressiva e
// só respeitam bem o que já vem no <head> do primeiro carregamento) e do
// "flash" de volta ao padrão a cada F5.
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSystemSettingsForSSR();
  return {
    title: settings?.systemName || DEFAULT_TITLE,
    description: "Sistema de gestão - Orçamentos e Frota",
    icons: settings?.faviconUrl ? { icon: settings.faviconUrl } : undefined,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [settings, session] = await Promise.all([getSystemSettingsForSSR(), auth()]);

  const rootVars = [
    settings?.primaryColor && `--primary:${settings.primaryColor};--ring:${settings.primaryColor};--sidebar-primary:${settings.primaryColor};`,
    settings?.sidebarColor && `--sidebar:${settings.sidebarColor};`,
    settings?.buttonColor && `--button-color:${settings.buttonColor};`,
    settings?.accentColor && `--accent:${settings.accentColor};--sidebar-accent:${settings.accentColor};`,
  ]
    .filter(Boolean)
    .join("");

  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {rootVars && <style dangerouslySetInnerHTML={{ __html: `:root{${rootVars}}` }} />}
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers
          session={session}
          systemSettings={settings ? JSON.parse(JSON.stringify(settings)) : undefined}
        >
          {children}
        </Providers>
      </body>
    </html>
  );
}
