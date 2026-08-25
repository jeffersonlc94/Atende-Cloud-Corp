import { z } from "zod";

export const supplierSchema = z.object({
  razaoSocial: z.string().trim().min(1, "Nome ou razão social é obrigatório").max(200),
  nomeFantasia: z.string().trim().max(200).optional().default(""),
  cnpjCpf: z.string().trim().max(30).optional().default(""),
  telefone: z.string().trim().max(30).optional().default(""),
  email: z.union([z.literal(""), z.string().email("E-mail inválido")]).optional().default(""),
  endereco: z.string().trim().max(300).optional().default(""),
  contato: z.string().trim().max(150).optional().default(""),
  observacoes: z.string().trim().max(1000).optional().default(""),
});

export const supplierQuotationStatuses = ["Rascunho", "EmCotacao", "Recebida", "Aprovada", "NaoAprovada", "Finalizada"] as const;
export const supplierQuotationTypes = ["FornecedorUnico", "MultiplosFornecedores"] as const;

const quotationItemSchema = z.object({
  ordem: z.number().int().nonnegative(),
  supplierId: z.string().trim().optional().default(""),
  codigoProduto: z.string().trim().max(80).optional().default(""),
  codigoFornecedor: z.string().trim().max(80).optional().default(""),
  descricao: z.string().trim().min(1, "Descrição do item é obrigatória").max(500),
  fotoUrl: z.string().trim().optional().default(""),
  quantidade: z.number().positive("Quantidade deve ser maior que zero"),
  valorUnitario: z.number().positive("Valor unitário deve ser maior que zero"),
  observacao: z.string().trim().max(500).optional().default(""),
});

export const supplierQuotationSchema = z.object({
  numero: z.string().trim().max(30).optional().default(""),
  companyId: z.string().min(1, "Empresa emissora é obrigatória"),
  tipo: z.enum(supplierQuotationTypes),
  primarySupplierId: z.string().trim().optional().default(""),
  referencia: z.string().trim().max(250).optional().default(""),
  dataCotacao: z.string().min(1, "Data é obrigatória"),
  observacoes: z.string().trim().max(2000).optional().default(""),
  observacoesInternas: z.string().trim().max(2000).optional().default(""),
  status: z.enum(supplierQuotationStatuses),
  itens: z.array(quotationItemSchema).min(1, "Adicione pelo menos um item"),
}).superRefine((data, ctx) => {
  if (data.tipo === "FornecedorUnico" && !data.primarySupplierId) {
    ctx.addIssue({ code: "custom", path: ["primarySupplierId"], message: "Fornecedor é obrigatório" });
  }
  data.itens.forEach((item, index) => {
    if (data.tipo === "MultiplosFornecedores" && !item.supplierId) {
      ctx.addIssue({ code: "custom", path: ["itens", index, "supplierId"], message: "Fornecedor é obrigatório" });
    }
  });
});

export type SupplierFormValues = z.input<typeof supplierSchema>;
export type SupplierQuotationFormValues = z.input<typeof supplierQuotationSchema>;

export function calculateSupplierQuotationTotal(items: SupplierQuotationFormValues["itens"]): number {
  return items.reduce((total, item) => total + (Number(item.quantidade) || 0) * (Number(item.valorUnitario) || 0), 0);
}
