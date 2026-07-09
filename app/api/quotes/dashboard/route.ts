import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [totalCount, allQuotes, monthAgg, yearAgg, lastQuotes, byCompany] =
    await Promise.all([
      prisma.quote.count(),
      prisma.quote.aggregate({ _sum: { total: true }, _avg: { total: true } }),
      prisma.quote.aggregate({
        where: { dataEmissao: { gte: startOfMonth } },
        _sum: { total: true },
        _count: true,
      }),
      prisma.quote.aggregate({
        where: { dataEmissao: { gte: startOfYear } },
        _sum: { total: true },
        _count: true,
      }),
      prisma.quote.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          company: { select: { razaoSocial: true, nomeFantasia: true } },
          client: { select: { nome: true } },
        },
      }),
      prisma.quote.groupBy({
        by: ["companyId"],
        _count: { _all: true },
        orderBy: { _count: { companyId: "desc" } },
        take: 5,
      }),
    ]);

  const companies = await prisma.company.findMany({
    where: { id: { in: byCompany.map((b) => b.companyId) } },
    select: { id: true, razaoSocial: true, nomeFantasia: true },
  });

  const topCompanies = byCompany.map((b) => {
    const company = companies.find((c) => c.id === b.companyId);
    return {
      companyId: b.companyId,
      nome: company?.nomeFantasia || company?.razaoSocial || "—",
      total: b._count._all,
    };
  });

  // Série mensal (últimos 12 meses)
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const quotesForChart = await prisma.quote.findMany({
    where: { dataEmissao: { gte: twelveMonthsAgo } },
    select: { dataEmissao: true, total: true },
  });

  const monthly: Record<string, { count: number; total: number }> = {};
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthly[key] = { count: 0, total: 0 };
  }
  for (const q of quotesForChart) {
    const d = new Date(q.dataEmissao);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (monthly[key]) {
      monthly[key].count += 1;
      monthly[key].total += Number(q.total);
    }
  }

  const monthNames = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez",
  ];

  const monthlySeries = Object.entries(monthly).map(([key, v]) => {
    const [, m] = key.split("-");
    return {
      mes: monthNames[parseInt(m, 10) - 1],
      total: v.total,
      quantidade: v.count,
    };
  });

  return NextResponse.json({
    totalOrcamentos: totalCount,
    valorTotal: Number(allQuotes._sum.total ?? 0),
    valorMedio: Number(allQuotes._avg.total ?? 0),
    totalMes: Number(monthAgg._sum.total ?? 0),
    quantidadeMes: monthAgg._count,
    totalAno: Number(yearAgg._sum.total ?? 0),
    quantidadeAno: yearAgg._count,
    ultimosOrcamentos: lastQuotes,
    topEmpresas: topCompanies,
    serieMensal: monthlySeries,
  });
}
