"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Download, ExternalLink, Eye, FileArchive, FileCog, FileText, FilterX, HardDriveDownload,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
type OptionKind = "Fabricante" | "Produto" | "SistemaOperacional";
type TechnicalOption = { id: string; kind: OptionKind; nome: string };
type FormState = {
  nome: string; descricao: string; tipo: TechnicalType; fabricante: string;
  produto: string; versao: string; sistemaOperacional: string; categoryId: string;
};
type QuickCreateKind = "Categoria" | OptionKind;

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

function isPdf(item: TechnicalFile) {
  return item.nomeOriginal.toLowerCase().endsWith(".pdf");
}

export default function TechnicalFilesPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const canAccess = isAdmin || session?.user?.canAccessArquivosTecnicos !== false;
  const { data: settings } = useSystemSettings();
  const updateSettings = useUpdateSystemSettings();
  const [items, setItems] = useState<TechnicalFile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [technicalOptions, setTechnicalOptions] = useState<TechnicalOption[]>([]);
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
  const [newOptionNames, setNewOptionNames] = useState<Record<OptionKind, string>>({ Fabricante: "", Produto: "", SistemaOperacional: "" });
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  const [optionNames, setOptionNames] = useState<Record<string, string>>({});
  const [limitsOpen, setLimitsOpen] = useState(false);
  const [maxMb, setMaxMb] = useState("500");
  const [viewer, setViewer] = useState<TechnicalFile | null>(null);
  const [quickCreateKind, setQuickCreateKind] = useState<QuickCreateKind | null>(null);
  const [quickCreateName, setQuickCreateName] = useState("");
  const [quickCreating, setQuickCreating] = useState(false);

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
    const response = await fetch("/api/technical-categories", { cache: "no-store" });
    const body = await response.json().catch(() => []);
    if (!response.ok) throw new Error(body.error || "Erro ao carregar categorias");
    setCategories(body);
  }, []);

  const loadOptions = useCallback(async () => {
    const response = await fetch("/api/technical-options", { cache: "no-store" });
    const body = await response.json().catch(() => []);
    if (!response.ok) throw new Error(body.error || "Erro ao carregar os cadastros auxiliares");
    setTechnicalOptions(body);
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
      const response = await fetch(`/api/technical-files?${params}`, { cache: "no-store" });
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
    Promise.all([loadCategories(), loadOptions()]).catch((error) => toast.error(error.message));
  }, [canAccess, loadCategories, loadOptions]);

  useEffect(() => {
    const timeout = window.setTimeout(loadFiles, 250);
    return () => window.clearTimeout(timeout);
  }, [loadFiles]);

  const hasFilters = busca || categoryId !== "all" || tipo !== "all" || fabricante !== "all" || produto !== "all";
  const productsForForm = useMemo(() => [...new Set([...technicalOptions.filter((option) => option.kind === "Produto").map((option) => option.nome), ...available.produtos, ...items.map((item) => item.produto)])].sort(), [available.produtos, items, technicalOptions]);
  const manufacturersForForm = useMemo(() => [...new Set([...technicalOptions.filter((option) => option.kind === "Fabricante").map((option) => option.nome), ...available.fabricantes, ...items.map((item) => item.fabricante).filter(Boolean) as string[]])].sort(), [available.fabricantes, items, technicalOptions]);
  const systemsForForm = useMemo(() => technicalOptions.filter((option) => option.kind === "SistemaOperacional").map((option) => option.nome), [technicalOptions]);

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

  async function createOption(kind: OptionKind) {
    const nome = newOptionNames[kind].trim();
    if (!nome) return;
    const response = await fetch("/api/technical-options", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, nome }) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) { await loadOptions(); return toast.error(body.error || "Erro ao criar cadastro"); }
    setNewOptionNames((current) => ({ ...current, [kind]: "" })); toast.success("Cadastro criado"); await loadOptions();
  }

  function openQuickCreate(kind: QuickCreateKind) {
    setQuickCreateKind(kind);
    setQuickCreateName("");
  }

  async function createQuickOption() {
    const nome = quickCreateName.trim();
    if (!quickCreateKind || !nome) return;
    setQuickCreating(true);
    try {
      const isCategory = quickCreateKind === "Categoria";
      const response = await fetch(isCategory ? "/api/technical-categories" : "/api/technical-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isCategory ? { nome } : { kind: quickCreateKind, nome }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Erro ao criar cadastro");
      if (isCategory) {
        await loadCategories();
        setForm((current) => ({ ...current, categoryId: body.id }));
      } else {
        await loadOptions();
        const field = quickCreateKind === "Fabricante" ? "fabricante" : quickCreateKind === "Produto" ? "produto" : "sistemaOperacional";
        setForm((current) => ({ ...current, [field]: body.nome }));
      }
      toast.success("Cadastro criado e selecionado");
      setQuickCreateKind(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao criar cadastro");
    } finally {
      setQuickCreating(false);
    }
  }

  async function renameOption(option: TechnicalOption) {
    const response = await fetch(`/api/technical-options/${option.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nome: optionNames[option.id] ?? option.nome }) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return toast.error(body.error || "Erro ao renomear");
    setEditingOptionId(null); toast.success("Cadastro e arquivos vinculados atualizados"); await loadOptions(); await loadFiles();
  }

  function optionManager(kind: OptionKind, label: string, placeholder: string) {
    const options = technicalOptions.filter((option) => option.kind === kind);
    return <div className="space-y-4 pt-3">
      <div className="flex gap-2"><Input value={newOptionNames[kind]} maxLength={160} onChange={(e) => setNewOptionNames((current) => ({ ...current, [kind]: e.target.value }))} placeholder={placeholder} /><Button onClick={() => createOption(kind)}><Plus className="mr-2 h-4 w-4" /> Criar</Button></div>
      <p className="text-xs text-muted-foreground">Ao renomear, todos os arquivos que usam este {label.toLowerCase()} serão atualizados.</p>
      <div className="grid max-h-[48vh] gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">{options.length === 0 ? <p className="col-span-full rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">Nenhum cadastro encontrado.</p> : options.map((option) => <div key={option.id} className="flex min-w-0 items-center gap-2 rounded-xl border bg-card p-3 shadow-sm">{editingOptionId === option.id ? <><Input autoFocus className="min-w-0" value={optionNames[option.id] ?? option.nome} onChange={(e) => setOptionNames((current) => ({ ...current, [option.id]: e.target.value }))} /><Button size="sm" variant="outline" onClick={() => renameOption(option)}>Salvar</Button></> : <><span className="min-w-0 flex-1 truncate text-sm font-medium" title={option.nome}>{option.nome}</span><Button variant="ghost" size="icon-sm" title={`Editar ${label.toLowerCase()}`} onClick={() => { setOptionNames((current) => ({ ...current, [option.id]: option.nome })); setEditingOptionId(option.id); }}><Pencil className="h-4 w-4" /></Button></>}<Button variant="ghost" size="icon-sm" className="text-destructive" title={`Excluir ${label.toLowerCase()}`} onClick={async () => { const response = await fetch(`/api/technical-options/${option.id}`, { method: "DELETE" }); const body = await response.json().catch(() => ({})); if (!response.ok) return toast.error(body.error || "Erro ao excluir"); toast.success("Cadastro excluído da lista"); await loadOptions(); }}><Trash2 className="h-4 w-4" /></Button></div>)}</div>
    </div>;
  }

  if (session && !canAccess) return <Card><CardContent className="py-16 text-center text-muted-foreground">Você não possui acesso ao módulo Drivers e Arquivos Técnicos.</CardContent></Card>;

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="flex items-center gap-2 text-2xl font-bold"><HardDriveDownload className="h-6 w-6 text-primary" /> Drivers e Arquivos Técnicos</h1><p className="text-sm text-muted-foreground">Biblioteca interna de drivers, firmwares, manuais e utilitários.</p></div>
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center rounded-md border p-0.5"><Button variant={viewMode === "table" ? "secondary" : "ghost"} size="icon" title="Tabela" onClick={() => changeView("table")}><List className="h-4 w-4" /></Button><Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" title="Grade" onClick={() => changeView("grid")}><LayoutGrid className="h-4 w-4" /></Button></div>
        {isAdmin && <><Button variant="outline" onClick={() => { setCategoryNames(Object.fromEntries(categories.map((c) => [c.id, c.nome]))); setOptionNames(Object.fromEntries(technicalOptions.map((option) => [option.id, option.nome]))); setCategoriesOpen(true); }}><Tags className="mr-2 h-4 w-4" /> Cadastros</Button><Button variant="outline" onClick={() => setLimitsOpen(true)}><Settings className="mr-2 h-4 w-4" /> Limite</Button></>}
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
      <Card><CardContent className="p-0"><div className="overflow-x-auto"><Table className="min-w-[1180px] table-fixed"><TableHeader><TableRow><TableHead className="w-[140px]">Categoria</TableHead><TableHead className="w-[160px]">Produto / modelo</TableHead><TableHead className="w-[410px]">Nome</TableHead><TableHead className="w-[115px]">Tipo</TableHead><TableHead className="w-[175px]">Versão / sistema</TableHead><TableHead className="w-[155px]">Alterado</TableHead><TableHead className="w-[205px] text-right">Ações</TableHead></TableRow></TableHeader><TableBody>{items.map((item) => <TableRow key={item.id}><TableCell className="overflow-hidden"><Badge variant="secondary" className="max-w-full truncate">{item.category.nome}</Badge></TableCell><TableCell className="overflow-hidden"><p className="truncate font-medium" title={item.produto}>{item.produto}</p><p className="truncate text-xs text-muted-foreground" title={item.fabricante || undefined}>{item.fabricante || "Fabricante não informado"}</p></TableCell><TableCell className="overflow-hidden"><p className="truncate font-medium" title={item.nome}>{item.nome}</p><p className="truncate text-xs text-muted-foreground" title={item.nomeOriginal}>{item.nomeOriginal} · {formatBytes(item.tamanhoBytes)}</p></TableCell><TableCell className="overflow-hidden"><Badge className={typeOptions.find((option) => option.value === item.tipo)?.tone}>{typeLabel(item.tipo)}</Badge></TableCell><TableCell className="overflow-hidden"><p className="truncate" title={item.versao || undefined}>{item.versao || "—"}</p><p className="truncate text-xs text-muted-foreground" title={item.sistemaOperacional || undefined}>{item.sistemaOperacional || "Todos / não informado"}</p></TableCell><TableCell className="overflow-hidden"><p>{new Date(item.updatedAt).toLocaleDateString("pt-BR")}</p><p className="truncate text-xs text-muted-foreground" title={item.createdByUser?.name}>{item.createdByUser?.name || "—"}</p></TableCell><TableCell><div className="flex justify-end gap-1">{isPdf(item) && <Button variant="ghost" size="icon-sm" title="Visualizar PDF" onClick={() => setViewer(item)}><Eye className="h-4 w-4" /></Button>}<Button size="sm" onClick={() => window.location.assign(`/api/technical-files/${item.id}/download`)}><Download className="mr-2 h-4 w-4" /> Baixar</Button><Button variant="ghost" size="icon-sm" title="Editar" onClick={() => openForm(item)}><Pencil className="h-4 w-4" /></Button>{isAdmin && <Button variant="ghost" size="icon-sm" className="text-destructive" title="Excluir" onClick={() => setDeleting(item)}><Trash2 className="h-4 w-4" /></Button>}</div></TableCell></TableRow>)}</TableBody></Table></div></CardContent></Card>
      : <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{items.map((item) => { const Icon = typeIcon(item.tipo); return <Card key={item.id} className="h-fit overflow-hidden border-t-4 border-t-primary transition-shadow hover:shadow-md"><CardHeader className="bg-primary/5 p-4"><div className="flex items-start justify-between gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span><div className="flex flex-wrap justify-end gap-1"><Badge className={typeOptions.find((option) => option.value === item.tipo)?.tone}>{typeLabel(item.tipo)}</Badge><Badge variant="secondary">{item.category.nome}</Badge></div></div><CardTitle className="mt-3 break-words text-base">{item.nome}</CardTitle></CardHeader><CardContent className="space-y-3 p-4"><div><p className="font-medium">{item.produto}</p><p className="text-xs text-muted-foreground">{item.fabricante || "Fabricante não informado"}</p></div><p className="line-clamp-3 min-h-10 break-words text-sm text-muted-foreground">{item.descricao || "Sem descrição."}</p><div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/50 p-2 text-xs"><span>Versão: <b>{item.versao || "—"}</b></span><span>Tamanho: <b>{formatBytes(item.tamanhoBytes)}</b></span><span className="col-span-2 truncate">Sistema: <b>{item.sistemaOperacional || "Todos / não informado"}</b></span></div><div className="flex items-center justify-between gap-2 border-t pt-3"><div className="flex gap-1">{isPdf(item) && <Button variant="outline" size="sm" onClick={() => setViewer(item)}><Eye className="mr-2 h-4 w-4" /> Visualizar</Button>}<Button size="sm" onClick={() => window.location.assign(`/api/technical-files/${item.id}/download`)}><Download className="mr-2 h-4 w-4" /> Baixar</Button></div><div><Button variant="ghost" size="icon-sm" onClick={() => openForm(item)}><Pencil className="h-4 w-4" /></Button>{isAdmin && <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => setDeleting(item)}><Trash2 className="h-4 w-4" /></Button>}</div></div></CardContent></Card>; })}</div>}

    <Dialog open={formOpen} onOpenChange={setFormOpen}><DialogContent className="max-h-[92vh] w-[96vw] overflow-y-auto sm:max-w-5xl"><DialogHeader><DialogTitle>{editing ? "Editar arquivo técnico" : "Novo arquivo técnico"}</DialogTitle><DialogDescription>Cadastre drivers, firmwares, manuais e demais arquivos utilizados pela equipe técnica.</DialogDescription></DialogHeader><div className="grid gap-4 py-2 sm:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-2 sm:col-span-2"><Label>Nome *</Label><Input maxLength={160} value={form.nome} onChange={(e) => setForm((current) => ({ ...current, nome: e.target.value }))} placeholder="Ex.: Driver Bematech MP-4200 TH" /></div>
      <div className="space-y-2"><Label>Categoria *</Label><div className="flex gap-2"><Select value={form.categoryId} onValueChange={(value) => value && setForm((current) => ({ ...current, categoryId: value }))}><SelectTrigger className="min-w-0 flex-1"><SelectValue placeholder="Selecione">{(value) => categories.find((c) => c.id === value)?.nome || "Selecione"}</SelectValue></SelectTrigger><SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent></Select>{isAdmin && <Button type="button" variant="outline" size="icon" title="Criar categoria" onClick={() => openQuickCreate("Categoria")}><Plus className="h-4 w-4" /></Button>}</div></div>
      <div className="space-y-2"><Label>Tipo *</Label><Select value={form.tipo} onValueChange={(value) => value && setForm((current) => ({ ...current, tipo: value as TechnicalType }))}><SelectTrigger><SelectValue>{(value) => typeLabel(value as TechnicalType)}</SelectValue></SelectTrigger><SelectContent>{typeOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-2"><Label>Fabricante</Label><div className="flex gap-2"><Select value={form.fabricante || "none"} onValueChange={(value) => value && setForm((current) => ({ ...current, fabricante: value === "none" ? "" : value }))}><SelectTrigger className="min-w-0 flex-1"><SelectValue>{(value) => value === "none" ? "Selecione o fabricante" : value}</SelectValue></SelectTrigger><SelectContent><SelectItem value="none">Não informado</SelectItem>{manufacturersForForm.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select>{isAdmin && <Button type="button" variant="outline" size="icon" title="Criar fabricante" onClick={() => openQuickCreate("Fabricante")}><Plus className="h-4 w-4" /></Button>}</div></div>
      <div className="space-y-2"><Label>Produto / modelo *</Label><div className="flex gap-2"><Select value={form.produto || "none"} onValueChange={(value) => value && setForm((current) => ({ ...current, produto: value === "none" ? "" : value }))}><SelectTrigger className="min-w-0 flex-1"><SelectValue>{(value) => value === "none" ? "Selecione o produto / modelo" : value}</SelectValue></SelectTrigger><SelectContent><SelectItem value="none">Selecione o produto / modelo</SelectItem>{productsForForm.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select>{isAdmin && <Button type="button" variant="outline" size="icon" title="Criar produto / modelo" onClick={() => openQuickCreate("Produto")}><Plus className="h-4 w-4" /></Button>}</div></div>
      <div className="space-y-2"><Label>Versão</Label><Input maxLength={80} value={form.versao} onChange={(e) => setForm((current) => ({ ...current, versao: e.target.value }))} placeholder="Ex.: 3.2.1" /></div>
      <div className="space-y-2"><Label>Sistema operacional</Label><div className="flex gap-2"><Select value={form.sistemaOperacional || "none"} onValueChange={(value) => value && setForm((current) => ({ ...current, sistemaOperacional: value === "none" ? "" : value }))}><SelectTrigger className="min-w-0 flex-1"><SelectValue>{(value) => value === "none" ? "Selecione o sistema" : value}</SelectValue></SelectTrigger><SelectContent><SelectItem value="none">Todos / não informado</SelectItem>{systemsForForm.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select>{isAdmin && <Button type="button" variant="outline" size="icon" title="Criar sistema operacional" onClick={() => openQuickCreate("SistemaOperacional")}><Plus className="h-4 w-4" /></Button>}</div></div>
      <div className="space-y-2 sm:col-span-2"><div className="flex justify-between"><Label>Descrição</Label><span className="text-xs text-muted-foreground">{form.descricao.length}/500</span></div><Textarea rows={4} maxLength={500} value={form.descricao} onChange={(e) => setForm((current) => ({ ...current, descricao: e.target.value }))} /></div>
      <div className="space-y-2 sm:col-span-2"><Label>Arquivo {editing ? "(opcional para manter o atual)" : "*"}</Label><Input type="file" accept=".zip,.rar,.7z,.exe,.msi,.inf,.cab,.bin,.rom,.fw,.hex,.img,.iso,.pdf,.doc,.docx,.txt,.dmg,.pkg,.deb,.rpm" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />{editing && !file && <p className="text-xs text-muted-foreground">Arquivo atual: {editing.nomeOriginal} ({formatBytes(editing.tamanhoBytes)})</p>}<p className="text-xs text-muted-foreground">Limite atual: {settings?.technicalFileMaxMb ? `${settings.technicalFileMaxMb} MB` : "sem limite no aplicativo"}. Arquivos com nomes iguais não são sobrescritos.</p></div>
      <div className="flex justify-end gap-2 sm:col-span-2 lg:col-span-4"><Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button><Button onClick={save} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}{editing ? "Salvar alterações" : "Enviar e cadastrar"}</Button></div>
    </div></DialogContent></Dialog>

    <Dialog open={!!viewer} onOpenChange={(open) => !open && setViewer(null)}>
      <DialogContent className="h-[94vh] w-[96vw] max-w-none overflow-hidden p-0 sm:max-w-[96vw]">
        <DialogHeader className="flex-row items-center justify-between gap-3 border-b px-5 py-3 text-left">
          <div className="min-w-0"><DialogTitle className="truncate">{viewer?.nome}</DialogTitle><DialogDescription className="truncate">{viewer?.nomeOriginal}</DialogDescription></div>
          {viewer && <div className="mr-8 flex shrink-0 gap-2"><Button variant="outline" size="sm" onClick={() => window.open(`/api/technical-files/${viewer.id}/download?inline=1`, "_blank", "noopener,noreferrer")}><ExternalLink className="mr-2 h-4 w-4" /> Abrir em nova aba</Button><Button size="sm" onClick={() => window.location.assign(`/api/technical-files/${viewer.id}/download`)}><Download className="mr-2 h-4 w-4" /> Baixar</Button></div>}
        </DialogHeader>
        {viewer && <iframe src={`/api/technical-files/${viewer.id}/download?inline=1#view=FitH`} title={viewer.nome} className="block h-[calc(94vh-74px)] w-full border-0 bg-white" />}
      </DialogContent>
    </Dialog>

    <Dialog open={!!quickCreateKind} onOpenChange={(open) => !open && setQuickCreateKind(null)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Novo {quickCreateKind === "SistemaOperacional" ? "sistema operacional" : quickCreateKind?.toLowerCase()}</DialogTitle><DialogDescription>O novo cadastro será selecionado automaticamente neste arquivo técnico.</DialogDescription></DialogHeader>
        <div className="space-y-4"><div className="space-y-2"><Label>Nome *</Label><Input autoFocus maxLength={quickCreateKind === "Categoria" ? 80 : 160} value={quickCreateName} onChange={(event) => setQuickCreateName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void createQuickOption(); }} /></div><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setQuickCreateKind(null)}>Cancelar</Button><Button disabled={quickCreating || !quickCreateName.trim()} onClick={createQuickOption}>{quickCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Criar e selecionar</Button></div></div>
      </DialogContent>
    </Dialog>

    <Dialog open={categoriesOpen} onOpenChange={setCategoriesOpen}><DialogContent className="w-[96vw] sm:max-w-6xl"><DialogHeader><DialogTitle>Gerenciar cadastros</DialogTitle><DialogDescription>Crie e edite as opções utilizadas na organização dos arquivos técnicos.</DialogDescription></DialogHeader><Tabs defaultValue="categories"><TabsList className="grid w-full grid-cols-4"><TabsTrigger value="categories">Categorias</TabsTrigger><TabsTrigger value="manufacturers">Fabricantes</TabsTrigger><TabsTrigger value="products">Produtos</TabsTrigger><TabsTrigger value="systems">Sistemas</TabsTrigger></TabsList><TabsContent value="categories" className="space-y-4 pt-3"><div className="flex gap-2"><Input value={newCategory} maxLength={80} onChange={(e) => setNewCategory(e.target.value)} placeholder="Nova categoria" /><Button onClick={createCategory}><Plus className="mr-2 h-4 w-4" /> Criar</Button></div><p className="text-xs text-muted-foreground">Categorias com arquivos vinculados podem ser renomeadas, mas não excluídas.</p><div className="grid max-h-[48vh] gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">{categories.map((category) => <div key={category.id} className="flex min-w-0 items-center gap-2 rounded-xl border bg-card p-3 shadow-sm">{editingCategoryId === category.id ? <><Input className="min-w-0" value={categoryNames[category.id] ?? category.nome} onChange={(e) => setCategoryNames((current) => ({ ...current, [category.id]: e.target.value }))} /><Button size="sm" variant="outline" onClick={() => renameCategory(category)}>Salvar</Button></> : <><span className="min-w-0 flex-1 truncate text-sm font-medium" title={category.nome}>{category.nome}</span><Button variant="ghost" size="icon-sm" title="Editar categoria" onClick={() => setEditingCategoryId(category.id)}><Pencil className="h-4 w-4" /></Button></>}<Button variant="ghost" size="icon-sm" className="text-destructive" title="Excluir categoria" onClick={async () => { const response = await fetch(`/api/technical-categories/${category.id}`, { method: "DELETE" }); const body = await response.json().catch(() => ({})); if (!response.ok) return toast.error(body.error || "Erro ao excluir"); toast.success("Categoria excluída"); await loadCategories(); }}><Trash2 className="h-4 w-4" /></Button></div>)}</div></TabsContent><TabsContent value="manufacturers">{optionManager("Fabricante", "Fabricante", "Novo fabricante")}</TabsContent><TabsContent value="products">{optionManager("Produto", "Produto", "Novo produto / modelo")}</TabsContent><TabsContent value="systems">{optionManager("SistemaOperacional", "Sistema operacional", "Novo sistema operacional")}</TabsContent></Tabs></DialogContent></Dialog>

    <Dialog open={limitsOpen} onOpenChange={setLimitsOpen}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>Limite de upload</DialogTitle><DialogDescription>Defina o tamanho máximo de drivers, firmwares e demais arquivos. Use 0 para não limitar pelo aplicativo.</DialogDescription></DialogHeader><div className="space-y-4"><div className="space-y-2"><Label>Limite por arquivo (MB)</Label><Input type="number" min="0" value={maxMb} onChange={(e) => setMaxMb(e.target.value)} /><p className="text-xs text-muted-foreground">O proxy ou servidor web ainda pode possuir um limite próprio.</p></div><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setLimitsOpen(false)}>Cancelar</Button><Button disabled={updateSettings.isPending} onClick={async () => { try { await updateSettings.mutateAsync({ technicalFileMaxMb: Math.max(0, Number(maxMb) || 0) }); toast.success("Limite atualizado"); setLimitsOpen(false); } catch (error) { toast.error(error instanceof Error ? error.message : "Erro ao salvar limite"); } }}>{updateSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar</Button></div></div></DialogContent></Dialog>

    <ConfirmDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)} title="Excluir este arquivo técnico?" description="O cadastro e o arquivo armazenado serão removidos permanentemente." confirmLabel="Excluir" variant="destructive" onConfirm={async () => { if (!deleting) return; const response = await fetch(`/api/technical-files/${deleting.id}`, { method: "DELETE" }); const body = await response.json().catch(() => ({})); if (!response.ok) toast.error(body.error || "Erro ao excluir"); else { toast.success("Arquivo excluído"); await loadFiles(); } setDeleting(null); }} />
  </div>;
}
