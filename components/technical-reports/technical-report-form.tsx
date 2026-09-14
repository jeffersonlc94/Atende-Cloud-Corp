"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ClipboardCheck, Eye, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Company = { id: string; razaoSocial: string; nomeFantasia?: string | null; isDefault?: boolean };
type FormState = { numero: string; companyId: string; dataEmissao: string; status: "Rascunho" | "Finalizado"; clienteCodigo: string; clienteNome: string; clienteFantasia: string; clienteEndereco: string; clienteNumero: string; clienteBairro: string; clienteCidade: string; clienteUf: string; clienteTelefone: string; clienteDocumento: string; equipamento: string; numeroSerie: string; modelo: string; equipamentoObservacao: string; problema: string; problemaRelatado: string; problemasEncontrados: string; procedimentosRealizados: string; conclusao: string };
const today = () => new Date().toISOString().slice(0, 10);
const blank: FormState = { numero: "", companyId: "", dataEmissao: today(), status: "Rascunho", clienteCodigo: "", clienteNome: "", clienteFantasia: "", clienteEndereco: "", clienteNumero: "", clienteBairro: "", clienteCidade: "", clienteUf: "", clienteTelefone: "", clienteDocumento: "", equipamento: "", numeroSerie: "", modelo: "", equipamentoObservacao: "", problema: "", problemaRelatado: "", problemasEncontrados: "", procedimentosRealizados: "", conclusao: "" };

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={`space-y-1.5 ${className}`}><Label>{label}</Label>{children}</div>;
}

