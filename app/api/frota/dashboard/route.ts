import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { computeFleetAlerts } from "@/lib/frota-alerts";

const monthNames = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const [
    totalVeiculos,
    veiculosAtivos,
    veiculosManutencao,
    vehicles,
    checklistsSemana,
    maintenancesForChart,
    mileageLogsForChart,
    alerts,
  ] = await Promise.all([
    prisma.vehicle.count(),
    prisma.vehicle.count({ where: { situacao: "Ativo" } }),
    prisma.vehicle.count({ where: { situacao: "Manutencao" } }),
    prisma.vehicle.findMany({
      include: {
        company: { select: { razaoSocial: true, nomeFantasia: true } },
        documentos: true,
        oilChanges: { orderBy: { data: "desc" }, take: 1 },
        checklists: { orderBy: { data: "desc" }, take: 1 },
      },
      orderBy: { placa: "asc" },
    }),
    prisma.checklist.findMany({
      where: { data: { gte: startOfWeek } },
      include: { itens: true },
    }),
    prisma.maintenance.findMany({
      where: { data: { gte: twelveMonthsAgo } },
      select: { data: true, valor: true },
    }),
    prisma.mileageLog.findMany({
      where: { data: { gte: twelveMonthsAgo } },
      select: { data: true, km: true, vehicleId: true },
    }),
    computeFleetAlerts(),
  ]);

  // Manutenções por mês
  const monthly: Record<string, { count: number; valor: number }> = {};
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthly[key] = { count: 0, valor: 0 };
  }
  for (const m of maintenancesForChart) {
    const d = new Date(m.data);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (monthly[key]) {
      monthly[key].count += 1;
      monthly[key].valor += Number(m.valor ?? 0);
    }
  }
  const manutencoesPorMes = Object.entries(monthly).map(([key, v]) => {
    const [, mm] = key.split("-");
    return { mes: monthNames[parseInt(mm, 10) - 1], quantidade: v.count, valor: v.valor };
  });

  // Evolução de KM (soma dos registros por mês, todos os veículos)
  const kmMonthly: Record<string, number> = {};
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    kmMonthly[key] = 0;
  }
  for (const log of mileageLogsForChart) {
    const d = new Date(log.data);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (kmMonthly[key] !== undefined) kmMonthly[key] = Math.max(kmMonthly[key], log.km);
  }
  const evolucaoKm = Object.entries(kmMonthly).map(([key, km]) => {
    const [, mm] = key.split("-");
    return { mes: monthNames[parseInt(mm, 10) - 1], km };
  });

  // Donut de checklists da semana
  let ok = 0, atencao = 0, necessitaManutencao = 0;
  for (const c of checklistsSemana) {
    for (const item of c.itens) {
      if (item.status === "OK") ok += 1;
      else if (item.status === "Atencao") atencao += 1;
      else necessitaManutencao += 1;
    }
  }
  const checklistDonut = [
    { status: "OK", quantidade: ok },
    { status: "Atenção", quantidade: atencao },
    { status: "Necessita manutenção", quantidade: necessitaManutencao },
  ];

  const documentosVencendo = alerts.filter((a) => a.tipo === "documento").length;
  const trocasOleoProximas = alerts.filter((a) => a.tipo === "troca_oleo").length;
  const checklistsPendentes = alerts.filter((a) => a.tipo === "checklist").length;

  const veiculosTabela = vehicles.map((v) => {
    const lastChecklist = v.checklists[0];
    const docVencendo = v.documentos.some(
      (d) => d.dataVencimento && d.dataVencimento <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    );
    const lastOil = v.oilChanges[0];
    return {
      id: v.id,
      placa: v.placa,
      marca: v.marca,
      modelo: v.modelo,
      situacao: v.situacao,
      kmAtual: v.kmAtual,
      empresa: v.company?.nomeFantasia || v.company?.razaoSocial || "—",
      ultimoChecklist: lastChecklist?.data ?? null,
      documentoAlerta: docVencendo,
      kmProximaTroca: lastOil?.kmProximaTroca ?? null,
    };
  });

  return NextResponse.json({
    totalVeiculos,
    veiculosAtivos,
    veiculosManutencao,
    checklistsPendentes,
    manutencoesPendentes: veiculosManutencao,
    documentosVencendo,
    trocasOleoProximas,
    manutencoesPorMes,
    evolucaoKm,
    checklistDonut,
    veiculos: veiculosTabela,
    alertas: alerts.slice(0, 20),
  });
}
