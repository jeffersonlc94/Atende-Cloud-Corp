// Traduz os valores técnicos gravados em AuditLog (entidade/ação em inglês)
// para rótulos em português, reutilizados no filtro e na listagem de Auditoria.

export const entidadeOptions = [
  "Company",
  "Quote",
  "Vehicle",
  "Maintenance",
  "OilChange",
  "Checklist",
  "User",
  "SystemSettings",
  "Database",
  "Supplier",
  "SupplierQuotation",
  "TechnicalFile",
  "TechnicalCategory",
] as const;

export const entidadeLabels: Record<string, string> = {
  Database: "Banco de dados",
  Company: "Empresa",
  Quote: "Orçamento",
  Vehicle: "Veículo",
  Maintenance: "Manutenção",
  OilChange: "Troca de Óleo",
  Checklist: "Checklist",
  User: "Usuário",
  SystemSettings: "Configurações do Sistema",
  Supplier: "Fornecedor",
  SupplierQuotation: "Cotação de fornecedor",
  TechnicalFile: "Arquivo técnico",
  TechnicalCategory: "Categoria de arquivo técnico",
};

export const acaoLabels: Record<string, string> = {
  backup: "Backup",
  create: "Criação",
  update: "Atualização",
  delete: "Exclusão",
  download: "Download",
};

export function labelForEntidade(entidade: string): string {
  return entidadeLabels[entidade] ?? entidade;
}

export function labelForAcao(acao: string): string {
  return acaoLabels[acao] ?? acao;
}

const auditFieldLabels: Record<string, string> = {
  name: "Nome", email: "E-mail", role: "Perfil", cargo: "Cargo", status: "Status",
  numero: "Número", referencia: "Referência", total: "Total", subtotal: "Subtotal",
  dataEmissao: "Data de emissão", dataValidade: "Data de validade", validadeDias: "Validade em dias",
  descontoGeralTipo: "Tipo do desconto geral", descontoGeralValor: "Desconto geral",
  descontoProdutosTipo: "Tipo do desconto em produtos", descontoProdutosValor: "Desconto em produtos",
  descontoServicosTipo: "Tipo do desconto em serviços", descontoServicosValor: "Desconto em serviços",
  condicoesPagamento: "Condições de pagamento", prazoEntrega: "Prazo de entrega",
  observacoesInternas: "Observações internas", tipoItem: "Tipo do item",
  valorTotal: "Valor total", margemLucro: "Margem de lucro", freteUnitario: "Frete unitário",
  freteHabilitado: "Frete habilitado", calcularPorMargem: "Cálculo por margem",
  clientId: "Cliente", companyId: "Empresa", visibilidade: "Visibilidade", itens: "Itens",
  razaoSocial: "Razão social", nomeFantasia: "Nome fantasia", cnpj: "CNPJ",
  placa: "Placa", marca: "Marca", modelo: "Modelo", kmAtual: "Quilometragem",
  descricao: "Descrição", observacao: "Observação do item", quantidade: "Quantidade", valorUnitario: "Valor unitário",
  observacoes: "Observações", updatedByUserId: "Atualizado por",
  supplierId: "Fornecedor", primarySupplierId: "Fornecedor principal", tipo: "Tipo da cotação",
  dataCotacao: "Data da cotação", codigoProduto: "Código do produto", codigoFornecedor: "Código do fornecedor",
  fabricante: "Fabricante", produto: "Produto / modelo", versao: "Versão",
  sistemaOperacional: "Sistema operacional", categoryId: "Categoria", nomeOriginal: "Nome do arquivo",
};

export function labelForAuditField(field: string): string {
  return auditFieldLabels[field] ?? field.replace(/([a-z])([A-Z])/g, "$1 $2");
}
