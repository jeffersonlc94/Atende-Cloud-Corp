"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useSupplierQuotation } from "@/hooks/use-supplier-quotations";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Printer } from "lucide-react";
import { formatCurrencyBRL } from "@/lib/format";

export default function PrintSupplierQuotationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); const { data: q, isLoading } = useSupplierQuotation(id); const [supplierFilter, setSupplierFilter] = useState<string | null>("all");
  const supplierOptions = useMemo(() => q ? Array.from(new Map(q.itens.map(i => [i.supplierId, i.supplier])).values()) : [], [q]);
  if (isLoading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!q) return <p className="p-8">Cotação não encontrada.</p>;
  const items = supplierFilter === "all" ? q.itens : q.itens.filter(i => i.supplierId === supplierFilter);
  const total = items.reduce((sum, i) => sum + Number(i.valorTotal), 0);
  const supplierName = supplierFilter === "all" ? (q.primarySupplier?.razaoSocial || (q.tipo === "MultiplosFornecedores" ? "Vários fornecedores" : "—")) : supplierOptions.find(s => s.id === supplierFilter)?.razaoSocial || "—";
  return <main className="min-h-screen bg-slate-200 p-4 print:bg-white print:p-0">
    <div className="mx-auto mb-4 flex max-w-[210mm] flex-wrap items-center justify-between gap-2 print:hidden"><Button asChild variant="outline"><Link href={`/cotacoes/${id}`}><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Link></Button><div className="flex gap-2">{q.tipo === "MultiplosFornecedores" && <Select value={supplierFilter} onValueChange={setSupplierFilter}><SelectTrigger className="w-64 bg-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Cotação completa</SelectItem>{supplierOptions.map(s => <SelectItem key={s.id} value={s.id}>Somente {s.razaoSocial}</SelectItem>)}</SelectContent></Select>}<Button onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Imprimir / Salvar PDF</Button></div></div>
    <article className="mx-auto min-h-[297mm] w-[210mm] bg-white p-[14mm] text-[11px] text-black shadow print:min-h-0 print:shadow-none">
      <header className="flex items-start justify-between border-b-2 border-emerald-700 pb-4"><div className="flex gap-4">{q.company.logoUrl && <img src={q.company.logoUrl} alt="Logo" className="h-16 w-24 object-contain" />}<div><h1 className="text-lg font-bold">{q.company.razaoSocial}</h1><p>{q.company.cnpj || ""}</p><p>{[q.company.endereco, q.company.cidade, q.company.estado].filter(Boolean).join(" - ")}</p><p>{[q.company.telefone1, q.company.email].filter(Boolean).join(" | ")}</p></div></div><div className="text-right"><p className="text-xl font-bold">COTAÇÃO</p><p className="text-lg font-bold text-emerald-700">Nº {q.numero}</p><p>{new Date(q.dataCotacao).toLocaleDateString("pt-BR")}</p></div></header>
      <section className="grid grid-cols-2 gap-3 border-b py-4"><p><strong>REFERÊNCIA:</strong> {q.referencia || "—"}</p><p><strong>STATUS:</strong> {q.status === "EmCotacao" ? "Em cotação" : q.status}</p><p className="col-span-2"><strong>FORNECEDOR:</strong> {supplierName}</p></section>
      <table className="mt-4 w-full table-fixed border-collapse"><thead><tr className="bg-emerald-700 text-white"><th className="w-8 border p-2">#</th><th className="w-20 border p-2">CÓD.</th><th className="w-24 border p-2">CÓD. FORN.</th>{q.tipo === "MultiplosFornecedores" && supplierFilter === "all" && <th className="w-28 border p-2">FORNECEDOR</th>}<th className="border p-2">DESCRIÇÃO</th><th className="w-14 border p-2">QTD.</th><th className="w-24 border p-2">UNIT.</th><th className="w-24 border p-2">TOTAL</th></tr></thead><tbody>{items.map((item, index) => <tr key={item.id} className="break-inside-avoid"><td className="border p-2 text-center">{index + 1}</td><td className="border p-2 break-words">{item.codigoProduto || "—"}</td><td className="border p-2 break-words">{item.codigoFornecedor || "—"}</td>{q.tipo === "MultiplosFornecedores" && supplierFilter === "all" && <td className="border p-2 break-words">{item.supplier.razaoSocial}</td>}<td className="border p-2 break-words [overflow-wrap:anywhere]">{item.descricao}{item.observacao && <span className="mt-1 block text-[10px] text-slate-600">{item.observacao}</span>}</td><td className="border p-2 text-center">{Number(item.quantidade).toLocaleString("pt-BR")}</td><td className="border p-2 text-right">{formatCurrencyBRL(Number(item.valorUnitario))}</td><td className="border p-2 text-right font-semibold">{formatCurrencyBRL(Number(item.valorTotal))}</td></tr>)}</tbody><tfoot><tr><td colSpan={(q.tipo === "MultiplosFornecedores" && supplierFilter === "all") ? 7 : 6} className="border p-2 text-right font-bold">TOTAL</td><td className="border p-2 text-right text-sm font-bold">{formatCurrencyBRL(total)}</td></tr></tfoot></table>
      {q.tipo === "MultiplosFornecedores" && supplierFilter === "all" && <section className="ml-auto mt-4 w-80 rounded border p-3"><h2 className="mb-2 font-bold">SUBTOTAIS POR FORNECEDOR</h2>{supplierOptions.map(s => { const subtotal = q.itens.filter(i => i.supplierId === s.id).reduce((sum, i) => sum + Number(i.valorTotal), 0); return <p key={s.id} className="flex justify-between border-t py-1"><span>{s.razaoSocial}</span><strong>{formatCurrencyBRL(subtotal)}</strong></p>; })}</section>}
      {q.observacoes && <section className="mt-5 border-t pt-3"><strong>OBSERVAÇÕES:</strong><p className="mt-1 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{q.observacoes}</p></section>}
      <footer className="mt-14 text-center"><div className="mx-auto w-72 border-t border-black pt-2"><strong>{q.createdByUser?.name || "Responsável"}</strong><span className="block text-[10px]">Responsável pela cotação</span></div></footer>
    </article>
    <style jsx global>{`@page { size: A4; margin: 0; } @media print { body { background: white !important; } }`}</style>
  </main>;
}
