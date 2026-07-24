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

  const [logoError, setLogoError] = useState(false);

  const { hasItemDesconto, totalNum, hasDescontoGeral, descontoGeralNum, totalProdutosNum, totalServicosNum } =
    getQuotePrintTotals(quote);

  return (
    <div
      className="mx-auto w-full max-w-[210mm] bg-white text-slate-800 print:shadow-none"
      id={id}
    >
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-4 bg-slate-800 p-8 text-white">
        <div className="flex items-center gap-4">
          {company?.logoUrl && !logoError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={company.logoUrl}
              alt="Logo"
              className="h-16 w-16 shrink-0 rounded-full bg-white object-contain p-1"
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/10 text-white">
              <Building2 className="h-8 w-8" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold uppercase leading-tight">
              {company?.razaoSocial || "Empresa não selecionada"}
            </h1>
            {company?.nomeFantasia && (
              <p className="text-sm text-slate-300">{company.nomeFantasia}</p>
            )}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs uppercase tracking-widest text-slate-300">Orçamento</p>
          <p className="text-2xl font-bold">Nº {quote.numero || "------"}</p>
          <p className="text-xs text-slate-300">{formatDateBR(quote.dataEmissao)}</p>
        </div>
      </div>

      <div className="px-8">
        {/* Faixa de contato */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-slate-200 py-3 text-xs text-slate-500">
          {enderecoCompleto && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {enderecoCompleto}
            </span>
          )}
          {company?.telefone1 && (
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" /> {company.telefone1}
            </span>
          )}
          {company?.email && (
            <span className="flex items-center gap-1">
              <Mail className="h-3 w-3" /> {company.email}
            </span>
          )}
          {company?.site && (
            <span className="flex items-center gap-1">
              <Globe className="h-3 w-3" /> {company.site}
            </span>
          )}
          {(company?.cnpj || company?.inscricaoEstadual) && (
            <span>
              {company?.cnpj && `CNPJ: ${company.cnpj}`}
              {company?.cnpj && company?.inscricaoEstadual ? " · " : ""}
              {company?.inscricaoEstadual && `INSC: ${company.inscricaoEstadual}`}
            </span>
          )}
        </div>

        {/* Dados do cliente */}
        <div className="mt-5 grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Cliente
            </p>
            <p className="text-sm font-semibold text-slate-800">{quote.clienteNome || "—"}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Referência
            </p>
            <p className="text-sm font-semibold text-slate-800">{quote.referencia || "—"}</p>
          </div>
        </div>

        {/* Tabela de itens */}
        <table className="mt-5 w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-800 text-white">
              <th className="w-12 p-2 text-left font-medium first:rounded-l-md">Item</th>
              <th className="p-2 text-left font-medium">Descrição</th>
              <th className="w-16 p-2 text-center font-medium">Qtd</th>
              <th className="w-24 p-2 text-right font-medium">Unit.</th>
              {hasItemDesconto && <th className="w-20 p-2 text-right font-medium">Desc.</th>}
              <th className="w-28 p-2 text-right font-medium last:rounded-r-md">Total</th>
            </tr>
          </thead>
          <tbody>
            {quote.itens.length === 0 && (
              <tr>
                <td
                  colSpan={hasItemDesconto ? 6 : 5}
                  className="border-b border-slate-200 p-3 text-center text-slate-400"
                >
                  Nenhum item adicionado
                </td>
              </tr>
            )}
            {quote.itens.map((item, idx) => (
              <tr key={idx} className="border-b border-slate-100">
                <td className="p-2 text-slate-400">{idx + 1}</td>
                <td className="p-2">
                  {item.fotoUrl ? (
                    <div className="flex items-center gap-2">
                      <FotoThumb url={item.fotoUrl} alt={item.descricao} className="h-10 w-10 shrink-0" />
                      <span>{item.descricao}</span>
                    </div>
                  ) : (
                    item.descricao
                  )}
                </td>
                <td className="p-2 text-center">
                  {Number(item.quantidade).toLocaleString("pt-BR")}
                </td>
                <td className="p-2 text-right">{formatCurrencyBRL(Number(item.valorUnitario))}</td>
                {hasItemDesconto && (
                  <td className="p-2 text-right text-slate-500">{formatDescontoItem(item)}</td>
                )}
                <td className="p-2 text-right font-medium">
                  {formatCurrencyBRL(Number(item.valorTotal))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totais */}
        <div className="mt-4 flex justify-end">
          <div className="w-64 space-y-1 rounded-lg bg-slate-50 p-4 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Produtos</span>
              <span>{formatCurrencyBRL(totalProdutosNum)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Serviços</span>
              <span>{formatCurrencyBRL(totalServicosNum)}</span>
            </div>
            {hasDescontoGeral && (
              <div className="flex justify-between text-slate-500">
                <span>Desconto</span>
                <span>- {formatCurrencyBRL(descontoGeralNum)}</span>
              </div>
            )}
            <div className="border-t border-slate-200 pt-1" />
            <div className="flex justify-between text-base font-bold text-slate-800">
              <span>Total</span>
              <span>{formatCurrencyBRL(totalNum)}</span>
            </div>
          </div>
        </div>

        {/* Condições */}
        <div className="mt-4 space-y-1 text-sm text-slate-600">
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
              <span className="font-semibold text-slate-800">Observações:</span>{" "}
              {quote.observacoes}
            </p>
          )}
        </div>

        {/* Validade */}
        {quote.validadeDias ? (
          <p className="mt-4 rounded-md bg-amber-50 p-2 text-center text-sm font-semibold text-amber-700">
            Válido por {quote.validadeDias} dias corridos a partir da data de emissão.
          </p>
        ) : null}

        {/* Assinatura */}
        <div className="mt-14 flex flex-col items-center pb-8 text-center text-sm">
          <p className="text-slate-500">
            {(company?.cidade || "—")}, {formatDateBR(quote.dataEmissao)}
          </p>
          <div className="mt-12 w-64 border-t border-slate-400 pt-1">
            <p className="font-medium text-slate-800">{company?.nomeResponsavel || "Responsável"}</p>
            <p className="text-xs text-slate-500">{company?.nomeFantasia || company?.razaoSocial}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
