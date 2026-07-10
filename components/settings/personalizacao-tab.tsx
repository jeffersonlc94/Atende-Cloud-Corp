"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useSystemSettings, useUpdateSystemSettings } from "@/hooks/use-settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Palette, Save, Upload } from "lucide-react";

const DEFAULT_SYSTEM_NAME = "Atende Cloud Corp";

const COLOR_FIELDS: {
  key: "primaryColor" | "sidebarColor" | "buttonColor" | "accentColor";
  label: string;
  fallback: string;
  hint: string;
}[] = [
  { key: "primaryColor", label: "Cor principal", fallback: "#16a34a", hint: "Usada em destaques e itens ativos" },
  { key: "sidebarColor", label: "Cor da barra lateral", fallback: "#ffffff", hint: "Fundo da sidebar" },
  { key: "buttonColor", label: "Cor dos botões", fallback: "#16a34a", hint: "Cor de fundo dos botões principais" },
  { key: "accentColor", label: "Cor de destaque", fallback: "#dcfce7", hint: "Usada em fundos de destaque/realce" },
];

export function PersonalizacaoTab() {
  const { data: settings, isLoading } = useSystemSettings();
  const update = useUpdateSystemSettings();

  const [systemName, setSystemName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [colors, setColors] = useState<Record<string, string>>({});
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setSystemName(settings.systemName ?? "");
    setLogoUrl(settings.logoUrl ?? "");
    setFaviconUrl(settings.faviconUrl ?? "");
    setColors({
      primaryColor: settings.primaryColor ?? "",
      sidebarColor: settings.sidebarColor ?? "",
      buttonColor: settings.buttonColor ?? "",
      accentColor: settings.accentColor ?? "",
    });
  }, [settings]);

  async function handleUpload(file: File, kind: "logo" | "favicon") {
    const setUploading = kind === "logo" ? setUploadingLogo : setUploadingFavicon;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error();
      const { url } = await res.json();
      if (kind === "logo") setLogoUrl(url);
      else setFaviconUrl(url);
    } catch {
      toast.error("Erro ao enviar arquivo");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    try {
      await update.mutateAsync({
        systemName,
        logoUrl,
        faviconUrl,
        primaryColor: colors.primaryColor,
        sidebarColor: colors.sidebarColor,
        buttonColor: colors.buttonColor,
        accentColor: colors.accentColor,
      });
      toast.success("Personalização salva com sucesso");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar personalização");
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <CardHeader className="border-b">
          <CardTitle className="text-sm font-semibold">Identidade do sistema</CardTitle>
          <CardDescription>
            Nome e logotipo exibidos no cabeçalho e na barra lateral, no lugar de &quot;
            {DEFAULT_SYSTEM_NAME}&quot;
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 pt-4 pb-5 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Nome do sistema</Label>
            <Input
              placeholder={DEFAULT_SYSTEM_NAME}
              value={systemName}
              onChange={(e) => setSystemName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Logo</Label>
            <div className="flex items-center gap-3">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Logo" className="h-14 w-14 rounded object-contain border" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded border text-xs text-muted-foreground">
                  Sem logo
                </div>
              )}
              <label className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent">
                {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Enviar logo
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file, "logo");
                  }}
                />
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Favicon</Label>
            <div className="flex items-center gap-3">
              {faviconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={faviconUrl} alt="Favicon" className="h-14 w-14 rounded object-contain border" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded border text-xs text-muted-foreground">
                  Sem favicon
                </div>
              )}
              <label className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent">
                {uploadingFavicon ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Enviar favicon
                <input
                  type="file"
                  accept="image/png,image/x-icon,image/svg+xml"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file, "favicon");
                  }}
                />
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              O favicon é aplicado dinamicamente via JavaScript no navegador. O ícone
              estático de <code>app/icon.ico</code> gerado pelo Next.js não é
              substituído automaticamente no build — esta é uma limitação conhecida
              de favicon 100% dinâmico em apps Next.js self-hosted.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Palette className="h-4 w-4" /> Cores do sistema
          </CardTitle>
          <CardDescription>
            As cores são aplicadas imediatamente em toda a aplicação (sidebar, botões e
            destaques) assim que salvas.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 pt-4 pb-5 sm:grid-cols-2 lg:grid-cols-4">
          {COLOR_FIELDS.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label>{field.label}</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={colors[field.key] || field.fallback}
                  onChange={(e) => setColors((c) => ({ ...c, [field.key]: e.target.value }))}
                  className="h-9 w-12 cursor-pointer rounded border"
                />
                <Input
                  value={colors[field.key] || ""}
                  placeholder={field.fallback}
                  onChange={(e) => setColors((c) => ({ ...c, [field.key]: e.target.value }))}
                />
              </div>
              <p className="text-xs text-muted-foreground">{field.hint}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={update.isPending}>
          {update.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Salvar personalização
        </Button>
      </div>
    </div>
  );
}
