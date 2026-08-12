"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { useStockMovements } from "@/hooks/use-estoque";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDateBR } from "@/lib/format";

export default function StockReportsPage() {
  const [status, setStatus] = useState("todos");
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  const { data: items = [], isLoading } = useStockMovements({
    status: status === "todos" ? undefined : status,
    dataInicial: dataInicial || undefined,
    dataFinal: dataFinal || undefined,
  });
  const totals = useMemo(() => ({
    registros: items.length,
    unidades: items.reduce((sum, item) => sum + item.qtd, 0),
    pendentes: items.filter((item) => item.status === "Pendente").length,
    devolvidos: items.filter((item) => item.status === "Devolvido").length,
    vendidos: items.filter((item) => item.status === "Vendido").length,
  }), [items]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <div><Link href="/estoque" className={buttonVariants({ variant: "ghost" })}><ArrowLeft className="mr-2 h-4 w-4" /> Estoque</Link><h1 className="mt-2 text-2xl font-bold">Relatórios de estoque</h1></div>
        <Button onClick={() => window.print()} disabled={isLoading}><Printer className="mr-2 h-4 w-4" /> Imprimir lista</Button>
      </div>
      <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4 print:hidden">
        <div className="space-y-1"><Label>Status</Label><Select value={status} onValueChange={(value) => value && setStatus(value)}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem><SelectItem value="Pendente">Em aberto</SelectItem><SelectItem value="Devolvido">Devolvidos</SelectItem><SelectItem value="Vendido">Vendidos/baixados</SelectItem></SelectContent></Select></div>
        <div className="space-y-1"><Label>De</Label><Input type="date" value={dataInicial} onChange={(e) => setDataInicial(e.target.value)} /></div>
        <div className="space-y-1"><Label>Até</Label><Input type="date" value={dataFinal} onChange={(e) => setDataFinal(e.target.value)} /></div>
      </div>
      <article className="stock-print-document bg-white p-6 text-black shadow-sm print:p-0 print:shadow-none">
        <header className="border-b-2 border-primary pb-3 text-center"><h2 className="text-lg font-bold uppercase">Relatório de movimentações do estoque</h2><p className="text-xs text-gray-600">Período: {dataInicial ? formatDateBR(dataInicial) : "início"} até {dataFinal ? formatDateBR(dataFinal) : "hoje"} • Situação: {status === "todos" ? "Todas" : status === "Pendente" ? "Em aberto" : status}</p></header>
        <div className="my-4 grid grid-cols-5 gap-2 text-center text-xs">{[["Registros", totals.registros], ["Unidades", totals.unidades], ["Em aberto", totals.pendentes], ["Devolvidos", totals.devolvidos], ["Vendidos", totals.vendidos]].map(([label, value]) => <div key={label} className="rounded border p-2"><strong className="block text-base">{value}</strong>{label}</div>)}</div>
        <table className="w-full border-collapse text-[10px]"><thead><tr className="bg-gray-100">{["Data", "Código", "Descrição", "Qtd", "Nº série", "Retirada", "Entrega", "Destino", "Status"].map((h) => <th key={h} className="border border-gray-400 p-1 text-left">{h}</th>)}</tr></thead><tbody>{items.map((item) => <tr key={item.id}><td className="border p-1">{formatDateBR(item.data)}</td><td className="border p-1">{item.cod}</td><td className="border p-1">{item.descricao}</td><td className="border p-1 text-center">{item.qtd}</td><td className="border p-1">{item.numeroSerie || "—"}</td><td className="border p-1">{item.respRetirada}</td><td className="border p-1">{item.respEntrega || "—"}</td><td className="border p-1">{item.destino || "—"}</td><td className="border p-1">{item.status === "Pendente" ? "Em aberto" : item.status}</td></tr>)}</tbody></table>
        {!isLoading && items.length === 0 && <p className="py-8 text-center text-sm text-gray-500">Nenhum lançamento encontrado no período.</p>}
        <p className="mt-4 text-right text-[10px] text-gray-500">Emitido em {new Date().toLocaleString("pt-BR")}</p>
      </article>
    </div>
  );
}
