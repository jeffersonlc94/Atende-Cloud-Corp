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
