import { formatCurrencyBRL } from "@/lib/format";

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
  tipoItem?: "Produto" | "Servico" | null;
  fotoUrl?: string | null;
  quantidade: number | string;
  valorUnitario: number | string;
  descontoTipo?: "Valor" | "Percentual" | null;
  descontoValor?: number | string | null;
  valorTotal: number | string;
};

export type QuotePrintData = {
  numero: string;
  clienteNome: string;
  referencia?: string | null;
  dataEmissao: string | Date;
  validadeDias?: number | null;
  condicoesPagamento?: string | null;
  prazoEntrega?: string | null;
  observacoes?: string | null;
  itens: QuotePrintItem[];
  subtotal?: number | string | null;
  descontoGeralTipo?: "Valor" | "Percentual" | null;
  descontoGeralValor?: number | string | null;
  total: number | string;
};

export const quotePrintLayoutOptions = [
  { value: "classico", label: "Clássico" },
  { value: "moderno", label: "Moderno" },
  { value: "minimalista", label: "Minimalista" },
] as const;

export type QuotePrintLayoutId = (typeof quotePrintLayoutOptions)[number]["value"];

export function formatDescontoItem(item: QuotePrintItem): string {
  const valor = Number(item.descontoValor);
  if (!item.descontoTipo || !valor) return "—";
  return item.descontoTipo === "Percentual" ? `${valor}%` : formatCurrencyBRL(valor);
}

export function getQuotePrintTotals(quote: QuotePrintData) {
  const hasItemDesconto = quote.itens.some(
    (item) => item.descontoTipo && Number(item.descontoValor) > 0
  );
  const subtotalNum =
    quote.subtotal !== null && quote.subtotal !== undefined ? Number(quote.subtotal) : null;
  const totalNum = Number(quote.total);
  const hasDescontoGeral =
    (subtotalNum !== null && Math.abs(subtotalNum - totalNum) > 0.001) ||
    !!(quote.descontoGeralTipo && Number(quote.descontoGeralValor) > 0);
  const descontoGeralNum = subtotalNum !== null ? Math.max(0, subtotalNum - totalNum) : 0;

  const totalProdutosNum = quote.itens
    .filter((item) => (item.tipoItem ?? "Produto") === "Produto")
    .reduce((acc, item) => acc + Number(item.valorTotal), 0);
  const totalServicosNum = quote.itens
    .filter((item) => item.tipoItem === "Servico")
    .reduce((acc, item) => acc + Number(item.valorTotal), 0);

  return {
    hasItemDesconto,
    subtotalNum,
    totalNum,
    hasDescontoGeral,
    descontoGeralNum,
    totalProdutosNum,
    totalServicosNum,
  };
}
