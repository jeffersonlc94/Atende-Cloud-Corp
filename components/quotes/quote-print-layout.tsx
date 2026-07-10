"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";

export type QuotePrintCompany = {
  razaoSocial: string;
  nomeFantasia?: string | null;
  cnpj?: string | null;
  inscricaoEstadual?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
  telefone1?: string | null;
  telefone2?: string | null;
  email?: string | null;
  site?: string | null;
  logoUrl?: string | null;
  nomeResponsavel?: string | null;
};

export type QuotePrintItem = {
  descricao: string;
  quantidade: number | string;
  valorUnitario: number | string;
  valorTotal: number | string;
};

export type QuotePrintData = {
  numero: string;
  clienteNome: string;
  referencia?: string | null;
  dataEmissao: string | Date;
  validadeDias: number;
  condicoesPagamento?: string | null;
  prazoEntrega?: string | null;
  observacoes?: string | null;
  itens: QuotePrintItem[];
  total: number | string;
};

export function QuotePrintLayout({
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

  const telefones = [company?.telefone1, company?.telefone2].filter(Boolean).join(" | ");
  const [logoError, setLogoError] = useState(false);

  return (
    <div className="mx-auto w-full max-w-[210mm] bg-white p-8 text-black print:p-0 print:shadow-none" id={id}>
      {/* Cabeçalho */}
      <div className="border-b-2 border-black pb-4">
        <div className="flex items-center gap-4">
          {company?.logoUrl && !logoError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={company.logoUrl}
              alt="Logo"
              className="h-24 w-24 shrink-0 object-contain"
              onError={() => setLogoError(true)}
            />
          ) : company?.logoUrl && logoError ? (
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded border border-gray-300 bg-gray-100 text-gray-400">
              <Building2 className="h-10 w-10" />
            </div>
          ) : null}
          <div className="flex-1 text-center">
            <h1 className="text-lg font-bold uppercase leading-tight">
              {company?.razaoSocial || "Empresa não selecionada"}
            </h1>
            {company?.nomeFantasia && (
              <p className="text-xs italic text-gray-700">{company.nomeFantasia}</p>
            )}
            {(company?.cnpj || company?.inscricaoEstadual) && (
              <p className="text-xs italic text-gray-700">
                {company?.cnpj && `CNPJ: ${company.cnpj}`}
                {company?.cnpj && company?.inscricaoEstadual ? " " : ""}
                {company?.inscricaoEstadual && `INSC: ${company.inscricaoEstadual}`}
              </p>
            )}
            {enderecoCompleto && (
              <p className="text-xs italic text-gray-700">{enderecoCompleto}</p>
            )}
            {(telefones || company?.email) && (
              <p className="text-xs italic text-gray-700">
                {telefones}
                {telefones && company?.email ? " | " : ""}
                {company?.email}
              </p>
            )}
            {company?.site && <p className="text-xs italic text-gray-700">{company.site}</p>}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-2xl font-bold">Nº {quote.numero || "------"}</p>
            <p className="text-xs text-gray-700">
              Data: {formatDateBR(quote.dataEmissao)}
            </p>
          </div>
        </div>
        <p className="mt-3 text-center text-base font-bold uppercase tracking-widest">
          Orçamento
        </p>
      </div>

      {/* Dados do cliente */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-center text-sm">
        <p>
          <span className="font-semibold">CLIENTE:</span>{" "}
          {quote.clienteNome || "—"}
        </p>
        <p>
          <span className="font-semibold">REF.:</span> {quote.referencia || "—"}
        </p>
      </div>

      {/* Tabela de itens */}
      <table className="mt-4 w-full border-collapse text-sm">
        <thead>
          <tr className="border-y-2 border-black bg-sky-100">
            <th className="w-12 border border-gray-400 p-1.5 text-center">ITEM</th>
            <th className="border border-gray-400 p-1.5 text-center">DESCRIÇÃO</th>
            <th className="w-20 border border-gray-400 p-1.5 text-center">QTD</th>
            <th className="w-28 border border-gray-400 p-1.5 text-center">R$ UNIT</th>
            <th className="w-28 border border-gray-400 p-1.5 text-center">R$ TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {quote.itens.length === 0 && (
            <tr>
              <td colSpan={5} className="border border-gray-400 p-3 text-center text-gray-400">
                Nenhum item adicionado
              </td>
            </tr>
          )}
          {quote.itens.map((item, idx) => (
            <tr key={idx} className={idx % 2 === 1 ? "bg-gray-50" : undefined}>
              <td className="border border-gray-400 p-1.5 text-center">{idx + 1}</td>
              <td className="border border-gray-400 p-1.5 text-center">{item.descricao}</td>
              <td className="border border-gray-400 p-1.5 text-center">
                {Number(item.quantidade).toLocaleString("pt-BR")}
              </td>
              <td className="border border-gray-400 p-1.5 text-center">
                {formatCurrencyBRL(Number(item.valorUnitario))}
              </td>
              <td className="border border-gray-400 p-1.5 text-center">
                {formatCurrencyBRL(Number(item.valorTotal))}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-200 font-bold">
            <td colSpan={4} className="border border-gray-400 p-1.5 text-right">
              TOTAL
            </td>
            <td className="border border-gray-400 p-1.5 text-center">
              {formatCurrencyBRL(Number(quote.total))}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Condições */}
      <div className="mt-4 space-y-1 text-sm">
        {quote.condicoesPagamento && (
          <p>
            <span className="font-semibold">Condições de pagamento:</span>{" "}
            {quote.condicoesPagamento}
          </p>
        )}
        {quote.prazoEntrega && (
          <p>
            <span className="font-semibold">Prazo de entrega:</span>{" "}
            {quote.prazoEntrega}
          </p>
        )}
        {quote.observacoes && (
          <p>
            <span className="font-semibold">Observações:</span> {quote.observacoes}
          </p>
        )}
      </div>

      {/* Validade */}
      <p className="mt-4 text-center text-sm font-bold uppercase text-red-600">
        Validade da proposta: este orçamento é válido por {quote.validadeDias} dias
        corridos a partir da data de emissão.
      </p>

      {/* Assinatura */}
      <div className="mt-16 flex flex-col items-center text-center text-sm">
        <p>
          {(company?.cidade || "—")}, {formatDateBR(quote.dataEmissao)}
        </p>
        <div className="mt-12 w-64 border-t border-black text-center pt-1">
          <p>{company?.nomeResponsavel || "Responsável"}</p>
          <p className="text-xs text-gray-600">
            {company?.nomeFantasia || company?.razaoSocial}
          </p>
        </div>
      </div>
    </div>
  );
}
