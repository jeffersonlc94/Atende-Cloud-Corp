"use client";

import { useRef, useState } from "react";
import { Controller, type Control } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FotoThumb } from "@/components/shared/foto-thumb";
import { Camera, ClipboardPaste, Loader2, Paperclip, X } from "lucide-react";
import type { SupplierQuotationFormValues } from "@/lib/supplier-quotation-validation";

export function SupplierItemPhotoCell({ control, index }: { control: Control<SupplierQuotationFormValues>; index: number }) {
  const [uploading, setUploading] = useState(false); const [open, setOpen] = useState(false); const inputRef = useRef<HTMLInputElement>(null);
  return <Controller control={control} name={`itens.${index}.fotoUrl`} render={({ field }) => {
    async function upload(file?: File) { if (!file) return; setUploading(true); try { const data = new FormData(); data.append("file", file); const response = await fetch("/api/upload", { method: "POST", body: data }); const body = await response.json().catch(() => ({})); if (!response.ok) throw new Error(body.error || "Erro ao enviar foto"); field.onChange(body.url); setOpen(false); } catch (e) { toast.error(e instanceof Error ? e.message : "Erro ao enviar foto"); } finally { setUploading(false); } }
    async function paste() { try { for (const item of await navigator.clipboard.read()) { const type = item.types.find(t => t.startsWith("image/")); if (type) { const blob = await item.getType(type); await upload(new File([blob], `imagem.${type.split("/")[1] || "png"}`, { type })); return; } } toast.error("Nenhuma imagem encontrada"); } catch { toast.warning("O navegador não permitiu acessar a imagem copiada."); } }
    return <div className="flex justify-center">{field.value ? <div className="relative"><FotoThumb url={field.value} alt="Foto do item" className="h-10 w-10" /><button type="button" className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-white" onClick={() => field.onChange("")}><X className="h-3 w-3" /></button></div> : <Popover open={open} onOpenChange={setOpen}><PopoverTrigger type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-md border">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}</PopoverTrigger><PopoverContent className="w-52 space-y-1 p-2"><Button type="button" variant="ghost" className="w-full justify-start" onClick={paste}><ClipboardPaste className="mr-2 h-4 w-4" />Colar imagem</Button><Button type="button" variant="ghost" className="w-full justify-start" onClick={() => inputRef.current?.click()}><Paperclip className="mr-2 h-4 w-4" />Anexar arquivo</Button><input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={e => { void upload(e.target.files?.[0]); e.target.value = ""; }} /></PopoverContent></Popover>}</div>;
  }} />;
}
