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
};

export const acaoLabels: Record<string, string> = {
  backup: "Backup",
  create: "Criação",
  update: "Atualização",
  delete: "Exclusão",
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
  clientId: "Cliente", companyId: "Empresa", visibilidade: "Visibilidade", itens: "Itens",
  razaoSocial: "Razão social", nomeFantasia: "Nome fantasia", cnpj: "CNPJ",
  placa: "Placa", marca: "Marca", modelo: "Modelo", kmAtual: "Quilometragem",
  descricao: "Descrição", quantidade: "Quantidade", valorUnitario: "Valor unitário",
  observacoes: "Observações", updatedByUserId: "Atualizado por",
};

export function labelForAuditField(field: string): string {
  return auditFieldLabels[field] ?? field.replace(/([a-z])([A-Z])/g, "$1 $2");
}
