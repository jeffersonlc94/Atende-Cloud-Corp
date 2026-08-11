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
