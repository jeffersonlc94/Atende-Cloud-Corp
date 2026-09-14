"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ClipboardCheck, Eye, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

type Company = { id: string; razaoSocial: string; nomeFantasia?: string | null; isDefault?: boolean };
type Report = FormState & { id: string; numero: string; createdAt: string; createdByUser: { name: string }; company: Company };
type FormState = {
  companyId: string; dataEmissao: string; status: "Rascunho" | "Finalizado";
  clienteCodigo: string; clienteNome: string; clienteFantasia: string; clienteEndereco: string; clienteNumero: string;
  clienteBairro: string; clienteCidade: string; clienteUf: string; clienteTelefone: string; clienteDocumento: string;
  equipamento: string; numeroSerie: string; modelo: string; equipamentoObservacao: string; problema: string;
  problemaRelatado: string; problemasEncontrados: string; procedimentosRealizados: string;
};

const today = () => new Date().toISOString().slice(0, 10);
const blank: FormState = { companyId: "", dataEmissao: today(), status: "Rascunho", clienteCodigo: "", clienteNome: "", clienteFantasia: "", clienteEndereco: "", clienteNumero: "", clienteBairro: "", clienteCidade: "", clienteUf: "", clienteTelefone: "", clienteDocumento: "", equipamento: "", numeroSerie: "", modelo: "", equipamentoObservacao: "", problema: "", problemaRelatado: "", problemasEncontrados: "", procedimentosRealizados: "" };

