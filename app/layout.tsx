import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Atende Cloud Corp",
  description: "Sistema de gestão - Orçamentos e Frota",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Aplica as cores de personalização salvas ANTES da primeira pintura,
            evitando o "flash" de volta às cores padrão ao recarregar a página
            enquanto as configurações ainda não terminaram de ser buscadas. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=JSON.parse(localStorage.getItem("atende-theme-colors")||"null");if(!s)return;var r=document.documentElement.style;if(s.primaryColor){r.setProperty("--primary",s.primaryColor);r.setProperty("--ring",s.primaryColor);r.setProperty("--sidebar-primary",s.primaryColor);}if(s.sidebarColor){r.setProperty("--sidebar",s.sidebarColor);}if(s.buttonColor){r.setProperty("--button-color",s.buttonColor);}if(s.accentColor){r.setProperty("--accent",s.accentColor);r.setProperty("--sidebar-accent",s.accentColor);}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
