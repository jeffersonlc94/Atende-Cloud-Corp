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
}: {
  company: QuotePrintCompany | null | undefined;
  quote: QuotePrintData;
  id?: string;
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
      className="mx-auto w-full max-w-[210mm] bg-white p-10 text-neutral-800 print:p-0 print:shadow-none"
      id={id}
    >
      {/* Cabeçalho */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {company?.logoUrl && !logoError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={company.logoUrl}
              alt="Logo"
              className="h-12 w-12 shrink-0 object-contain"
              onError={() => setLogoError(true)}
            />
          ) : null}
          <div>
            <p className="text-base font-medium tracking-tight">
              {company?.razaoSocial || "Empresa não selecionada"}
            </p>
            {company?.nomeFantasia && (
              <p className="text-xs text-neutral-400">{company.nomeFantasia}</p>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">Orçamento</p>
          <p className="text-lg font-medium">Nº {quote.numero || "------"}</p>
        </div>
      </div>

      <div className="mt-1 text-xs text-neutral-400">
        {[enderecoCompleto, telefones, company?.email, company?.site]
          .filter(Boolean)
          .join("  ·  ")}
        {(company?.cnpj || company?.inscricaoEstadual) && (
          <>
            {"  ·  "}
            {company?.cnpj && `CNPJ ${company.cnpj}`}
            {company?.cnpj && company?.inscricaoEstadual ? "  " : ""}
            {company?.inscricaoEstadual && `INSC ${company.inscricaoEstadual}`}
          </>
        )}
      </div>

      <div className="mt-8 h-px w-full bg-neutral-200" />

      {/* Dados do cliente */}
      <div className="mt-5 flex justify-between text-sm">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-neutral-400">Cliente</p>
          <p className="font-medium">{quote.clienteNome || "—"}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest text-neutral-400">Data</p>
          <p className="font-medium">{formatDateBR(quote.dataEmissao)}</p>
        </div>
        {quote.referencia && (
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-neutral-400">Referência</p>
            <p className="font-medium">{quote.referencia}</p>
          </div>
        )}
      </div>

      {/* Tabela de itens */}
      <table className="mt-8 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-neutral-800 text-[11px] uppercase tracking-wide text-neutral-500">
            <th className="pb-2 text-left font-normal">Descrição</th>
            <th className="w-16 pb-2 text-center font-normal">Qtd</th>
            <th className="w-24 pb-2 text-right font-normal">Unit.</th>
            {hasItemDesconto && <th className="w-20 pb-2 text-right font-normal">Desc.</th>}
            <th className="w-28 pb-2 text-right font-normal">Total</th>
          </tr>
        </thead>
        <tbody>
          {quote.itens.length === 0 && (
            <tr>
              <td
                colSpan={hasItemDesconto ? 5 : 4}
                className="border-b border-neutral-100 py-4 text-center text-neutral-400"
              >
                Nenhum item adicionado
              </td>
            </tr>
          )}
          {quote.itens.map((item, idx) => (
            <tr key={idx} className="border-b border-neutral-100">
              <td className="py-2">
                {item.fotoUrl ? (
                  <div className="flex items-center gap-2">
                    <FotoThumb url={item.fotoUrl} alt={item.descricao} className="h-10 w-10 shrink-0" />
                    <span>{item.descricao}</span>
                  </div>
                ) : (
                  item.descricao
                )}
              </td>
              <td className="py-2 text-center">
                {Number(item.quantidade).toLocaleString("pt-BR")}
              </td>
              <td className="py-2 text-right">{formatCurrencyBRL(Number(item.valorUnitario))}</td>
              {hasItemDesconto && (
                <td className="py-2 text-right text-neutral-500">{formatDescontoItem(item)}</td>
              )}
              <td className="py-2 text-right">{formatCurrencyBRL(Number(item.valorTotal))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totais */}
      <div className="mt-4 flex justify-end">
        <div className="w-56 space-y-1.5 text-sm">
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
          <div className="flex justify-between border-t border-neutral-800 pt-1.5 text-base font-medium">
            <span>Total</span>
            <span>{formatCurrencyBRL(totalNum)}</span>
          </div>
        </div>
      </div>

      {/* Condições */}
      <div className="mt-8 space-y-1 text-sm text-neutral-600">
        {quote.condicoesPagamento && (
          <p>
            <span className="text-neutral-400">Condições de pagamento — </span>
            {quote.condicoesPagamento}
          </p>
        )}
        {quote.prazoEntrega && (
          <p>
            <span className="text-neutral-400">Prazo de entrega — </span>
            {quote.prazoEntrega}
          </p>
        )}
        {quote.observacoes && (
          <p>
            <span className="text-neutral-400">Observações — </span>
            {quote.observacoes}
          </p>
        )}
      </div>

      {/* Validade */}
      {quote.validadeDias ? (
        <p className="mt-6 text-xs uppercase tracking-wide text-neutral-400">
          Proposta válida por {quote.validadeDias} dias corridos a partir da data de emissão.
        </p>
      ) : null}

      {/* Assinatura */}
      <div className="mt-16 flex flex-col items-center text-center text-sm">
        <p className="text-neutral-500">
          {(company?.cidade || "—")}, {formatDateBR(quote.dataEmissao)}
        </p>
        <div className="mt-12 w-64 border-t border-neutral-400 pt-1">
          <p>{company?.nomeResponsavel || "Responsável"}</p>
          <p className="text-xs text-neutral-500">{company?.nomeFantasia || company?.razaoSocial}</p>
        </div>
      </div>
    </div>
  );
}
