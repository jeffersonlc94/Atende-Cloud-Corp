import { z } from "zod";

export const descontoTipoOptions = ["Valor", "Percentual"] as const;

export const tipoItemOptions = ["Produto", "Servico"] as const;

const optionalDescontoTipo = z.enum(descontoTipoOptions).optional();

const optionalDescontoValor = z.preprocess(
  (v) => (v === "" || v === undefined || v === null || (typeof v === "number" && Number.isNaN(v)) ? undefined : v),
  z.number().nonnegative("Desconto não pode ser negativo").optional()
);

export const quoteItemSchema = z.object({
  id: z.string().optional(),
  ordem: z.number().int().nonnegative(),
  tipoItem: z.enum(tipoItemOptions).default("Produto"),
  descricao: z.string().min(1, "Descrição obrigatória"),
  fotoUrl: z.string().optional(),
  quantidade: z.number().positive("Quantidade deve ser maior que zero"),
  valorUnitario: z.preprocess(
    (v) => (v === null || (typeof v === "number" && Number.isNaN(v)) ? undefined : v),
    z.number({ error: "Informe o valor unitário" }).positive("Valor unitário deve ser maior que zero")
  ),
  calcularPorMargem: z.boolean().optional().default(false),
  custoUnitario: z.preprocess(
    (v) => (v === undefined || v === null || (typeof v === "number" && Number.isNaN(v)) ? undefined : v),
    z.number().positive("Custo unitário deve ser maior que zero").optional()
  ),
  margemLucro: z.preprocess(
    (v) => (v === undefined || v === null || (typeof v === "number" && Number.isNaN(v)) ? undefined : v),
    z.number().nonnegative("Margem não pode ser negativa").optional()
  ),
  freteHabilitado: z.boolean().optional().default(false),
  freteUnitario: z.preprocess(
    (v) => (v === undefined || v === null || (typeof v === "number" && Number.isNaN(v)) ? undefined : v),
    z.number().positive("Frete deve ser maior que zero").optional()
  ),
  descontoTipo: optionalDescontoTipo,
  descontoValor: optionalDescontoValor,
}).superRefine((item, ctx) => {
  if (item.calcularPorMargem && item.custoUnitario === undefined) {
    ctx.addIssue({ code: "custom", path: ["custoUnitario"], message: "Informe o custo unitário" });
  }
  if (item.calcularPorMargem && item.margemLucro === undefined) {
    ctx.addIssue({ code: "custom", path: ["margemLucro"], message: "Informe a margem" });
  }
  if (item.freteHabilitado && item.freteUnitario === undefined) {
    ctx.addIssue({ code: "custom", path: ["freteUnitario"], message: "Informe o valor do frete" });
  }
});

export const visibilidadeOptions = ["Global", "Privado"] as const;
export const quoteStatusOptions = ["Negociacao", "Enviado", "NaoAprovado", "Aprovado"] as const;

export const quoteSchema = z.object({
  numero: z.string().trim().optional().default(""),
  companyId: z.string().min(1, "Selecione a empresa emissora"),
  clientNome: z.string().min(1, "Informe o cliente"),
  referencia: z.string().optional().default(""),
  dataEmissao: z.string().min(1, "Informe a data de emissão"),
  validadeDias: z.preprocess(
    (v) => (v === undefined || v === null || (typeof v === "number" && Number.isNaN(v)) ? undefined : v),
    z.number().int().positive().optional()
  ),
  condicoesPagamento: z.string().optional().default(""),
  prazoEntrega: z.string().optional().default(""),
  observacoes: z.string().optional().default(""),
  observacoesInternas: z.string().optional().default(""),
  visibilidade: z.enum(visibilidadeOptions).default("Global"),
  status: z.enum(quoteStatusOptions).default("Negociacao"),
  itens: z.array(quoteItemSchema).min(1, "Adicione ao menos um item"),
  descontoGeralTipo: optionalDescontoTipo,
  descontoGeralValor: optionalDescontoValor,
  descontoProdutosTipo: optionalDescontoTipo,
  descontoProdutosValor: optionalDescontoValor,
  descontoServicosTipo: optionalDescontoTipo,
  descontoServicosValor: optionalDescontoValor,
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
  isDefault: z.boolean().optional().default(false),
});

export type CompanyFormValues = z.input<typeof companySchema>;

export const notificationTipoOptions = [
  "checklist",
  "documento_vencendo",
  "documento_vencido",
  "troca_oleo_proxima",
  "troca_oleo_vencida",
] as const;

export const notificationCargoPrefsSchema = z.record(
  z.string(),
  z.record(z.string(), z.boolean())
);

export const systemSettingsSchema = z.object({
  systemName: z.string().optional().default(""),
  logoUrl: z.string().optional().default(""),
  faviconUrl: z.string().optional().default(""),
  primaryColor: z.string().optional().default(""),
  sidebarColor: z.string().optional().default(""),
  buttonColor: z.string().optional().default(""),
  accentColor: z.string().optional().default(""),
  autoLogoutMinutes: z.number().int().nonnegative().optional(),
  notificationCargoPrefs: notificationCargoPrefsSchema.optional(),
});

