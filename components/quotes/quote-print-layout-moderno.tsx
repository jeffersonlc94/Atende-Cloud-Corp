"use client";

import { useState } from "react";
import { Building2, Mail, MapPin, Phone, Globe } from "lucide-react";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";
import {
  formatDescontoItem,
  getQuotePrintTotals,
  type QuotePrintCompany,
  type QuotePrintData,
} from "@/lib/quote-print-types";
import { FotoThumb } from "@/components/shared/foto-thumb";

export function QuotePrintLayoutModerno({
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
  const enderecoCompleto = [
    company?.endereco,
    company?.cidade && company?.estado ? `${company.cidade}/${company.estado}` : company?.cidade,
    company?.cep,
  ]
    .filter(Boolean)
    .join(" - ");

  const [logoError, setLogoError] = useState(false);

  const { hasItemDesconto, totalNum, hasDescontoGeral, descontoGeralNum, totalProdutosNum, totalServicosNum, descontoProdutosNum, descontoServicosNum } =
    getQuotePrintTotals(quote);

  return (
    <div
      className="mx-auto flex w-full max-w-[210mm] min-h-[297mm] items-stretch bg-white text-slate-800 print:shadow-none"
      style={{ fontFamily: fontFamily || undefined, fontSize: `${16 * fontScale}px` }}
      id={id}
    >
      {/* Sidebar */}
      <aside className="flex w-64 shrink-0 flex-col gap-6 bg-indigo-700 p-6 text-white">
        <div>
          {company?.logoUrl && !logoError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={company.logoUrl}
              alt="Logo"
              className="h-16 w-16 rounded-full bg-white object-contain p-1"
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
              <Building2 className="h-8 w-8" />
            </div>
          )}
          <h1 className="mt-3 text-[1.1em] font-black uppercase leading-tight tracking-tight">
            {company?.razaoSocial || "Empresa não selecionada"}
          </h1>
          {company?.nomeFantasia && (
            <p className="text-[0.75em] text-indigo-200">{company.nomeFantasia}</p>
          )}
        </div>

        <div className="space-y-2 text-[0.7em] text-indigo-100">
          {enderecoCompleto && (
            <p className="flex items-start gap-1.5">
              <MapPin className="mt-0.5 h-3 w-3 shrink-0" /> {enderecoCompleto}
            </p>
          )}
          {company?.telefone1 && (
            <p className="flex items-center gap-1.5">
              <Phone className="h-3 w-3 shrink-0" /> {company.telefone1}
            </p>
          )}
          {company?.email && (
            <p className="flex items-center gap-1.5">
              <Mail className="h-3 w-3 shrink-0" /> {company.email}
            </p>
          )}
          {company?.site && (
            <p className="flex items-center gap-1.5">
              <Globe className="h-3 w-3 shrink-0" /> {company.site}
            </p>
          )}
          {(company?.cnpj || company?.inscricaoEstadual) && (
            <p>
              {company?.cnpj && `CNPJ ${company.cnpj}`}
              {company?.cnpj && company?.inscricaoEstadual ? " · " : ""}
              {company?.inscricaoEstadual && `INSC ${company.inscricaoEstadual}`}
            </p>
          )}
        </div>

        <div className="mt-auto rounded-xl bg-white/10 p-4">
          <p className="text-[0.65em] uppercase tracking-widest text-indigo-200">Total geral</p>
          <p className="text-[1.6em] font-black">{formatCurrencyBRL(totalNum)}</p>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <div className="min-w-0 flex-1 p-8">
        <div className="flex items-start justify-between border-b border-slate-200 pb-4">
          <div>
            <p className="text-[0.7em] font-semibold uppercase tracking-[0.2em] text-indigo-600">
              Proposta comercial
            </p>
            <p className="text-[1.6em] font-black text-slate-900">Nº {quote.numero || "------"}</p>
          </div>
          <div className="text-right text-[0.8em] text-slate-500">
            <p>{formatDateBR(quote.dataEmissao)}</p>
          </div>
        </div>

        {/* Dados do cliente */}
        <div className="mt-4 flex gap-4">
          <div className="flex-1">
            <p className="text-[0.6em] font-semibold uppercase tracking-wide text-slate-400">
              Cliente
            </p>
            <p className="text-[0.9em] font-semibold text-slate-800">{quote.clienteNome || "—"}</p>
          </div>
          <div className="flex-1">
            <p className="text-[0.6em] font-semibold uppercase tracking-wide text-slate-400">
              Referência
            </p>
            <p className="text-[0.9em] font-semibold text-slate-800">{quote.referencia || "—"}</p>
          </div>
        </div>

        {/* Lista de itens (estilo cards, sem tabela) */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center gap-3 border-b border-slate-300 pb-1 text-[0.65em] font-semibold uppercase tracking-wide text-slate-400">
            <span className="flex-1">Descrição</span>
            <span className="w-14 text-center">Qtd</span>
            <span className="w-20 text-right">Unit.</span>
            {hasItemDesconto && <span className="w-16 text-right">Desc.</span>}
            <span className="w-24 text-right">Total</span>
          </div>
          {quote.itens.length === 0 && (
            <p className="py-4 text-center text-[0.875em] text-slate-400">Nenhum item adicionado</p>
          )}
          {quote.itens.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 rounded-lg bg-slate-50 p-2 text-[0.875em] print:break-inside-avoid"
            >
              <span className="flex min-w-0 flex-1 items-center gap-2">
                {item.fotoUrl && (
                  <FotoThumb url={item.fotoUrl} alt={item.descricao} className="h-9 w-9 shrink-0" />
                )}
                <span className="min-w-0 flex-1"><span className="block whitespace-pre-wrap break-words [overflow-wrap:anywhere]"><span className="mr-1 text-slate-400">{itemOffset + idx + 1}.</span>{item.descricao}</span>{item.observacao?.trim() && <span className="mt-0.5 block whitespace-pre-wrap break-words text-[0.85em] leading-tight text-slate-500 [overflow-wrap:anywhere]">{item.observacao}</span>}</span>
              </span>
              <span className="w-14 text-center text-slate-500">
                {Number(item.quantidade).toLocaleString("pt-BR")}
              </span>
              <span className="w-20 text-right text-slate-500">
                {formatCurrencyBRL(Number(item.valorUnitario))}
              </span>
              {hasItemDesconto && (
                <span className="w-16 text-right text-slate-500">{formatDescontoItem(item)}</span>
              )}
              <span className="w-24 text-right font-semibold text-slate-800">
                {formatCurrencyBRL(Number(item.valorTotal))}
              </span>
            </div>
          ))}
        </div>

        {/* Totais */}
        <div className={showFooter ? "mt-4 flex justify-end" : "hidden"}>
          <div className="w-64 space-y-1 rounded-lg border border-slate-200 p-4 text-[0.875em]">
            <div className="flex justify-between text-slate-500">
              <span>Produtos</span>
              <span>{formatCurrencyBRL(totalProdutosNum)}</span>
            </div>
            {descontoProdutosNum > 0 && <div className="flex justify-between text-slate-500"><span>Desconto produtos</span><span>- {formatCurrencyBRL(descontoProdutosNum)}</span></div>}
            <div className="flex justify-between text-slate-500">
              <span>Serviços</span>
              <span>{formatCurrencyBRL(totalServicosNum)}</span>
            </div>
            {descontoServicosNum > 0 && <div className="flex justify-between text-slate-500"><span>Desconto serviços</span><span>- {formatCurrencyBRL(descontoServicosNum)}</span></div>}
            {hasDescontoGeral && (
              <div className="flex justify-between text-slate-500">
                <span>Desconto geral</span>
                <span>- {formatCurrencyBRL(descontoGeralNum)}</span>
              </div>
            )}
            <div className="border-t border-slate-200 pt-1" />
            <div className="flex justify-between text-[1em] font-bold text-indigo-700">
              <span>Total</span>
              <span>{formatCurrencyBRL(totalNum)}</span>
            </div>
          </div>
        </div>

        {/* Condições */}
        <div className={showFooter ? "print-avoid-break mt-4 space-y-1 text-[0.875em] text-slate-600" : "hidden"}>
          {quote.condicoesPagamento && (
            <p>
              <span className="font-semibold text-slate-800">Condições de pagamento:</span>{" "}
              {quote.condicoesPagamento}
            </p>
          )}
          {quote.prazoEntrega && (
            <p>
              <span className="font-semibold text-slate-800">Prazo de entrega:</span>{" "}
              {quote.prazoEntrega}
            </p>
          )}
          {quote.observacoes && (
            <p>
              <span className="font-semibold text-slate-800">Observações:</span> {quote.observacoes}
            </p>
          )}
        </div>

        {/* Validade */}
        {showFooter && quote.validadeDias ? (
          <p className="mt-4 rounded-md bg-amber-50 p-2 text-center text-[0.875em] font-semibold text-amber-700">
            Válido por {quote.validadeDias} dias corridos a partir da data de emissão.
          </p>
        ) : null}

        {/* Assinatura */}
        <div className={showFooter ? "print-avoid-break mt-6 flex flex-col items-center pb-2 text-center text-[0.875em]" : "hidden"}>
          <p className="text-slate-500">
            {(company?.cidade || "—")}, {formatDateBR(quote.dataEmissao)}
          </p>
          <div className="mt-7 w-64 border-t border-slate-400 pt-1">
            <p className="font-medium text-slate-800">
              {quote.createdByUserName || company?.nomeResponsavel || "Responsável"}
            </p>
            <p className="text-[0.75em] text-slate-500">
              {company?.nomeFantasia || company?.razaoSocial}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
