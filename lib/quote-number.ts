import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type TxClient = Prisma.TransactionClient | PrismaClient;

/**
 * Gera o próximo número sequencial de orçamento (ex: "000001").
 * Usa uma tabela contador com upsert atômico para evitar colisões.
 */
export async function generateNextQuoteNumber(
  tx: TxClient = prisma
): Promise<string> {
  const counter = await tx.quoteCounter.upsert({
    where: { id: "default" },
    update: { lastNum: { increment: 1 } },
    create: { id: "default", lastNum: 1 },
  });

  return counter.lastNum.toString().padStart(6, "0");
}
