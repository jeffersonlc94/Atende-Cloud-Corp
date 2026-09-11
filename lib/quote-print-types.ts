import { formatCurrencyBRL } from "@/lib/format";
import { aplicarDesconto } from "@/lib/quote-calc";

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
  observacao?: string | null;
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
  createdByUserName?: string | null;
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
  descontoProdutosTipo?: "Valor" | "Percentual" | null;
  descontoProdutosValor?: number | string | null;
  descontoServicosTipo?: "Valor" | "Percentual" | null;
  descontoServicosValor?: number | string | null;
  total: number | string;
};

export const quotePrintLayoutOptions = [
  { value: "classico", label: "Clássico" },
  { value: "moderno", label: "Moderno" },
  { value: "minimalista", label: "Minimalista" },
  { value: "produtos", label: "Produtos em destaque" },
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
  const totalProdutosNum = quote.itens
    .filter((item) => (item.tipoItem ?? "Produto") === "Produto")
    .reduce((acc, item) => acc + Number(item.valorTotal), 0);

  const totalServicosNum = quote.itens
    .filter((item) => item.tipoItem === "Servico")
    .reduce((acc, item) => acc + Number(item.valorTotal), 0);

  const descontoProdutosNum = totalProdutosNum - aplicarDesconto(totalProdutosNum, quote.descontoProdutosTipo, Number(quote.descontoProdutosValor) || 0);
  const descontoServicosNum = totalServicosNum - aplicarDesconto(totalServicosNum, quote.descontoServicosTipo, Number(quote.descontoServicosValor) || 0);
  const subtotalAposCategorias = totalProdutosNum + totalServicosNum - descontoProdutosNum - descontoServicosNum;
  const descontoGeralNum = Math.max(0, subtotalAposCategorias - totalNum);
  const hasDescontoGeral = descontoGeralNum > 0.001;

  return {
    hasItemDesconto,
    subtotalNum,
    totalNum,
    hasDescontoGeral,
    descontoGeralNum,
    totalProdutosNum,
    totalServicosNum,
    descontoProdutosNum,
    descontoServicosNum,
  };
}
