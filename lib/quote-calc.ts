// Cálculo de totais de orçamento (itens + desconto geral).
// Usado tanto no client (preview em tempo real) quanto no server (fonte da
// verdade, persistido no banco).

export type DescontoTipo = "Valor" | "Percentual";

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
  }
>(
  itens: T[],
  descontoGeralTipo?: DescontoTipo | null,
  descontoGeralValor?: number | null
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

  const total = Math.round(
    aplicarDesconto(subtotal, descontoGeralTipo, descontoGeralValor) * 100
  ) / 100;

  return { itensComputados, subtotal, total };
}
