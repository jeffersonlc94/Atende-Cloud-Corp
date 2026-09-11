"use client";

import { useState } from "react";
import { Building2, ImageOff } from "lucide-react";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";
import {
  formatDescontoItem,
  getQuotePrintTotals,
  type QuotePrintCompany,
  type QuotePrintData,
} from "@/lib/quote-print-types";

function ProductImage({ url, alt }: { url: string; alt: string }) {
  const [error, setError] = useState(false);
  if (error) {
    return <div className="flex h-24 w-36 shrink-0 items-center justify-center rounded border border-black bg-white"><ImageOff className="h-7 w-7" /></div>;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={alt} className="h-24 w-36 shrink-0 rounded border border-black bg-white object-contain p-1" onError={() => setError(true)} />
  );
}

export function QuotePrintLayoutProdutos({
  company,
  quote,
  id = "quote-print-area",
  fontFamily,
  fontScale = 1,
  showFooter = true,
  itemOffset = 0,
}: {
  company: QuotePrintCompany | null | undefined;
  quote: QuotePrintData;
  id?: string;
  fontFamily?: string;
  fontScale?: number;
  showFooter?: boolean;
  itemOffset?: number;
}) {
  const [logoError, setLogoError] = useState(false);
  const totals = getQuotePrintTotals(quote);
  const address = [company?.endereco, company?.cidade && company?.estado ? `${company.cidade}/${company.estado}` : company?.cidade, company?.cep].filter(Boolean).join(" - ");

  return (
    <div id={id} className="mx-auto min-h-[297mm] w-full max-w-[210mm] bg-white p-6 text-black print:p-0" style={{ fontFamily: fontFamily || undefined, fontSize: `${16 * fontScale}px` }}>
      <header className="border-b-4 border-emerald-700 pb-3">
        <div className="flex items-start gap-4">
          {company?.logoUrl && !logoError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={company.logoUrl} alt="Logo" className="h-20 w-28 shrink-0 object-contain" onError={() => setLogoError(true)} />
          ) : <div className="flex h-20 w-24 shrink-0 items-center justify-center border border-black"><Building2 className="h-9 w-9" /></div>}
          <div className="min-w-0 flex-1">
            <h1 className="text-[1.2em] font-black uppercase leading-tight">{company?.razaoSocial || "Empresa não selecionada"}</h1>
            {company?.nomeFantasia && <p className="text-[0.75em] font-semibold">{company.nomeFantasia}</p>}
            {(company?.cnpj || company?.inscricaoEstadual) && <p className="text-[0.7em]">{company?.cnpj && `CNPJ: ${company.cnpj}`}{company?.cnpj && company?.inscricaoEstadual ? " · " : ""}{company?.inscricaoEstadual && `INSC: ${company.inscricaoEstadual}`}</p>}
            {address && <p className="text-[0.7em]">{address}</p>}
            {(company?.telefone1 || company?.email) && <p className="text-[0.7em]">{[company?.telefone1, company?.email].filter(Boolean).join(" · ")}</p>}
          </div>
          <div className="shrink-0 text-right"><p className="text-[0.7em] font-bold uppercase text-emerald-800">Orçamento</p><p className="text-[1.45em] font-black">Nº {quote.numero || "------"}</p><p className="text-[0.75em]">{formatDateBR(quote.dataEmissao)}</p></div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 border-b border-black py-3 text-[0.75em]"><p><b>CLIENTE:</b> {quote.clienteNome || "—"}</p><p><b>REFERÊNCIA:</b> {quote.referencia || "—"}</p></div>

      <section className="mt-3 space-y-2">
        {quote.itens.length === 0 && <p className="border border-black p-6 text-center">Nenhum item adicionado</p>}
        {quote.itens.map((item, index) => (
          <article key={index} className="flex min-h-28 break-inside-avoid items-center gap-3 border border-black p-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-[0.75em] font-bold text-white">{itemOffset + index + 1}</div>
            {item.fotoUrl ? <ProductImage url={item.fotoUrl} alt={item.descricao} /> : <div className="flex h-24 w-36 shrink-0 items-center justify-center rounded border border-dashed border-black text-[0.65em] font-semibold uppercase">Sem foto</div>}
            <div className="min-w-0 flex-1 self-stretch py-1">
              <p className="whitespace-pre-wrap break-words text-[0.9em] font-bold uppercase leading-tight [overflow-wrap:anywhere]">{item.descricao}</p>
              {item.observacao?.trim() && <p className="mt-1 whitespace-pre-wrap break-words text-[0.72em] leading-tight [overflow-wrap:anywhere]">{item.observacao}</p>}
              <div className="mt-3 grid grid-cols-4 gap-2 border-t border-black pt-2 text-[0.7em]">
                <p><span className="block font-bold uppercase">Qtd.</span>{Number(item.quantidade).toLocaleString("pt-BR")}</p>
                <p><span className="block font-bold uppercase">Valor unit.</span>{formatCurrencyBRL(Number(item.valorUnitario))}</p>
                {totals.hasItemDesconto && <p><span className="block font-bold uppercase">Desconto</span>{formatDescontoItem(item)}</p>}
                <p className="col-start-4 text-right"><span className="block font-bold uppercase">Total</span><b className="text-[1.1em]">{formatCurrencyBRL(Number(item.valorTotal))}</b></p>
              </div>
            </div>
          </article>
        ))}
      </section>

      {showFooter && <footer className="print-avoid-break mt-4">
        <div className="ml-auto w-72 border-2 border-black text-[0.75em]">
          <div className="flex justify-between border-b border-black px-3 py-1"><span>Produtos</span><b>{formatCurrencyBRL(totals.totalProdutosNum)}</b></div>
          <div className="flex justify-between border-b border-black px-3 py-1"><span>Serviços</span><b>{formatCurrencyBRL(totals.totalServicosNum)}</b></div>
          {totals.descontoProdutosNum > 0 && <div className="flex justify-between border-b border-black px-3 py-1"><span>Desconto produtos</span><b>- {formatCurrencyBRL(totals.descontoProdutosNum)}</b></div>}
          {totals.descontoServicosNum > 0 && <div className="flex justify-between border-b border-black px-3 py-1"><span>Desconto serviços</span><b>- {formatCurrencyBRL(totals.descontoServicosNum)}</b></div>}
          {totals.hasDescontoGeral && <div className="flex justify-between border-b border-black px-3 py-1"><span>Desconto geral</span><b>- {formatCurrencyBRL(totals.descontoGeralNum)}</b></div>}
          <div className="flex justify-between bg-emerald-700 px-3 py-2 text-[1.05em] font-black text-white"><span>TOTAL</span><span>{formatCurrencyBRL(totals.totalNum)}</span></div>
        </div>
        <div className="mt-3 space-y-1 text-[0.72em]">{quote.condicoesPagamento && <p><b>Condições de pagamento:</b> {quote.condicoesPagamento}</p>}{quote.prazoEntrega && <p><b>Prazo de entrega:</b> {quote.prazoEntrega}</p>}{quote.observacoes && <p><b>Observações:</b> {quote.observacoes}</p>}</div>
        {quote.validadeDias ? <p className="mt-3 text-center text-[0.72em] font-bold uppercase">Proposta válida por {quote.validadeDias} dias corridos a partir da emissão.</p> : null}
        <div className="mt-8 text-center text-[0.72em]"><p>{company?.cidade || "—"}, {formatDateBR(quote.dataEmissao)}</p><div className="mx-auto mt-6 w-64 border-t border-black pt-1"><b>{quote.createdByUserName || company?.nomeResponsavel || "Responsável"}</b><p>{company?.nomeFantasia || company?.razaoSocial}</p></div></div>
      </footer>}
    </div>
  );
}
