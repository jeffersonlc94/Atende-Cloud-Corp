"use client";

import { useRef, useState } from "react";
import { Camera, Eye, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FotoThumb } from "@/components/shared/foto-thumb";

export function QuoteInternalPhotos({ photos, onChange, disabled }: { photos: string[]; onChange: (photos: string[]) => void; disabled?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch("/api/upload", { method: "POST", body: formData });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || `Erro ao enviar ${file.name}`);
        uploaded.push(body.url);
      }
      onChange([...photos, ...uploaded]);
      toast.success(uploaded.length === 1 ? "Foto anexada" : `${uploaded.length} fotos anexadas`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao anexar fotos");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden" onChange={(event) => upload(event.target.files)} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Fotos anexadas</p>
          <p className="text-xs text-muted-foreground">Controle interno — não aparecem no orçamento impresso ou PDF.</p>
        </div>
        {!disabled && <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
          Anexar fotos
        </Button>}
      </div>
      {photos.length === 0 ? (
        <button type="button" disabled={disabled || uploading} onClick={() => inputRef.current?.click()} className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-6 text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-muted/40 disabled:pointer-events-none">
          <Camera className="h-7 w-7" /><span>Nenhuma foto anexada</span>
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {photos.map((url, index) => (
            <div key={`${url}-${index}`} className="group overflow-hidden rounded-xl border bg-muted/30">
              <button type="button" className="block w-full" onClick={() => setViewing(url)} title="Visualizar foto">
                <FotoThumb url={url} alt={`Foto interna ${index + 1}`} className="h-28 w-full rounded-none object-cover" />
              </button>
              <div className="flex items-center justify-between gap-1 border-t p-1.5">
                <span className="truncate px-1 text-xs text-muted-foreground">Foto {index + 1}</span>
                <div className="flex">
                  <Button type="button" variant="ghost" size="icon-sm" title="Visualizar" onClick={() => setViewing(url)}><Eye className="h-3.5 w-3.5" /></Button>
                  {!disabled && <Button type="button" variant="ghost" size="icon-sm" title="Remover" className="text-destructive" onClick={() => onChange(photos.filter((_, photoIndex) => photoIndex !== index))}><Trash2 className="h-3.5 w-3.5" /></Button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="h-[90vh] w-[96vw] max-w-none overflow-hidden sm:max-w-[96vw] xl:max-w-[1400px]">
          <DialogHeader><DialogTitle>Foto interna do orçamento</DialogTitle><DialogDescription>Imagem anexada para controle interno da equipe.</DialogDescription></DialogHeader>
          {viewing && <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto rounded-lg bg-black/90 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={viewing} alt="Foto interna ampliada" className="max-h-full max-w-full object-contain" />
          </div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
