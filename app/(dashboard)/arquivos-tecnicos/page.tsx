"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Download, FileArchive, FileCog, FileText, FilterX, HardDriveDownload,
  LayoutGrid, List, Loader2, Pencil, Plus, Search, Settings, Tags, Trash2, Upload,
} from "lucide-react";
import { useSystemSettings, useUpdateSystemSettings } from "@/hooks/use-settings";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

type TechnicalType = "Driver" | "Firmware" | "Manual" | "Utilitario" | "Outro";
type Category = { id: string; nome: string };
type TechnicalFile = {
  id: string; nome: string; descricao: string | null; tipo: TechnicalType;
  fabricante: string | null; produto: string; versao: string | null;
  sistemaOperacional: string | null; nomeOriginal: string; tamanhoBytes: number;
  categoryId: string; category: Category; createdByUser: { id: string; name: string } | null;
  createdAt: string; updatedAt: string;
};
type ApiResponse = { items: TechnicalFile[]; filters: { fabricantes: string[]; produtos: string[] } };
type FormState = {
  nome: string; descricao: string; tipo: TechnicalType; fabricante: string;
  produto: string; versao: string; sistemaOperacional: string; categoryId: string;
};

const typeOptions: { value: TechnicalType; label: string; tone: string }[] = [
  { value: "Driver", label: "Driver", tone: "border-sky-200 bg-sky-100 text-sky-800" },
  { value: "Firmware", label: "Firmware", tone: "border-violet-200 bg-violet-100 text-violet-800" },
  { value: "Manual", label: "Manual", tone: "border-amber-200 bg-amber-100 text-amber-900" },
  { value: "Utilitario", label: "Utilitário", tone: "border-emerald-200 bg-emerald-100 text-emerald-800" },
  { value: "Outro", label: "Outro", tone: "border-slate-200 bg-slate-100 text-slate-800" },
];

