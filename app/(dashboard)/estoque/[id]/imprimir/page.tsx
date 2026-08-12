"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { useStockMovement } from "@/hooks/use-estoque";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatDateBR } from "@/lib/format";

function statusLabel(status: string) {
  return status === "Pendente" ? "Em aberto" : status;
}

export default function StockMovementPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: item, isLoading } = useStockMovement(id);

  if (isLoading) return <p className="p-6 text-muted-foreground">Carregando ficha...</p>;
  if (!item) return <p className="p-6 text-muted-foreground">Lançamento não encontrado.</p>;

  const fields = [
    ["Código", item.cod], ["Descrição", item.descricao], ["Quantidade", String(item.qtd)],
    ["Número de série", item.numeroSerie || "—"], ["Data do lançamento", formatDateBR(item.data)],
    ["Responsável pela retirada", item.respRetirada], ["Responsável pela entrega", item.respEntrega || "—"],
    ["Destino", item.destino || "—"], ["Situação", statusLabel(item.status)],
    ["Foi devolvido?", item.status === "Devolvido" || item.devolvido ? "Sim" : "Não"],
    ["Última atualização", new Date(item.updatedAt).toLocaleString("pt-BR")],
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 print:hidden">
        <Link href="/estoque" className={buttonVariants({ variant: "ghost" })}><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Link>
        <Button onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Imprimir ficha</Button>
      </div>
      <article className="stock-print-document mx-auto min-h-[270mm] max-w-[190mm] bg-white p-8 text-black shadow-sm print:min-h-0 print:max-w-none print:p-0 print:shadow-none">
        <header className="border-b-2 border-primary pb-4 text-center">
          <h1 className="text-xl font-bold uppercase">Ficha individual de movimentação</h1>
          <p className="mt-1 text-sm text-gray-600">Controle de Estoque</p>
        </header>
        <div className="mt-6 grid grid-cols-2 border-l border-t border-gray-300 text-sm">
          {fields.map(([label, value]) => (
            <div key={label} className="border-b border-r border-gray-300 p-3">
              <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
              <p className="mt-1 font-medium">{value}</p>
            </div>
          ))}
        </div>
        {item.observacoes && <section className="mt-5 rounded border border-gray-300 p-3 text-sm"><p className="text-xs font-semibold uppercase text-gray-500">Observações</p><p className="mt-1">{item.observacoes}</p></section>}
        <footer className="mt-16 grid grid-cols-2 gap-16 text-center text-xs">
          <div className="border-t border-black pt-2">Responsável pela retirada</div>
          <div className="border-t border-black pt-2">Responsável pela entrega/devolução</div>
        </footer>
      </article>
    </div>
  );
}
