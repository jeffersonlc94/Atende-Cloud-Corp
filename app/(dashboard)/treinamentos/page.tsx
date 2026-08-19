"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { BookOpen, FileText, Film, Loader2, Pencil, Plus, Search, Settings, Tags, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useSystemSettings, useUpdateSystemSettings } from "@/hooks/use-settings";

type Category = { id: string; nome: string };
type Training = { id: string; titulo: string; descricao: string | null; tipo: "Videoaula" | "Documento"; arquivoUrl: string; nomeArquivo: string | null; ordem: number; categoryId: string; category: Category };

export default function TreinamentosPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const canAccess = isAdmin || session?.user?.canAccessTreinamentos !== false;
  const { data: settings } = useSystemSettings();
  const updateSettings = useUpdateSystemSettings();
  const [items, setItems] = useState<Training[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState("Todos");
  const [categoryId, setCategoryId] = useState("Todas");
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [viewer, setViewer] = useState<Training | null>(null);
  const [deleting, setDeleting] = useState<Training | null>(null);
  const [editing, setEditing] = useState<Training | null>(null);
  const [saving, setSaving] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [ordem, setOrdem] = useState("0");
  const [file, setFile] = useState<File | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [categoryNames, setCategoryNames] = useState<Record<string, string>>({});
  const [limitsOpen, setLimitsOpen] = useState(false);
  const [videoMaxMb, setVideoMaxMb] = useState("0");
  const [documentMaxMb, setDocumentMaxMb] = useState("50");

  useEffect(() => {
    if (!settings) return;
    setVideoMaxMb(String(settings.trainingVideoMaxMb ?? 0));
    setDocumentMaxMb(String(settings.trainingDocumentMaxMb ?? 50));
  }, [settings]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (busca) params.set("busca", busca);
      if (tipo !== "Todos") params.set("tipo", tipo);
      if (categoryId !== "Todas") params.set("categoryId", categoryId);
      const [itemsRes, categoriesRes] = await Promise.all([fetch(`/api/trainings?${params}`), fetch("/api/training-categories")]);
      if (!itemsRes.ok || !categoriesRes.ok) throw new Error("Erro ao carregar treinamentos");
      setItems(await itemsRes.json()); setCategories(await categoriesRes.json());
    } catch (error) { toast.error(error instanceof Error ? error.message : "Erro ao carregar"); }
    finally { setLoading(false); }
  }, [busca, categoryId, tipo]);

  useEffect(() => { const timer = setTimeout(load, 250); return () => clearTimeout(timer); }, [load]);

  function openForm(item?: Training) {
    setEditing(item ?? null); setTitulo(item?.titulo ?? ""); setDescricao(item?.descricao ?? "");
    setFormCategory(item?.categoryId ?? categories[0]?.id ?? ""); setOrdem(String(item?.ordem ?? 0)); setFile(null); setFormOpen(true);
  }

  async function addCategory() {
    if (!newCategory.trim()) return;
    const res = await fetch("/api/training-categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nome: newCategory }) });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error(body.error || "Erro ao criar categoria");
    setCategories((current) => [...current, body].sort((a, b) => a.nome.localeCompare(b.nome))); setFormCategory(body.id); setNewCategory(""); toast.success("Categoria criada");
  }

  async function save() {
    if (!titulo.trim() || !formCategory || (!editing && !file)) return toast.error("Preencha título, categoria e arquivo");
    setSaving(true);
    try {
      let upload: { url: string; nomeArquivo: string; tipo: "Videoaula" | "Documento" } | null = null;
      if (file) {
        const data = new FormData(); data.append("file", file);
        const uploadRes = await fetch("/api/training-upload", { method: "POST", body: data });
        const responseText = await uploadRes.text();
        let uploadBody: { url?: string; nomeArquivo?: string; tipo?: "Videoaula" | "Documento"; error?: string } = {};
        try { uploadBody = responseText ? JSON.parse(responseText) : {}; } catch { /* resposta HTML/vazia do proxy */ }
        if (!uploadRes.ok) throw new Error(uploadBody.error || (uploadRes.status === 413 ? "O servidor recusou o arquivo por tamanho. Ajuste o limite do aplicativo e também o limite do proxy/reverse proxy, se houver." : `Falha no upload (HTTP ${uploadRes.status})`));
        if (!uploadBody.url || !uploadBody.nomeArquivo || !uploadBody.tipo) throw new Error("O servidor não retornou os dados do arquivo enviado");
        upload = { url: uploadBody.url, nomeArquivo: uploadBody.nomeArquivo, tipo: uploadBody.tipo };
      }
      const payload = { titulo, descricao, categoryId: formCategory, ordem: Number(ordem) || 0, ...(upload ? { arquivoUrl: upload.url, nomeArquivo: upload.nomeArquivo, tipo: upload.tipo } : { tipo: editing?.tipo }) };
      const res = await fetch(editing ? `/api/trainings/${editing.id}` : "/api/trainings", { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const body = await res.json().catch(() => ({})); if (!res.ok) throw new Error(body.error || "Erro ao salvar");
      toast.success(editing ? "Treinamento atualizado" : "Treinamento cadastrado"); setFormOpen(false); await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Erro ao salvar"); }
    finally { setSaving(false); }
  }

  if (session && !canAccess) return <Card><CardContent className="py-16 text-center text-muted-foreground">Você não possui acesso ao módulo Treinamentos.</CardContent></Card>;

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="flex items-center gap-2 text-2xl font-bold"><BookOpen className="h-6 w-6 text-primary" /> Treinamentos</h1><p className="text-sm text-muted-foreground">Videoaulas e documentos para consulta da equipe</p></div>
      {isAdmin && <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => { setCategoryNames(Object.fromEntries(categories.map((c) => [c.id, c.nome]))); setCategoriesOpen(true); }}><Tags className="mr-2 h-4 w-4" /> Categorias</Button><Button variant="outline" onClick={() => setLimitsOpen(true)}><Settings className="mr-2 h-4 w-4" /> Limites de upload</Button><Button onClick={() => openForm()}><Plus className="mr-2 h-4 w-4" /> Novo conteúdo</Button></div>}
    </div>
    <Card><CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_220px_220px]">
      <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar título ou descrição" className="pl-9" /></div>
      <Select value={tipo} onValueChange={(value) => value && setTipo(value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Todos">Todos os conteúdos</SelectItem><SelectItem value="Videoaula">Videoaulas</SelectItem><SelectItem value="Documento">Documentos</SelectItem></SelectContent></Select>
      <Select value={categoryId} onValueChange={(value) => value && setCategoryId(value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Todas">Todas as categorias</SelectItem>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent></Select>
    </CardContent></Card>
    {loading ? <div className="py-16 text-center"><Loader2 className="mx-auto h-7 w-7 animate-spin text-primary" /></div> : items.length === 0 ? <Card><CardContent className="py-16 text-center text-muted-foreground">Nenhum treinamento encontrado.</CardContent></Card> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map((item) => <Card key={item.id} className="overflow-hidden border-t-4 border-t-primary transition-shadow hover:shadow-md">
      <CardHeader className="bg-primary/5 pb-3"><div className="flex items-start justify-between gap-2"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">{item.tipo === "Videoaula" ? <Film /> : <FileText />}</span><div className="flex gap-1"><Badge variant="outline">{item.tipo}</Badge><Badge variant="secondary">{item.category.nome}</Badge></div></div><CardTitle className="mt-3 text-base">{item.titulo}</CardTitle></CardHeader>
      <CardContent className="space-y-4 pt-4"><p className="line-clamp-3 min-h-10 text-sm text-muted-foreground">{item.descricao || "Sem descrição."}</p><div className="flex items-center justify-between border-t pt-3"><Button size="sm" onClick={() => setViewer(item)}>{item.tipo === "Videoaula" ? "Assistir" : "Abrir documento"}</Button>{isAdmin && <div><Button variant="ghost" size="icon-sm" onClick={() => openForm(item)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => setDeleting(item)}><Trash2 className="h-4 w-4" /></Button></div>}</div></CardContent>
    </Card>)}</div>}

    <Dialog open={!!viewer} onOpenChange={(open) => !open && setViewer(null)}><DialogContent className="h-[92vh] w-[96vw] max-w-none sm:max-w-[96vw] xl:max-w-[1500px]"><DialogHeader><DialogTitle>{viewer?.titulo}</DialogTitle><DialogDescription>{viewer?.category.nome} — {viewer?.tipo}</DialogDescription></DialogHeader><div className="min-h-0 flex-1 overflow-hidden rounded-lg bg-black/90">{viewer?.tipo === "Videoaula" ? <video src={viewer.arquivoUrl} controls className="h-full w-full object-contain" /> : viewer && <iframe src={viewer.arquivoUrl} title={viewer.titulo} className="h-full w-full bg-white" />}</div>{viewer?.tipo === "Documento" && <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => window.open(viewer.arquivoUrl, "_blank")}>Abrir em nova aba / imprimir</Button><a href={viewer.arquivoUrl} download={viewer.nomeArquivo ?? undefined}><Button><Upload className="mr-2 h-4 w-4" /> Baixar</Button></a></div>}</DialogContent></Dialog>

    <Dialog open={formOpen} onOpenChange={setFormOpen}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{editing ? "Editar treinamento" : "Novo treinamento"}</DialogTitle><DialogDescription>Vídeos ficam no volume de uploads; POPs devem ser enviados como Documento PDF.</DialogDescription></DialogHeader><div className="grid gap-4 py-2">
      <div className="space-y-2"><Label>Título *</Label><Input value={titulo} onChange={(e) => setTitulo(e.target.value)} /></div>
      <div className="space-y-2"><Label>Descrição</Label><Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} /></div>
      <div className="grid gap-3 sm:grid-cols-[1fr_120px]"><div className="space-y-2"><Label>Categoria *</Label><Select value={formCategory} onValueChange={(value) => value && setFormCategory(value)}><SelectTrigger><SelectValue placeholder="Selecione">{(value) => categories.find((category) => category.id === value)?.nome || "Selecione"}</SelectValue></SelectTrigger><SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Ordem</Label><Input type="number" value={ordem} onChange={(e) => setOrdem(e.target.value)} /></div></div>
      <div className="flex gap-2"><Input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Nova categoria (ex.: SGBR)" /><Button type="button" variant="outline" onClick={addCategory}>Criar categoria</Button></div>
      {!editing && <div className="space-y-2"><Label>Vídeo ou documento PDF *</Label><Input type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /><p className="text-xs text-muted-foreground">Vídeos: {settings?.trainingVideoMaxMb ? `até ${settings.trainingVideoMaxMb} MB` : "sem limite definido no aplicativo"}; PDFs: até {settings?.trainingDocumentMaxMb ?? 50} MB. O tipo é identificado automaticamente.</p></div>}
      <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button><Button onClick={save} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editing ? "Salvar alterações" : "Enviar e cadastrar"}</Button></div>
    </div></DialogContent></Dialog>

    <Dialog open={categoriesOpen} onOpenChange={setCategoriesOpen}><DialogContent className="max-w-xl"><DialogHeader><DialogTitle>Gerenciar categorias</DialogTitle><DialogDescription>Renomeie as tags ou exclua categorias que não possuem conteúdos vinculados.</DialogDescription></DialogHeader><div className="max-h-[60vh] space-y-2 overflow-y-auto py-2">{categories.map((category) => <div key={category.id} className="flex gap-2 rounded-lg border p-2"><Input value={categoryNames[category.id] ?? category.nome} onChange={(e) => setCategoryNames((current) => ({ ...current, [category.id]: e.target.value }))} /><Button variant="outline" onClick={async () => { const res = await fetch(`/api/training-categories/${category.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nome: categoryNames[category.id] ?? category.nome }) }); const body = await res.json().catch(() => ({})); if (!res.ok) return toast.error(body.error || "Erro ao renomear"); toast.success("Categoria renomeada"); await load(); }}>Salvar</Button><Button variant="ghost" className="text-destructive" onClick={async () => { const res = await fetch(`/api/training-categories/${category.id}`, { method: "DELETE" }); const body = await res.json().catch(() => ({})); if (!res.ok) return toast.error(body.error || "Erro ao excluir"); toast.success("Categoria excluída"); await load(); }}><Trash2 className="h-4 w-4" /></Button></div>)}</div></DialogContent></Dialog>

    <Dialog open={limitsOpen} onOpenChange={setLimitsOpen}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>Limites de upload</DialogTitle><DialogDescription>Defina o tamanho permitido. Use 0 no vídeo para não limitar pelo aplicativo.</DialogDescription></DialogHeader><div className="space-y-4 py-2"><div className="space-y-2"><Label>Limite de vídeo (MB)</Label><Input type="number" min="0" value={videoMaxMb} onChange={(e) => setVideoMaxMb(e.target.value)} /><p className="text-xs text-muted-foreground">0 = sem limite no aplicativo. O proxy ou servidor web ainda pode possuir limite próprio.</p></div><div className="space-y-2"><Label>Limite de documento PDF (MB)</Label><Input type="number" min="1" value={documentMaxMb} onChange={(e) => setDocumentMaxMb(e.target.value)} /></div><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setLimitsOpen(false)}>Cancelar</Button><Button disabled={updateSettings.isPending} onClick={async () => { try { await updateSettings.mutateAsync({ trainingVideoMaxMb: Math.max(0, Number(videoMaxMb) || 0), trainingDocumentMaxMb: Math.max(1, Number(documentMaxMb) || 50) }); toast.success("Limites atualizados"); setLimitsOpen(false); } catch (error) { toast.error(error instanceof Error ? error.message : "Erro ao salvar limites"); } }}>{updateSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar limites</Button></div></div></DialogContent></Dialog>

    <ConfirmDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)} title="Excluir este treinamento?" description="O conteúdo e o arquivo enviado serão removidos." confirmLabel="Excluir" variant="destructive" onConfirm={async () => { if (!deleting) return; const res = await fetch(`/api/trainings/${deleting.id}`, { method: "DELETE" }); if (res.ok) { toast.success("Treinamento excluído"); await load(); } else toast.error("Erro ao excluir"); setDeleting(null); }} />
  </div>;
}