const emptyForm: FormState = {
  nome: "", descricao: "", tipo: "Driver", fabricante: "", produto: "",
  versao: "", sistemaOperacional: "", categoryId: "",
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

function typeLabel(type: TechnicalType) {
  return typeOptions.find((item) => item.value === type)?.label ?? type;
}

function typeIcon(type: TechnicalType) {
  if (type === "Manual") return FileText;
  if (type === "Driver" || type === "Firmware") return FileCog;
  return FileArchive;
}

export default function TechnicalFilesPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const canAccess = isAdmin || session?.user?.canAccessArquivosTecnicos !== false;
  const { data: settings } = useSystemSettings();
  const updateSettings = useUpdateSystemSettings();
  const [items, setItems] = useState<TechnicalFile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [available, setAvailable] = useState<ApiResponse["filters"]>({ fabricantes: [], produtos: [] });
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [tipo, setTipo] = useState("all");
  const [fabricante, setFabricante] = useState("all");
  const [produto, setProduto] = useState("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TechnicalFile | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<TechnicalFile | null>(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryNames, setCategoryNames] = useState<Record<string, string>>({});
  const [limitsOpen, setLimitsOpen] = useState(false);
  const [maxMb, setMaxMb] = useState("500");

  useEffect(() => {
    const saved = window.localStorage.getItem("technical-files-view");
    if (saved === "grid" || saved === "table") setViewMode(saved);
    try {
      const filters = JSON.parse(window.localStorage.getItem("technical-files-filters") || "{}");
      if (typeof filters.busca === "string") setBusca(filters.busca);
      if (typeof filters.categoryId === "string") setCategoryId(filters.categoryId);
      if (typeof filters.tipo === "string") setTipo(filters.tipo);
      if (typeof filters.fabricante === "string") setFabricante(filters.fabricante);
      if (typeof filters.produto === "string") setProduto(filters.produto);
    } catch { /* preferências inválidas são ignoradas */ }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("technical-files-filters", JSON.stringify({ busca, categoryId, tipo, fabricante, produto }));
  }, [busca, categoryId, fabricante, produto, tipo]);

  useEffect(() => {
    if (settings) setMaxMb(String(settings.technicalFileMaxMb ?? 500));
  }, [settings]);

  const loadCategories = useCallback(async () => {
    const response = await fetch("/api/technical-categories");
    const body = await response.json().catch(() => []);
    if (!response.ok) throw new Error(body.error || "Erro ao carregar categorias");
    setCategories(body);
  }, []);

  const loadFiles = useCallback(async () => {
    if (!canAccess) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (busca.trim()) params.set("busca", busca.trim());
      if (categoryId !== "all") params.set("categoryId", categoryId);
      if (tipo !== "all") params.set("tipo", tipo);
      if (fabricante !== "all") params.set("fabricante", fabricante);
      if (produto !== "all") params.set("produto", produto);
      const response = await fetch(`/api/technical-files?${params}`);
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Erro ao carregar arquivos");
      setItems(body.items ?? []);
      setAvailable(body.filters ?? { fabricantes: [], produtos: [] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao carregar arquivos");
    } finally {
      setLoading(false);
    }
  }, [busca, canAccess, categoryId, fabricante, produto, tipo]);

  useEffect(() => {
    if (!canAccess) return;
    loadCategories().catch((error) => toast.error(error.message));
  }, [canAccess, loadCategories]);

  useEffect(() => {
    const timeout = window.setTimeout(loadFiles, 250);
    return () => window.clearTimeout(timeout);
  }, [loadFiles]);

  const hasFilters = busca || categoryId !== "all" || tipo !== "all" || fabricante !== "all" || produto !== "all";
  const productsForForm = useMemo(() => [...new Set([...available.produtos, ...items.map((item) => item.produto)])].sort(), [available.produtos, items]);
  const manufacturersForForm = useMemo(() => [...new Set([...available.fabricantes, ...items.map((item) => item.fabricante).filter(Boolean) as string[]])].sort(), [available.fabricantes, items]);

  function changeView(mode: "table" | "grid") {
    setViewMode(mode);
    window.localStorage.setItem("technical-files-view", mode);
  }

  function clearFilters() {
    setBusca(""); setCategoryId("all"); setTipo("all"); setFabricante("all"); setProduto("all");
  }

  function openForm(item?: TechnicalFile) {
    setEditing(item ?? null);
    setFile(null);
    setForm(item ? {
      nome: item.nome, descricao: item.descricao ?? "", tipo: item.tipo,
      fabricante: item.fabricante ?? "", produto: item.produto, versao: item.versao ?? "",
      sistemaOperacional: item.sistemaOperacional ?? "", categoryId: item.categoryId,
    } : { ...emptyForm, categoryId: categories[0]?.id ?? "" });
    setFormOpen(true);
  }

  async function save() {
    if (!form.nome.trim() || !form.produto.trim() || !form.categoryId || (!editing && !file)) {
      return toast.error("Preencha nome, categoria, produto e selecione o arquivo");
    }
    setSaving(true);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));
      if (file) payload.append("file", file);
      const response = await fetch(editing ? `/api/technical-files/${editing.id}` : "/api/technical-files", {
        method: editing ? "PUT" : "POST", body: payload,
      });
      const text = await response.text();
      let body: { error?: string } = {};
      try { body = text ? JSON.parse(text) : {}; } catch { /* proxy retornou HTML */ }
      if (!response.ok) throw new Error(body.error || (response.status === 413 ? "Arquivo recusado por tamanho. Verifique também o limite do proxy." : `Falha no envio (HTTP ${response.status})`));
      toast.success(editing ? "Arquivo técnico atualizado" : "Arquivo técnico cadastrado");
      setFormOpen(false);
      await loadFiles();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function createCategory() {
    if (!newCategory.trim()) return;
    const response = await fetch("/api/technical-categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nome: newCategory }) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return toast.error(body.error || "Erro ao criar categoria");
    setNewCategory(""); toast.success("Categoria criada"); await loadCategories();
  }

  async function renameCategory(category: Category) {
    const response = await fetch(`/api/technical-categories/${category.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nome: categoryNames[category.id] ?? category.nome }) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return toast.error(body.error || "Erro ao renomear");
    setEditingCategoryId(null); toast.success("Categoria atualizada"); await loadCategories(); await loadFiles();
  }

  if (session && !canAccess) return <Card><CardContent className="py-16 text-center text-muted-foreground">Você não possui acesso ao módulo Drivers e Arquivos Técnicos.</CardContent></Card>;

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="flex items-center gap-2 text-2xl font-bold"><HardDriveDownload className="h-6 w-6 text-primary" /> Drivers e Arquivos Técnicos</h1><p className="text-sm text-muted-foreground">Biblioteca interna de drivers, firmwares, manuais e utilitários.</p></div>
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center rounded-md border p-0.5"><Button variant={viewMode === "table" ? "secondary" : "ghost"} size="icon" title="Tabela" onClick={() => changeView("table")}><List className="h-4 w-4" /></Button><Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" title="Grade" onClick={() => changeView("grid")}><LayoutGrid className="h-4 w-4" /></Button></div>
        {isAdmin && <><Button variant="outline" onClick={() => { setCategoryNames(Object.fromEntries(categories.map((c) => [c.id, c.nome]))); setCategoriesOpen(true); }}><Tags className="mr-2 h-4 w-4" /> Categorias</Button><Button variant="outline" onClick={() => setLimitsOpen(true)}><Settings className="mr-2 h-4 w-4" /> Limite</Button></>}
        <Button onClick={() => openForm()}><Plus className="mr-2 h-4 w-4" /> Novo arquivo</Button>
      </div>
    </div>

    <Card><CardContent className="grid gap-3 p-4 lg:grid-cols-[minmax(240px,1fr)_200px_180px_200px_220px_auto]">
      <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Nome, descrição, versão ou arquivo" /></div>
      <Select value={categoryId} onValueChange={(value) => value && setCategoryId(value)}><SelectTrigger><SelectValue>{(value) => value === "all" ? "Todas as categorias" : categories.find((c) => c.id === value)?.nome || "Categoria"}</SelectValue></SelectTrigger><SelectContent><SelectItem value="all">Todas as categorias</SelectItem>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent></Select>
      <Select value={tipo} onValueChange={(value) => value && setTipo(value)}><SelectTrigger><SelectValue>{(value) => value === "all" ? "Todos os tipos" : typeLabel(value as TechnicalType)}</SelectValue></SelectTrigger><SelectContent><SelectItem value="all">Todos os tipos</SelectItem>{typeOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>
      <Select value={fabricante} onValueChange={(value) => value && setFabricante(value)}><SelectTrigger><SelectValue>{(value) => value === "all" ? "Todos os fabricantes" : value}</SelectValue></SelectTrigger><SelectContent><SelectItem value="all">Todos os fabricantes</SelectItem>{available.fabricantes.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select>
      <Select value={produto} onValueChange={(value) => value && setProduto(value)}><SelectTrigger><SelectValue>{(value) => value === "all" ? "Todos os produtos" : value}</SelectValue></SelectTrigger><SelectContent><SelectItem value="all">Todos os produtos</SelectItem>{available.produtos.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select>
      <Button variant="outline" size="icon" title="Limpar filtros" disabled={!hasFilters} onClick={clearFilters}><FilterX className="h-4 w-4" /></Button>
    </CardContent></Card>

    {loading ? <div className="py-16 text-center"><Loader2 className="mx-auto h-7 w-7 animate-spin text-primary" /></div> : items.length === 0 ? <Card><CardContent className="py-16 text-center text-muted-foreground">Nenhum arquivo técnico encontrado.</CardContent></Card> : viewMode === "table" ?
      <Card><CardContent className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Categoria</TableHead><TableHead>Produto / modelo</TableHead><TableHead>Nome</TableHead><TableHead>Tipo</TableHead><TableHead>Versão / sistema</TableHead><TableHead>Alterado</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader><TableBody>{items.map((item) => <TableRow key={item.id}><TableCell><Badge variant="secondary">{item.category.nome}</Badge></TableCell><TableCell><p className="font-medium">{item.produto}</p><p className="text-xs text-muted-foreground">{item.fabricante || "Fabricante não informado"}</p></TableCell><TableCell className="max-w-xs"><p className="font-medium">{item.nome}</p><p className="truncate text-xs text-muted-foreground" title={item.nomeOriginal}>{item.nomeOriginal} · {formatBytes(item.tamanhoBytes)}</p></TableCell><TableCell><Badge className={typeOptions.find((option) => option.value === item.tipo)?.tone}>{typeLabel(item.tipo)}</Badge></TableCell><TableCell><p>{item.versao || "—"}</p><p className="text-xs text-muted-foreground">{item.sistemaOperacional || "Todos / não informado"}</p></TableCell><TableCell><p>{new Date(item.updatedAt).toLocaleDateString("pt-BR")}</p><p className="text-xs text-muted-foreground">{item.createdByUser?.name || "—"}</p></TableCell><TableCell><div className="flex justify-end gap-1"><Button size="sm" onClick={() => window.location.assign(`/api/technical-files/${item.id}/download`)}><Download className="mr-2 h-4 w-4" /> Baixar</Button><Button variant="ghost" size="icon-sm" title="Editar" onClick={() => openForm(item)}><Pencil className="h-4 w-4" /></Button>{isAdmin && <Button variant="ghost" size="icon-sm" className="text-destructive" title="Excluir" onClick={() => setDeleting(item)}><Trash2 className="h-4 w-4" /></Button>}</div></TableCell></TableRow>)}</TableBody></Table></div></CardContent></Card>
      : <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{items.map((item) => { const Icon = typeIcon(item.tipo); return <Card key={item.id} className="h-fit overflow-hidden border-t-4 border-t-primary transition-shadow hover:shadow-md"><CardHeader className="bg-primary/5 p-4"><div className="flex items-start justify-between gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span><div className="flex flex-wrap justify-end gap-1"><Badge className={typeOptions.find((option) => option.value === item.tipo)?.tone}>{typeLabel(item.tipo)}</Badge><Badge variant="secondary">{item.category.nome}</Badge></div></div><CardTitle className="mt-3 break-words text-base">{item.nome}</CardTitle></CardHeader><CardContent className="space-y-3 p-4"><div><p className="font-medium">{item.produto}</p><p className="text-xs text-muted-foreground">{item.fabricante || "Fabricante não informado"}</p></div><p className="line-clamp-3 min-h-10 break-words text-sm text-muted-foreground">{item.descricao || "Sem descrição."}</p><div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/50 p-2 text-xs"><span>Versão: <b>{item.versao || "—"}</b></span><span>Tamanho: <b>{formatBytes(item.tamanhoBytes)}</b></span><span className="col-span-2 truncate">Sistema: <b>{item.sistemaOperacional || "Todos / não informado"}</b></span></div><div className="flex items-center justify-between gap-2 border-t pt-3"><Button size="sm" onClick={() => window.location.assign(`/api/technical-files/${item.id}/download`)}><Download className="mr-2 h-4 w-4" /> Baixar</Button><div><Button variant="ghost" size="icon-sm" onClick={() => openForm(item)}><Pencil className="h-4 w-4" /></Button>{isAdmin && <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => setDeleting(item)}><Trash2 className="h-4 w-4" /></Button>}</div></div></CardContent></Card>; })}</div>}

    <Dialog open={formOpen} onOpenChange={setFormOpen}><DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>{editing ? "Editar arquivo técnico" : "Novo arquivo técnico"}</DialogTitle><DialogDescription>Cadastre drivers, firmwares, manuais e demais arquivos utilizados pela equipe técnica.</DialogDescription></DialogHeader><div className="grid gap-4 py-2 sm:grid-cols-2">
      <div className="space-y-2 sm:col-span-2"><Label>Nome *</Label><Input maxLength={160} value={form.nome} onChange={(e) => setForm((current) => ({ ...current, nome: e.target.value }))} placeholder="Ex.: Driver Bematech MP-4200 TH" /></div>
      <div className="space-y-2"><Label>Categoria *</Label><Select value={form.categoryId} onValueChange={(value) => value && setForm((current) => ({ ...current, categoryId: value }))}><SelectTrigger><SelectValue placeholder="Selecione">{(value) => categories.find((c) => c.id === value)?.nome || "Selecione"}</SelectValue></SelectTrigger><SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-2"><Label>Tipo *</Label><Select value={form.tipo} onValueChange={(value) => value && setForm((current) => ({ ...current, tipo: value as TechnicalType }))}><SelectTrigger><SelectValue>{(value) => typeLabel(value as TechnicalType)}</SelectValue></SelectTrigger><SelectContent>{typeOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-2"><Label>Fabricante</Label><Input list="technical-manufacturers" maxLength={100} value={form.fabricante} onChange={(e) => setForm((current) => ({ ...current, fabricante: e.target.value }))} placeholder="Ex.: Epson" /><datalist id="technical-manufacturers">{manufacturersForForm.map((value) => <option key={value} value={value} />)}</datalist></div>
      <div className="space-y-2"><Label>Produto / modelo *</Label><Input list="technical-products" maxLength={160} value={form.produto} onChange={(e) => setForm((current) => ({ ...current, produto: e.target.value }))} placeholder="Ex.: TM-T20X" /><datalist id="technical-products">{productsForForm.map((value) => <option key={value} value={value} />)}</datalist></div>
      <div className="space-y-2"><Label>Versão</Label><Input maxLength={80} value={form.versao} onChange={(e) => setForm((current) => ({ ...current, versao: e.target.value }))} placeholder="Ex.: 3.2.1" /></div>
      <div className="space-y-2"><Label>Sistema operacional</Label><Input maxLength={120} value={form.sistemaOperacional} onChange={(e) => setForm((current) => ({ ...current, sistemaOperacional: e.target.value }))} placeholder="Ex.: Windows 10/11 64 bits" /></div>
      <div className="space-y-2 sm:col-span-2"><div className="flex justify-between"><Label>Descrição</Label><span className="text-xs text-muted-foreground">{form.descricao.length}/500</span></div><Textarea rows={4} maxLength={500} value={form.descricao} onChange={(e) => setForm((current) => ({ ...current, descricao: e.target.value }))} /></div>
      <div className="space-y-2 sm:col-span-2"><Label>Arquivo {editing ? "(opcional para manter o atual)" : "*"}</Label><Input type="file" accept=".zip,.rar,.7z,.exe,.msi,.inf,.cab,.bin,.rom,.fw,.hex,.img,.iso,.pdf,.doc,.docx,.txt,.dmg,.pkg,.deb,.rpm" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />{editing && !file && <p className="text-xs text-muted-foreground">Arquivo atual: {editing.nomeOriginal} ({formatBytes(editing.tamanhoBytes)})</p>}<p className="text-xs text-muted-foreground">Limite atual: {settings?.technicalFileMaxMb ? `${settings.technicalFileMaxMb} MB` : "sem limite no aplicativo"}. Arquivos com nomes iguais não são sobrescritos.</p></div>
      <div className="flex justify-end gap-2 sm:col-span-2"><Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button><Button onClick={save} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}{editing ? "Salvar alterações" : "Enviar e cadastrar"}</Button></div>
    </div></DialogContent></Dialog>

    <Dialog open={categoriesOpen} onOpenChange={setCategoriesOpen}><DialogContent className="max-w-xl"><DialogHeader><DialogTitle>Gerenciar categorias</DialogTitle><DialogDescription>Crie, renomeie ou exclua categorias sem arquivos vinculados.</DialogDescription></DialogHeader><div className="flex gap-2 border-b pb-4"><Input value={newCategory} maxLength={80} onChange={(e) => setNewCategory(e.target.value)} placeholder="Nova categoria" /><Button onClick={createCategory}><Plus className="mr-2 h-4 w-4" /> Criar</Button></div><div className="max-h-[55vh] space-y-2 overflow-y-auto">{categories.map((category) => <div key={category.id} className="flex items-center gap-2 rounded-lg border p-2">{editingCategoryId === category.id ? <><Input value={categoryNames[category.id] ?? category.nome} onChange={(e) => setCategoryNames((current) => ({ ...current, [category.id]: e.target.value }))} /><Button variant="outline" onClick={() => renameCategory(category)}>Salvar</Button></> : <><Badge variant="secondary" className="flex-1 justify-start px-3 py-2 text-sm">{category.nome}</Badge><Button variant="ghost" size="icon-sm" onClick={() => setEditingCategoryId(category.id)}><Pencil className="h-4 w-4" /></Button></>}<Button variant="ghost" size="icon-sm" className="text-destructive" onClick={async () => { const response = await fetch(`/api/technical-categories/${category.id}`, { method: "DELETE" }); const body = await response.json().catch(() => ({})); if (!response.ok) return toast.error(body.error || "Erro ao excluir"); toast.success("Categoria excluída"); await loadCategories(); }}><Trash2 className="h-4 w-4" /></Button></div>)}</div></DialogContent></Dialog>

    <Dialog open={limitsOpen} onOpenChange={setLimitsOpen}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>Limite de upload</DialogTitle><DialogDescription>Defina o tamanho máximo de drivers, firmwares e demais arquivos. Use 0 para não limitar pelo aplicativo.</DialogDescription></DialogHeader><div className="space-y-4"><div className="space-y-2"><Label>Limite por arquivo (MB)</Label><Input type="number" min="0" value={maxMb} onChange={(e) => setMaxMb(e.target.value)} /><p className="text-xs text-muted-foreground">O proxy ou servidor web ainda pode possuir um limite próprio.</p></div><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setLimitsOpen(false)}>Cancelar</Button><Button disabled={updateSettings.isPending} onClick={async () => { try { await updateSettings.mutateAsync({ technicalFileMaxMb: Math.max(0, Number(maxMb) || 0) }); toast.success("Limite atualizado"); setLimitsOpen(false); } catch (error) { toast.error(error instanceof Error ? error.message : "Erro ao salvar limite"); } }}>{updateSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar</Button></div></div></DialogContent></Dialog>

    <ConfirmDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)} title="Excluir este arquivo técnico?" description="O cadastro e o arquivo armazenado serão removidos permanentemente." confirmLabel="Excluir" variant="destructive" onConfirm={async () => { if (!deleting) return; const response = await fetch(`/api/technical-files/${deleting.id}`, { method: "DELETE" }); const body = await response.json().catch(() => ({})); if (!response.ok) toast.error(body.error || "Erro ao excluir"); else { toast.success("Arquivo excluído"); await loadFiles(); } setDeleting(null); }} />
  </div>;
}
