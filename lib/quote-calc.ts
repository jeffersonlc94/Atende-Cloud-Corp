// Cálculo de totais de orçamento (itens + desconto geral).
// Usado tanto no client (preview em tempo real) quanto no server (fonte da
// verdade, persistido no banco).

export type DescontoTipo = "Valor" | "Percentual";
export type TipoItem = "Produto" | "Servico";

export function computeUnitPriceFromMargin(
  custoUnitario: number,
  margemPercentual: number,
  freteUnitario = 0
): number {
  return Math.round((custoUnitario * (1 + margemPercentual / 100) + freteUnitario) * 100) / 100;
}

export function aplicarDesconto(
  base: number,
  tipo: DescontoTipo | null | undefined,
  valor: number | null | undefined
): number {
  if (!tipo || !valor || valor <= 0) return base;
  const desconto = tipo === "Percentual" ? base * (valor / 100) : valor;
  return Math.max(0, base - desconto);
}

export function computeItemTotal(
  quantidade: number,
  valorUnitario: number,
  descontoTipo?: DescontoTipo | null,
  descontoValor?: number | null
): number {
  const bruto = quantidade * valorUnitario;
  const comDesconto = aplicarDesconto(bruto, descontoTipo, descontoValor);
  return Math.round(comDesconto * 100) / 100;
}

export function computeQuoteTotals<
  T extends {
    quantidade: number;
    valorUnitario: number;
    descontoTipo?: DescontoTipo | null;
    descontoValor?: number | null;
    tipoItem?: TipoItem | null;
  }
>(
  itens: T[],
  descontoGeralTipo?: DescontoTipo | null,
  descontoGeralValor?: number | null,
  descontoProdutosTipo?: DescontoTipo | null,
  descontoProdutosValor?: number | null,
  descontoServicosTipo?: DescontoTipo | null,
  descontoServicosValor?: number | null
) {
  const itensComputados = itens.map((item) => ({
    ...item,
    valorTotal: computeItemTotal(
      item.quantidade,
      item.valorUnitario,
      item.descontoTipo,
      item.descontoValor
    ),
  }));

  const subtotal = Math.round(
    itensComputados.reduce((acc, i) => acc + i.valorTotal, 0) * 100
  ) / 100;

  const totalProdutos = Math.round(
    itensComputados
      .filter((i) => (i.tipoItem ?? "Produto") === "Produto")
      .reduce((acc, i) => acc + i.valorTotal, 0) * 100
  ) / 100;

  const totalServicos = Math.round(
    itensComputados
      .filter((i) => i.tipoItem === "Servico")
      .reduce((acc, i) => acc + i.valorTotal, 0) * 100
  ) / 100;

  const totalProdutosComDesconto = aplicarDesconto(totalProdutos, descontoProdutosTipo, descontoProdutosValor);
  const totalServicosComDesconto = aplicarDesconto(totalServicos, descontoServicosTipo, descontoServicosValor);
  const descontoProdutos = Math.round((totalProdutos - totalProdutosComDesconto) * 100) / 100;
  const descontoServicos = Math.round((totalServicos - totalServicosComDesconto) * 100) / 100;
  const subtotalComDescontos = Math.round((totalProdutosComDesconto + totalServicosComDesconto) * 100) / 100;
  const total = Math.round(aplicarDesconto(subtotalComDescontos, descontoGeralTipo, descontoGeralValor) * 100) / 100;

  const descontoGeral = Math.round((subtotalComDescontos - total) * 100) / 100;
  const desconto = Math.round((subtotal - total) * 100) / 100;

  return { itensComputados, subtotal, totalProdutos, totalServicos, descontoProdutos, descontoServicos, descontoGeral, desconto, total };
}