export function TechnicalReportForm({ reportId }: { reportId?: string }) {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [form, setForm] = useState<FormState>(blank);
  const [loading, setLoading] = useState(!!reportId);
  const [saving, setSaving] = useState(false);
  const field = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    Promise.all([
      fetch("/api/companies").then(async (response) => { if (!response.ok) throw new Error(); return response.json() as Promise<Company[]>; }),
      reportId ? fetch(`/api/technical-reports/${reportId}`, { cache: "no-store" }).then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.error); return body as FormState; }) : Promise.resolve(null),
    ]).then(([companyList, report]) => {
      setCompanies(companyList);
      if (report) setForm({ ...blank, ...report, dataEmissao: String(report.dataEmissao).slice(0, 10) });
      else setForm((current) => ({ ...current, companyId: companyList.find((company) => company.isDefault)?.id || companyList[0]?.id || "" }));
    }).catch(() => toast.error("Não foi possível carregar o formulário")).finally(() => setLoading(false));
  }, [reportId]);

  async function save() {
    if (!form.companyId || !form.clienteNome.trim() || !form.equipamento.trim()) return toast.error("Informe empresa, cliente e equipamento");
    setSaving(true);
    try {
      const response = await fetch(reportId ? `/api/technical-reports/${reportId}` : "/api/technical-reports", { method: reportId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Erro ao salvar laudo");
      toast.success(reportId ? "Laudo atualizado" : `Laudo Nº ${body.numero} criado`);
      router.push(`/laudos/${body.id || reportId}`);
      router.refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Erro ao salvar laudo"); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  return <div className="space-y-5 pb-8">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="flex items-center gap-2 text-2xl font-bold"><ClipboardCheck className="h-6 w-6 text-primary" />{reportId ? `Editar Laudo Nº ${form.numero}` : "Novo Laudo Técnico"}</h1><p className="text-sm text-muted-foreground">Laudos Técnicos <span className="px-1">›</span> {reportId ? "Editar laudo" : "Novo laudo"}</p></div><div className="flex gap-2"><Button onClick={save} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{reportId ? "Salvar alterações" : "Salvar laudo"}</Button>{reportId && <Button variant="outline" onClick={() => router.push(`/laudos/${reportId}/imprimir`)}><Eye className="mr-2 h-4 w-4" />Pré-visualizar</Button>}<Button variant="outline" onClick={() => router.push("/laudos")}><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Button></div></div>
    <Card><CardHeader><CardTitle className="text-sm uppercase tracking-wide">Dados do laudo</CardTitle><CardDescription>Informações gerais, empresa emissora e identificação do documento.</CardDescription></CardHeader><CardContent className="grid gap-4 md:grid-cols-4"><Field label="Número do laudo"><Input value={form.numero} onChange={(e) => field("numero", e.target.value)} placeholder="Automático" /></Field><Field label="Empresa emissora *"><Select value={form.companyId} onValueChange={(value) => value && field("companyId", value)}><SelectTrigger><SelectValue>{(value) => companies.find((company) => company.id === value)?.nomeFantasia || companies.find((company) => company.id === value)?.razaoSocial || "Selecione"}</SelectValue></SelectTrigger><SelectContent>{companies.map((company) => <SelectItem key={company.id} value={company.id}>{company.nomeFantasia || company.razaoSocial}</SelectItem>)}</SelectContent></Select></Field><Field label="Data *"><Input type="date" value={form.dataEmissao} onChange={(e) => field("dataEmissao", e.target.value)} /></Field><Field label="Status"><Select value={form.status} onValueChange={(value) => value && field("status", value as FormState["status"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Rascunho">Rascunho</SelectItem><SelectItem value="Finalizado">Finalizado</SelectItem></SelectContent></Select></Field></CardContent></Card>
    <Card><CardHeader><CardTitle className="text-sm uppercase tracking-wide">Dados do cliente</CardTitle><CardDescription>Identificação e contato do cliente.</CardDescription></CardHeader><CardContent className="grid gap-4 md:grid-cols-4"><Field label="Código"><Input value={form.clienteCodigo} onChange={(e) => field("clienteCodigo", e.target.value)} /></Field><Field label="Cliente *" className="md:col-span-2"><Input value={form.clienteNome} onChange={(e) => field("clienteNome", e.target.value)} /></Field><Field label="Nome fantasia"><Input value={form.clienteFantasia} onChange={(e) => field("clienteFantasia", e.target.value)} /></Field><Field label="Endereço" className="md:col-span-2"><Input value={form.clienteEndereco} onChange={(e) => field("clienteEndereco", e.target.value)} /></Field><Field label="Número"><Input value={form.clienteNumero} onChange={(e) => field("clienteNumero", e.target.value)} /></Field><Field label="Bairro"><Input value={form.clienteBairro} onChange={(e) => field("clienteBairro", e.target.value)} /></Field><Field label="Cidade"><Input value={form.clienteCidade} onChange={(e) => field("clienteCidade", e.target.value)} /></Field><Field label="UF"><Input maxLength={2} value={form.clienteUf} onChange={(e) => field("clienteUf", e.target.value.toUpperCase())} /></Field><Field label="Telefone"><Input value={form.clienteTelefone} onChange={(e) => field("clienteTelefone", e.target.value)} /></Field><Field label="CPF/CNPJ"><Input value={form.clienteDocumento} onChange={(e) => field("clienteDocumento", e.target.value)} /></Field></CardContent></Card>
    <Card><CardHeader><CardTitle className="text-sm uppercase tracking-wide">Dados do equipamento</CardTitle><CardDescription>Equipamento analisado e defeito informado.</CardDescription></CardHeader><CardContent className="grid gap-4 md:grid-cols-4"><Field label="Equipamento *" className="md:col-span-2"><Input value={form.equipamento} onChange={(e) => field("equipamento", e.target.value)} /></Field><Field label="Número de série"><Input value={form.numeroSerie} onChange={(e) => field("numeroSerie", e.target.value)} /></Field><Field label="Modelo"><Input value={form.modelo} onChange={(e) => field("modelo", e.target.value)} /></Field><Field label="Problema" className="md:col-span-2"><Input value={form.problema} onChange={(e) => field("problema", e.target.value)} /></Field><Field label="Observação do equipamento" className="md:col-span-2"><Input value={form.equipamentoObservacao} onChange={(e) => field("equipamentoObservacao", e.target.value)} /></Field></CardContent></Card>
    <Card><CardHeader><CardTitle className="text-sm uppercase tracking-wide">Diagnóstico técnico</CardTitle><CardDescription>Relato, análise, procedimentos e conclusão do laudo.</CardDescription></CardHeader><CardContent className="grid gap-4 md:grid-cols-2"><Field label="Problema relatado" className="md:col-span-2"><Textarea rows={3} value={form.problemaRelatado} onChange={(e) => field("problemaRelatado", e.target.value)} /></Field><Field label="Problemas encontrados"><Textarea rows={7} value={form.problemasEncontrados} onChange={(e) => field("problemasEncontrados", e.target.value)} /></Field><Field label="Procedimentos realizados"><Textarea rows={7} value={form.procedimentosRealizados} onChange={(e) => field("procedimentosRealizados", e.target.value)} /></Field><Field label="Conclusão do laudo" className="md:col-span-2"><Textarea rows={5} value={form.conclusao} onChange={(e) => field("conclusao", e.target.value)} /></Field></CardContent></Card>
    <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => router.push("/laudos")}>Cancelar</Button><Button onClick={save} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar laudo</Button></div>
  </div>;
}
