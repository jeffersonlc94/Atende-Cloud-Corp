import { z } from "zod";

export const quoteItemSchema = z.object({
  id: z.string().optional(),
  ordem: z.number().int().nonnegative(),
  descricao: z.string().min(1, "Descrição obrigatória"),
  quantidade: z.number().positive("Quantidade deve ser maior que zero"),
  valorUnitario: z.number().nonnegative("Valor unitário não pode ser negativo"),
});

export const quoteSchema = z.object({
  numero: z.string().trim().optional().default(""),
  companyId: z.string().min(1, "Selecione a empresa emissora"),
  clientNome: z.string().min(1, "Informe o cliente"),
  referencia: z.string().optional().default(""),
  dataEmissao: z.string().min(1, "Informe a data de emissão"),
  validadeDias: z.number().int().positive().default(15),
  condicoesPagamento: z.string().optional().default(""),
  prazoEntrega: z.string().optional().default(""),
  observacoes: z.string().optional().default(""),
  itens: z.array(quoteItemSchema).min(1, "Adicione ao menos um item"),
});

export type QuoteFormValues = z.input<typeof quoteSchema>;
export type QuoteItemFormValues = z.input<typeof quoteItemSchema>;

export const companySchema = z.object({
  razaoSocial: z.string().min(1, "Razão social obrigatória"),
  nomeFantasia: z.string().optional().default(""),
  cnpj: z.string().optional().default(""),
  inscricaoEstadual: z.string().optional().default(""),
  endereco: z.string().optional().default(""),
  cidade: z.string().optional().default(""),
  estado: z.string().optional().default(""),
  cep: z.string().optional().default(""),
  telefone1: z.string().optional().default(""),
  telefone2: z.string().optional().default(""),
  email: z.string().optional().default(""),
  site: z.string().optional().default(""),
  logoUrl: z.string().optional().default(""),
  nomeResponsavel: z.string().optional().default(""),
});

export type CompanyFormValues = z.input<typeof companySchema>;

// ---------------------------------------------------------------------------
// Gestão de Frota
// ---------------------------------------------------------------------------

export const combustivelOptions = [
  "Gasolina",
  "Etanol",
  "Flex",
  "Diesel",
  "GNV",
  "Eletrico",
  "Hibrido",
] as const;

export const situacaoVeiculoOptions = ["Ativo", "Inativo", "Manutencao"] as const;

export const tipoDocumentoOptions = [
  "CRLV",
  "Seguro",
  "IPVA",
  "Licenciamento",
  "Outro",
] as const;

export const tipoChecklistOptions = ["Diario", "Semanal", "Mensal"] as const;

export const checklistItemTipoOptions = [
  "Pneus",
  "Freios",
  "Luzes",
  "Oleo",
  "Agua",
  "Motor",
  "Suspensao",
  "Bateria",
  "Documentacao",
] as const;

export const checklistItemStatusOptions = ["OK", "Atencao", "NecessitaManutencao"] as const;

export const tipoEventoAgendaOptions = [
  "Manutencao",
  "TrocaOleo",
  "Documento",
  "Checklist",
  "Outro",
] as const;

export const vehicleSchema = z.object({
  fotoUrl: z.string().optional().default(""),
  placa: z.string().min(1, "Placa obrigatória"),
  marca: z.string().min(1, "Marca obrigatória"),
  modelo: z.string().min(1, "Modelo obrigatório"),
  versao: z.string().optional().default(""),
  ano: z.number().int().min(1900, "Ano inválido"),
  cor: z.string().optional().default(""),
  renavam: z.string().optional().default(""),
  chassi: z.string().optional().default(""),
  combustivel: z.enum(combustivelOptions).default("Flex"),
  companyId: z.string().min(1, "Selecione a empresa responsável"),
  kmAtual: z.number().int().nonnegative().default(0),
  situacao: z.enum(situacaoVeiculoOptions).default("Ativo"),
  dataAquisicao: z.string().optional().default(""),
  observacoes: z.string().optional().default(""),
});

