import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { computeFleetAlerts } from "@/lib/frota-alerts";

const monthNames = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

const KM_AVISO_TROCA_OLEO = 1000;

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const limiteDocumento = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

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

  // Checklists da semana, por veículo: Realizado / Realizado com alerta / Pendente
  const checklistByVehicle = new Map<string, boolean>(); // vehicleId -> temAlerta
  for (const c of checklistsSemana) {
    const temAlerta = c.itens.some((i) => i.status !== "OK");
    const atual = checklistByVehicle.get(c.vehicleId);
    // Se já existe um checklist "com alerta" registrado para o veículo, mantém o pior status
    checklistByVehicle.set(c.vehicleId, atual || temAlerta);
  }
  let realizados = 0;
  let realizadosComAlerta = 0;
  for (const v of vehicles) {
    if (!checklistByVehicle.has(v.id)) continue;
    if (checklistByVehicle.get(v.id)) realizadosComAlerta += 1;
    else realizados += 1;
  }
  const pendentes = Math.max(0, totalVeiculos - realizados - realizadosComAlerta);
  const checklistDonut = [
    { status: "Realizados", quantidade: realizados },
    { status: "Realizados com alerta", quantidade: realizadosComAlerta },
    { status: "Pendentes", quantidade: pendentes },
  ];

  const documentosVencendo = alerts.filter((a) => a.tipo === "documento").length;
  const documentosVencidos = alerts.filter((a) => a.tipo === "documento" && a.severidade === "critico").length;
  const trocasOleoProximas = alerts.filter((a) => a.tipo === "troca_oleo").length;
  const checklistsPendentes = alerts.filter((a) => a.tipo === "checklist").length;

  // Documentos a vencer (não vencidos ainda), ordenados por data mais próxima
  const documentosAVencer = vehicles
    .flatMap((v) =>
      v.documentos
        .filter((d) => d.dataVencimento && d.dataVencimento >= now)
        .map((d) => ({
          id: d.id,
          tipo: d.tipo,
          placa: v.placa,
          veiculo: `${v.marca} ${v.modelo}`,
          dataVencimento: d.dataVencimento!.toISOString(),
          diasRestantes: Math.ceil((d.dataVencimento!.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)),
        }))
    )
    .filter((d) => d.diasRestantes <= 60)
    .sort((a, b) => a.diasRestantes - b.diasRestantes)
    .slice(0, 8);

  // Próximas trocas de óleo (com percentual de uso do intervalo)
  const proximasTrocasOleo = vehicles
    .filter((v) => v.oilChanges[0]?.kmProximaTroca)
    .map((v) => {
      const lastOil = v.oilChanges[0];
      const kmProximaTroca = lastOil.kmProximaTroca!;
      const intervalo = Math.max(1, kmProximaTroca - lastOil.km);
      const percorrido = v.kmAtual - lastOil.km;
      const percentual = Math.round((percorrido / intervalo) * 100);
      const kmFalta = kmProximaTroca - v.kmAtual;
      return {
        id: v.id,
        placa: v.placa,
        veiculo: `${v.marca} ${v.modelo}`,
        kmAtual: v.kmAtual,
        kmProximaTroca,
        kmFalta,
        percentual: Math.max(0, percentual),
      };
    })
    .sort((a, b) => b.percentual - a.percentual)
    .slice(0, 6);

  const veiculosEmDia = vehicles.filter((v) => {
    if (v.situacao !== "Ativo") return false;
    const temDocVencido = v.documentos.some((d) => d.dataVencimento && d.dataVencimento < now);
    const lastOil = v.oilChanges[0];
    const trocaVencida = !!lastOil?.kmProximaTroca && v.kmAtual >= lastOil.kmProximaTroca;
    return !temDocVencido && !trocaVencida;
  }).length;

  const veiculosTabela = vehicles.map((v) => {
    const lastChecklist = v.checklists[0];
    const temDocVencido = v.documentos.some((d) => d.dataVencimento && d.dataVencimento < now);
    const temDocVencendo = v.documentos.some(
      (d) => d.dataVencimento && d.dataVencimento >= now && d.dataVencimento <= limiteDocumento
    );
    const documentoStatus: "Em dia" | "Vencendo" | "Vencido" = temDocVencido
      ? "Vencido"
      : temDocVencendo
      ? "Vencendo"
      : "Em dia";
    const lastOil = v.oilChanges[0];
    const realizouChecklistSemana = checklistByVehicle.has(v.id);
    return {
      id: v.id,
      placa: v.placa,
      marca: v.marca,
      modelo: v.modelo,
      ano: v.ano,
      situacao: v.situacao,
      kmAtual: v.kmAtual,
      empresa: v.company?.nomeFantasia || v.company?.razaoSocial || "—",
      ultimoChecklist: lastChecklist?.data ?? null,
      checklistRealizadoSemana: realizouChecklistSemana,
      documentoAlerta: temDocVencido || temDocVencendo,
      documentoStatus,
      kmProximaTroca: lastOil?.kmProximaTroca ?? null,
    };
  });

  return NextResponse.json({
    totalVeiculos,
    veiculosAtivos,
    veiculosEmDia,
    veiculosManutencao,
    checklistsPendentes,
    manutencoesPendentes: veiculosManutencao,
    documentosVencendo,
    documentosVencidos,
    trocasOleoProximas,
    trocasOleoAteMilKm: proximasTrocasOleo.filter((p) => p.kmFalta > 0 && p.kmFalta <= KM_AVISO_TROCA_OLEO).length,
    manutencoesPorMes,
    evolucaoKm,
    checklistDonut,
    documentosAVencer,
    proximasTrocasOleo,
    veiculos: veiculosTabela,
    alertas: alerts.slice(0, 20),
  });
}