export default function TechnicalReportsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const [items, setItems] = useState<Report[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Report | null>(null);
  const [form, setForm] = useState<FormState>(blank);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Report | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/technical-reports?q=${encodeURIComponent(query)}`, { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Erro ao carregar laudos");
      setItems(body);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Erro ao carregar laudos"); }
    finally { setLoading(false); }
  }, [query]);

  useEffect(() => { const timeout = window.setTimeout(load, 250); return () => window.clearTimeout(timeout); }, [load]);
  useEffect(() => { fetch("/api/companies").then((response) => response.json()).then((data: Company[]) => { setCompanies(data); setForm((current) => ({ ...current, companyId: current.companyId || data.find((company) => company.isDefault)?.id || data[0]?.id || "" })); }).catch(() => toast.error("Erro ao carregar empresas")); }, []);

  function field<K extends keyof FormState>(key: K, value: FormState[K]) { setForm((current) => ({ ...current, [key]: value })); }
  function showForm(item?: Report) {
    setEditing(item || null);
    setForm(item ? { ...blank, ...Object.fromEntries(Object.keys(blank).map((key) => [key, item[key as keyof FormState] ?? ""])) } as FormState : { ...blank, companyId: companies.find((company) => company.isDefault)?.id || companies[0]?.id || "" });
    setOpen(true);
  }
  async function save() {
    if (!form.companyId || !form.clienteNome.trim() || !form.equipamento.trim()) return toast.error("Informe empresa, cliente e equipamento");
    setSaving(true);
    try {
      const response = await fetch(editing ? `/api/technical-reports/${editing.id}` : "/api/technical-reports", { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Erro ao salvar laudo");
      toast.success(editing ? "Laudo atualizado" : `Laudo Nº ${body.numero} criado`); setOpen(false); await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Erro ao salvar laudo"); }
    finally { setSaving(false); }
  }

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="flex items-center gap-2 text-2xl font-bold"><ClipboardCheck className="h-6 w-6 text-primary" /> Laudos Técnicos</h1><p className="text-sm text-muted-foreground">Cadastro, emissão e histórico dos laudos de equipamentos.</p></div><Button onClick={() => showForm()}><Plus className="mr-2 h-4 w-4" /> Novo laudo</Button></div>
    <Card><CardContent className="p-4"><div className="relative max-w-xl"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="Buscar por número, cliente ou equipamento" /></div></CardContent></Card>
    <Card><CardContent className="p-0">{loading ? <div className="py-16"><Loader2 className="mx-auto h-7 w-7 animate-spin text-primary" /></div> : <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Número</TableHead><TableHead>Data</TableHead><TableHead>Cliente</TableHead><TableHead>Equipamento</TableHead><TableHead>Técnico</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader><TableBody>{items.length === 0 ? <TableRow><TableCell colSpan={7} className="py-12 text-center text-muted-foreground">Nenhum laudo encontrado.</TableCell></TableRow> : items.map((item) => <TableRow key={item.id}><TableCell className="font-bold">{item.numero}</TableCell><TableCell>{new Date(item.dataEmissao).toLocaleDateString("pt-BR", { timeZone: "UTC" })}</TableCell><TableCell>{item.clienteNome}</TableCell><TableCell><p className="font-medium">{item.equipamento}</p><p className="text-xs text-muted-foreground">{item.modelo || "Modelo não informado"}</p></TableCell><TableCell>{item.createdByUser?.name || "—"}</TableCell><TableCell><Badge variant={item.status === "Finalizado" ? "default" : "secondary"}>{item.status}</Badge></TableCell><TableCell><div className="flex justify-end gap-1"><Button variant="ghost" size="icon-sm" title="Visualizar e imprimir" onClick={() => router.push(`/laudos/${item.id}/imprimir`)}><Eye className="h-4 w-4" /></Button><Button variant="ghost" size="icon-sm" title="Editar" onClick={() => showForm(item)}><Pencil className="h-4 w-4" /></Button>{isAdmin && <Button variant="ghost" size="icon-sm" className="text-destructive" title="Excluir" onClick={() => setDeleting(item)}><Trash2 className="h-4 w-4" /></Button>}</div></TableCell></TableRow>)}</TableBody></Table></div>}</CardContent></Card>

    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[94vh] w-[96vw] overflow-y-auto sm:max-w-6xl"><DialogHeader><DialogTitle>{editing ? `Editar laudo Nº ${editing.numero}` : "Novo laudo técnico"}</DialogTitle><DialogDescription>Preencha as informações do cliente, equipamento e diagnóstico técnico.</DialogDescription></DialogHeader><div className="grid gap-4 py-2 md:grid-cols-4">
      <div className="space-y-2 md:col-span-2"><Label>Empresa emissora *</Label><Select value={form.companyId} onValueChange={(value) => value && field("companyId", value)}><SelectTrigger><SelectValue>{(value) => companies.find((company) => company.id === value)?.razaoSocial || "Selecione"}</SelectValue></SelectTrigger><SelectContent>{companies.map((company) => <SelectItem key={company.id} value={company.id}>{company.razaoSocial}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Data *</Label><Input type="date" value={form.dataEmissao.slice(0, 10)} onChange={(event) => field("dataEmissao", event.target.value)} /></div><div className="space-y-2"><Label>Status</Label><Select value={form.status} onValueChange={(value) => value && field("status", value as FormState["status"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Rascunho">Rascunho</SelectItem><SelectItem value="Finalizado">Finalizado</SelectItem></SelectContent></Select></div>
      <h3 className="border-b pb-1 font-semibold md:col-span-4">Dados do cliente</h3><div className="space-y-2"><Label>Código</Label><Input value={form.clienteCodigo} onChange={(e) => field("clienteCodigo", e.target.value)} /></div><div className="space-y-2 md:col-span-2"><Label>Cliente *</Label><Input value={form.clienteNome} onChange={(e) => field("clienteNome", e.target.value)} /></div><div className="space-y-2"><Label>Nome fantasia</Label><Input value={form.clienteFantasia} onChange={(e) => field("clienteFantasia", e.target.value)} /></div><div className="space-y-2 md:col-span-2"><Label>Endereço</Label><Input value={form.clienteEndereco} onChange={(e) => field("clienteEndereco", e.target.value)} /></div><div className="space-y-2"><Label>Número</Label><Input value={form.clienteNumero} onChange={(e) => field("clienteNumero", e.target.value)} /></div><div className="space-y-2"><Label>Bairro</Label><Input value={form.clienteBairro} onChange={(e) => field("clienteBairro", e.target.value)} /></div><div className="space-y-2"><Label>Cidade</Label><Input value={form.clienteCidade} onChange={(e) => field("clienteCidade", e.target.value)} /></div><div className="space-y-2"><Label>UF</Label><Input maxLength={2} value={form.clienteUf} onChange={(e) => field("clienteUf", e.target.value.toUpperCase())} /></div><div className="space-y-2"><Label>Telefone</Label><Input value={form.clienteTelefone} onChange={(e) => field("clienteTelefone", e.target.value)} /></div><div className="space-y-2"><Label>CPF/CNPJ</Label><Input value={form.clienteDocumento} onChange={(e) => field("clienteDocumento", e.target.value)} /></div>
      <h3 className="border-b pb-1 font-semibold md:col-span-4">Dados do equipamento</h3><div className="space-y-2 md:col-span-2"><Label>Equipamento *</Label><Input value={form.equipamento} onChange={(e) => field("equipamento", e.target.value)} /></div><div className="space-y-2"><Label>Número de série</Label><Input value={form.numeroSerie} onChange={(e) => field("numeroSerie", e.target.value)} /></div><div className="space-y-2"><Label>Modelo</Label><Input value={form.modelo} onChange={(e) => field("modelo", e.target.value)} /></div><div className="space-y-2 md:col-span-2"><Label>Problema</Label><Input value={form.problema} onChange={(e) => field("problema", e.target.value)} /></div><div className="space-y-2 md:col-span-2"><Label>Observação do equipamento</Label><Input value={form.equipamentoObservacao} onChange={(e) => field("equipamentoObservacao", e.target.value)} /></div>
      <div className="space-y-2 md:col-span-4"><Label>Problema relatado</Label><Textarea rows={3} value={form.problemaRelatado} onChange={(e) => field("problemaRelatado", e.target.value)} /></div><div className="space-y-2 md:col-span-2"><Label>Problemas encontrados</Label><Textarea rows={7} value={form.problemasEncontrados} onChange={(e) => field("problemasEncontrados", e.target.value)} /></div><div className="space-y-2 md:col-span-2"><Label>Procedimentos realizados</Label><Textarea rows={7} value={form.procedimentosRealizados} onChange={(e) => field("procedimentosRealizados", e.target.value)} /></div>
      <div className="flex justify-end gap-2 md:col-span-4"><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button disabled={saving} onClick={save}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar laudo</Button></div>
    </div></DialogContent></Dialog>
    <ConfirmDialog open={!!deleting} onOpenChange={(value) => !value && setDeleting(null)} title="Excluir este laudo?" description="O laudo será removido permanentemente." confirmLabel="Excluir" variant="destructive" onConfirm={async () => { if (!deleting) return; const response = await fetch(`/api/technical-reports/${deleting.id}`, { method: "DELETE" }); if (response.ok) { toast.success("Laudo excluído"); await load(); } else toast.error("Erro ao excluir laudo"); setDeleting(null); }} />
  </div>;
}
