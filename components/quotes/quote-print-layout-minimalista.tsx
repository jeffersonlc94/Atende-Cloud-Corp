"use client";

import { useState } from "react";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";
import {
  formatDescontoItem,
  getQuotePrintTotals,
  type QuotePrintCompany,
  type QuotePrintData,
} from "@/lib/quote-print-types";
import { FotoThumb } from "@/components/shared/foto-thumb";

export function QuotePrintLayoutMinimalista({
  company,
  quote,
  id = "quote-print-area",
  fontFamily,
  fontScale = 1,
}: {
  company: QuotePrintCompany | null | undefined;
  quote: QuotePrintData;
  id?: string;
  fontFamily?: string;
  fontScale?: number;
}) {
  const enderecoCompleto = [
    company?.endereco,
    company?.cidade && company?.estado ? `${company.cidade}/${company.estado}` : company?.cidade,
    company?.cep,
  ]
    .filter(Boolean)
    .join(" - ");

  const telefones = [company?.telefone1, company?.telefone2].filter(Boolean).join(" · ");
  const [logoError, setLogoError] = useState(false);

  const { hasItemDesconto, totalNum, hasDescontoGeral, descontoGeralNum, totalProdutosNum, totalServicosNum } =
    getQuotePrintTotals(quote);

  return (
    <div
      className="mx-auto w-full max-w-[210mm] bg-white p-14 text-neutral-800 print:p-10 print:shadow-none"
      style={{ fontFamily: fontFamily || "Georgia, 'Times New Roman', serif", fontSize: `${16 * fontScale}px` }}
      id={id}
    >
      {/* Cabeçalho centralizado */}
      <div className="flex flex-col items-center text-center">
        {company?.logoUrl && !logoError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={company.logoUrl}
            alt="Logo"
            className="h-14 w-14 object-contain"
            onError={() => setLogoError(true)}
          />
        ) : null}
        <p className="mt-2 text-[1.3em] tracking-tight">
          {company?.razaoSocial || "Empresa não selecionada"}
        </p>
        {company?.nomeFantasia && (
          <p className="text-[0.75em] italic text-neutral-500">{company.nomeFantasia}</p>
        )}
        <div className="mt-1 text-[0.7em] text-neutral-500">
          {[enderecoCompleto, telefones, company?.email, company?.site].filter(Boolean).join("  ·  ")}
        </div>
        {(company?.cnpj || company?.inscricaoEstadual) && (
          <p className="text-[0.7em] text-neutral-500">
            {company?.cnpj && `CNPJ ${company.cnpj}`}
            {company?.cnpj && company?.inscricaoEstadual ? "   " : ""}
            {company?.inscricaoEstadual && `INSC ${company.inscricaoEstadual}`}
          </p>
        )}
      </div>

      <div className="mt-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-neutral-300" />
        <p className="text-[0.75em] uppercase tracking-[0.35em] text-neutral-500">Orçamento</p>
        <div className="h-px flex-1 bg-neutral-300" />
      </div>
      <p className="mt-2 text-center text-[1.4em]">Nº {quote.numero || "------"}</p>

      {/* Dados do cliente */}
      <div className="mt-8 flex justify-between text-[0.85em] italic">
        <p>
          Prezado(a) <span className="not-italic font-semibold">{quote.clienteNome || "—"}</span>,
          segue nossa proposta.
        </p>
        <p className="shrink-0 not-italic text-neutral-500">{formatDateBR(quote.dataEmissao)}</p>
      </div>
      {quote.referencia && (
        <p className="mt-1 text-[0.75em] text-neutral-500">Referência: {quote.referencia}</p>
      )}

      {/* Lista de itens como recibo, sem tabela */}
      <div className="mt-8">
        {quote.itens.length === 0 && (
          <p className="py-4 text-center text-[0.875em] text-neutral-400">Nenhum item adicionado</p>
        )}
        {quote.itens.map((item, idx) => (
          <div key={idx} className="flex items-baseline gap-2 border-b border-dotted border-neutral-300 py-2 text-[0.875em]">
            {item.fotoUrl && (
              <FotoThumb url={item.fotoUrl} alt={item.descricao} className="h-10 w-10 shrink-0 self-center" />
            )}
            <span className="shrink-0 text-neutral-400">{idx + 1}.</span>
            <span className="flex-1">{item.descricao}</span>
            <span className="shrink-0 text-neutral-500">
              {Number(item.quantidade).toLocaleString("pt-BR")} ×{" "}
              {formatCurrencyBRL(Number(item.valorUnitario))}
            </span>
            {hasItemDesconto && (
              <span className="shrink-0 text-neutral-500">({formatDescontoItem(item)})</span>
            )}
            <span className="shrink-0 font-semibold">{formatCurrencyBRL(Number(item.valorTotal))}</span>
          </div>
        ))}
      </div>

      {/* Totais */}
      <div className="mt-6 flex justify-end">
        <div className="w-56 space-y-1 text-[0.875em]">
          <div className="flex justify-between text-neutral-500">
            <span>Produtos</span>
            <span>{formatCurrencyBRL(totalProdutosNum)}</span>
          </div>
          <div className="flex justify-between text-neutral-500">
            <span>Serviços</span>
            <span>{formatCurrencyBRL(totalServicosNum)}</span>
          </div>
          {hasDescontoGeral && (
            <div className="flex justify-between text-neutral-500">
              <span>Desconto</span>
              <span>- {formatCurrencyBRL(descontoGeralNum)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-neutral-400 pt-1 text-[1.1em]">
            <span>Total</span>
            <span>{formatCurrencyBRL(totalNum)}</span>
          </div>
        </div>
      </div>

      {/* Condições */}
      <div className="mt-8 space-y-1 text-center text-[0.85em] text-neutral-600">
        {quote.condicoesPagamento && <p>Condições de pagamento — {quote.condicoesPagamento}</p>}
        {quote.prazoEntrega && <p>Prazo de entrega — {quote.prazoEntrega}</p>}
        {quote.observacoes && <p>Observações — {quote.observacoes}</p>}
      </div>

      {/* Validade */}
      {quote.validadeDias ? (
        <p className="mt-6 text-center text-[0.75em] italic text-neutral-400">
          Proposta válida por {quote.validadeDias} dias corridos a partir da data de emissão.
        </p>
      ) : null}

      {/* Assinatura */}
      <div className="mt-16 flex flex-col items-center text-center text-[0.875em]">
        <p className="text-neutral-500">
          {(company?.cidade || "—")}, {formatDateBR(quote.dataEmissao)}
        </p>
        <div className="mt-12 w-64 border-t border-neutral-400 pt-1">
          <p>{quote.createdByUserName || company?.nomeResponsavel || "Responsável"}</p>
          <p className="text-[0.75em] text-neutral-500">{company?.nomeFantasia || company?.razaoSocial}</p>
        </div>
      </div>
    </div>
  );
}