export type VehicleFormValues = z.input<typeof vehicleSchema>;

export const vehicleDocumentSchema = z.object({
  vehicleId: z.string().min(1),
  tipo: z.enum(tipoDocumentoOptions).default("Outro"),
  arquivoUrl: z.string().optional().default(""),
  dataEmissao: z.string().optional().default(""),
  dataVencimento: z.string().optional().default(""),
});

export type VehicleDocumentFormValues = z.input<typeof vehicleDocumentSchema>;

export const mileageLogSchema = z.object({
  vehicleId: z.string().min(1),
  data: z.string().min(1, "Informe a data"),
  km: z.number().int().nonnegative("KM inválido"),
});

export type MileageLogFormValues = z.input<typeof mileageLogSchema>;

export const oilChangeSchema = z.object({
  vehicleId: z.string().min(1),
  data: z.string().min(1, "Informe a data"),
  km: z.number().int().nonnegative(),
  tipoOleo: z.string().optional().default(""),
  quantidade: z.number().nonnegative().optional(),
  oficina: z.string().optional().default(""),
  valor: z.number().nonnegative().optional(),
  observacoes: z.string().optional().default(""),
  kmProximaTroca: z.number().int().nonnegative().optional(),
});

export type OilChangeFormValues = z.input<typeof oilChangeSchema>;

export const maintenanceSchema = z.object({
  vehicleId: z.string().min(1),
  tipo: z.string().min(1, "Informe o tipo de manutenção"),
  data: z.string().min(1, "Informe a data"),
  oficina: z.string().optional().default(""),
  valor: z.number().nonnegative().optional(),
  km: z.number().int().nonnegative().optional(),
  responsavelUserId: z.string().optional().default(""),
  descricao: z.string().optional().default(""),
});

export type MaintenanceFormValues = z.input<typeof maintenanceSchema>;

export const checklistItemInputSchema = z.object({
  item: z.enum(checklistItemTipoOptions),
  status: z.enum(checklistItemStatusOptions).default("OK"),
});

export const checklistSchema = z.object({
  vehicleId: z.string().min(1),
  tipo: z.enum(tipoChecklistOptions).default("Diario"),
  data: z.string().min(1, "Informe a data"),
  hora: z.string().optional().default(""),
  km: z.number().int().nonnegative().optional(),
  observacoes: z.string().optional().default(""),
  itens: z.array(checklistItemInputSchema).min(1, "Adicione ao menos um item"),
});

export type ChecklistFormValues = z.input<typeof checklistSchema>;

export const fuelSchema = z.object({
  vehicleId: z.string().min(1),
  data: z.string().min(1, "Informe a data"),
  km: z.number().int().nonnegative().optional(),
  litros: z.number().positive("Litros deve ser maior que zero"),
  valorLitro: z.number().positive("Valor por litro deve ser maior que zero"),
  posto: z.string().optional().default(""),
  tipoCombustivel: z.enum(combustivelOptions).default("Flex"),
});

export type FuelFormValues = z.input<typeof fuelSchema>;

export const calendarEventSchema = z.object({
  vehicleId: z.string().optional().default(""),
  titulo: z.string().min(1, "Informe o título"),
  data: z.string().min(1, "Informe a data"),
  descricao: z.string().optional().default(""),
  tipo: z.enum(tipoEventoAgendaOptions).default("Outro"),
});

export type CalendarEventFormValues = z.input<typeof calendarEventSchema>;

// ---------------------------------------------------------------------------
// Fase 3: usuários
// ---------------------------------------------------------------------------

export const roleOptions = ["ADMIN", "USER"] as const;

export const userSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  email: z.string().email("E-mail inválido"),
  password: z.string().optional().default(""),
  role: z.enum(roleOptions).default("USER"),
});

export type UserFormValues = z.input<typeof userSchema>;
