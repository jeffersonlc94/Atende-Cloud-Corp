"use client";

/* eslint-disable @next/next/no-img-element */

import { useRef, useState } from "react";
import { Camera, ClipboardPaste, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MAX_PHOTOS = 3;

type ReportPhoto = { url: string; legenda: string };

export function TechnicalReportPhotos({ photos, onChange }: { photos: ReportPhoto[]; onChange: (photos: ReportPhoto[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function upload(files: File[]) {
    const available = MAX_PHOTOS - photos.length;
    const images = files.filter((file) => file.type.startsWith("image/")).slice(0, available);
    if (!available) return toast.error("O limite é de 3 fotos por laudo");
    if (!images.length) return toast.error("Selecione uma imagem válida");
    setUploading(true);
    try {
      const uploaded: ReportPhoto[] = [];
      for (const file of images) {
        const data = new FormData(); data.append("file", file);
        const response = await fetch("/api/upload", { method: "POST", body: data });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Erro ao enviar foto");
        uploaded.push({ url: body.url, legenda: "" });
      }
      onChange([...photos, ...uploaded].slice(0, MAX_PHOTOS));
      toast.success(uploaded.length === 1 ? "Foto anexada" : `${uploaded.length} fotos anexadas`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Erro ao anexar fotos"); }
    finally { setUploading(false); if (inputRef.current) inputRef.current.value = ""; }
  }

  async function paste() {
    try {
      const items = await navigator.clipboard.read(); const images: File[] = [];
      for (const item of items) { const type = item.types.find((value) => value.startsWith("image/")); if (type) images.push(new File([await item.getType(type)], `foto-laudo.${type.split("/")[1] || "png"}`, { type })); }
      await upload(images);
    } catch { toast.error("Use Ctrl+V sobre a área de fotos para colar a imagem"); }
  }

  return <div className="space-y-3 rounded-xl border border-dashed p-4" tabIndex={0} onPaste={(event) => { const images = Array.from(event.clipboardData.files).filter((file) => file.type.startsWith("image/")); if (images.length) void upload(images); }}>
    <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="flex items-center gap-2 font-medium"><Camera className="h-4 w-4 text-primary" />Fotos do laudo</p><p className="text-xs text-muted-foreground">Até 3 imagens. Selecione arquivos ou cole com Ctrl+V.</p></div>{photos.length < MAX_PHOTOS && <div className="flex gap-2"><Button type="button" variant="outline" size="sm" onClick={paste}><ClipboardPaste className="mr-2 h-4 w-4" />Colar</Button><Button type="button" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>{uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}Anexar foto</Button></div>}</div>
    <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden" onChange={(event) => void upload(Array.from(event.target.files || []))} />
    {photos.length > 0 && <div className={`grid gap-3 ${photos.length === 1 ? "mx-auto max-w-xl grid-cols-1" : "sm:grid-cols-3"}`}>{photos.map((photo, index) => <div key={`${photo.url}-${index}`} className="relative overflow-hidden rounded-lg border bg-muted"><img src={photo.url} alt={`Foto ${index + 1}`} className="h-48 w-full object-contain" /><Button type="button" variant="destructive" size="icon-sm" className="absolute right-2 top-2" onClick={() => onChange(photos.filter((_, current) => current !== index))}><Trash2 className="h-4 w-4" /></Button><div className="space-y-1 border-t bg-background p-2"><p className="text-xs font-semibold">Foto {index + 1}</p><Input value={photo.legenda} maxLength={200} placeholder="Legenda opcional. Ex.: Placa com componente em curto" onChange={(event) => onChange(photos.map((item, current) => current === index ? { ...item, legenda: event.target.value } : item))} /></div></div>)}</div>}
  </div>;
}