export type SystemSettingsFormValues = z.input<typeof systemSettingsSchema>;

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

export const categoriaVeiculoOptions = [
  "Carro de Passeio",
  "Caminhonete",
  "Utilitário",
  "Caminhão",
  "Moto",
  "Ônibus",
  "Outro",
] as const;

export const tracaoOptions = ["4x2", "4x4", "Dianteira", "Traseira"] as const;

export const tipoUsoOptions = ["Próprio", "Alugado", "Terceirizado"] as const;

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
  "EquipObrigatorio",
] as const;

export const checklistItemTipoLabels: Record<(typeof checklistItemTipoOptions)[number], string> = {
  Pneus: "Pneus",
  Freios: "Freios",
  Luzes: "Luzes",
  Oleo: "Óleo",
  Agua: "Água",
  Motor: "Motor",
  Suspensao: "Suspensão",
  Bateria: "Bateria",
  Documentacao: "Documentação",
  EquipObrigatorio: "Equip. obrigatório",
};

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
  nome: z.string().optional().default(""),
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
  categoria: z.enum(categoriaVeiculoOptions).optional(),
  capacidadeCarga: z.preprocess(
    (v) => (v === undefined || v === null || (typeof v === "number" && Number.isNaN(v)) ? undefined : v),
    z.number().int().nonnegative().optional()
  ),
  potencia: z.preprocess(
    (v) => (v === undefined || v === null || (typeof v === "number" && Number.isNaN(v)) ? undefined : v),
    z.number().int().nonnegative().optional()
  ),
  tracao: z.enum(tracaoOptions).optional(),
  oilChangeIntervalKm: z.preprocess(
    (v) => (v === undefined || v === null || (typeof v === "number" && Number.isNaN(v)) ? undefined : v),
    z.number().int().positive().optional()
  ),
  tipoUso: z.enum(tipoUsoOptions).optional(),
  valorAquisicao: z.preprocess(
    (v) => (v === undefined || v === null || (typeof v === "number" && Number.isNaN(v)) ? undefined : v),
    z.number().nonnegative().optional()
  ),
  observacoesAdicionais: z.string().max(300, "Máximo de 300 caracteres").optional().default(""),
  dataAquisicao: z.string().optional().default(""),
  observacoes: z.string().max(500, "Máximo de 500 caracteres").optional().default(""),
});

export type VehicleFormValues = z.input<typeof vehicleSchema>;

export const vehicleDocumentSchema = z.object({
  vehicleId: z.string().min(1),
  tipo: z.enum(tipoDocumentoOptions).default("Outro"),
  arquivado: z.boolean().optional().default(false),
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
  vehicleId: z.string().min(1, "Selecione o veículo"),
  tipo: z.enum(tipoChecklistOptions).default("Diario"),
  data: z.string().min(1, "Informe a data"),
  hora: z.string().optional().default(""),
  km: z.number().int().min(1, "Informe o KM atual"),
  statusGeral: z.enum(checklistItemStatusOptions).default("OK"),
  observacoes: z.string().optional().default(""),
  fotos: z.array(z.string()).optional().default([]),
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
export const cargoOptions = ["TECNICO", "VENDEDOR"] as const;

export const userSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  email: z.string().email("E-mail inválido"),
  password: z.string().optional().default(""),
  role: z.enum(roleOptions).default("USER"),
  cargo: z.enum(cargoOptions).optional(),
  canAccessOrcamentos: z.boolean().optional().default(true),
  canAccessFrota: z.boolean().optional().default(true),
  canAccessEstoque: z.boolean().optional().default(true),
  receiveNotifications: z.boolean().optional().default(true),
  telegramChatId: z.string().optional().default(""),
});

export type UserFormValues = z.input<typeof userSchema>;

export const profileSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  email: z.string().email("E-mail inválido"),
  avatarUrl: z.string().optional().default(""),
  password: z.string().optional().default(""),
  confirmPassword: z.string().optional().default(""),
});

export type ProfileFormValues = z.input<typeof profileSchema>;

// ---------------------------------------------------------------------------
// Controle de Estoque
// ---------------------------------------------------------------------------

export const stockStatusOptions = ["Pendente", "Devolvido", "Vendido"] as const;

export const stockMovementSchema = z.object({
  cod: z.string().min(1, "Código obrigatório"),
  descricao: z.string().min(1, "Descrição obrigatória"),
  qtd: z.number().int().positive().default(1),
  respRetirada: z.string().min(1, "Responsável pela retirada obrigatório"),
  respEntrega: z.string().optional().default(""),
  data: z.string().min(1, "Informe a data"),
  numeroSerie: z.string().optional().default(""),
  destino: z.string().optional().default(""),
  devolvido: z.boolean().optional().default(false),
  status: z.enum(stockStatusOptions).optional().default("Pendente"),
  observacoes: z.string().optional().default(""),
});

export type StockMovementFormValues = z.input<typeof stockMovementSchema>;
