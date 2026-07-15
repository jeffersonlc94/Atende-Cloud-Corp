import { prisma } from "@/lib/prisma";

export type FleetAlert = {
  id: string;
  tipo: "documento" | "troca_oleo" | "checklist" | "manutencao";
  severidade: "atencao" | "critico";
  titulo: string;
  descricao: string;
  /** Identificação limpa do veículo (placa — marca modelo) para e-mails. */
  veiculo?: string;
  vehicleId: string | null;
  data?: string;
};

const DIAS_ALERTA_DOCUMENTO = 30;
const KM_ALERTA_TROCA_OLEO = 500;

// NOTA: o envio de alertas por e-mail (SMTP) fica para uma fase futura.
// Aqui apenas computamos os alertas para exibição no Dashboard da Frota.
export async function computeFleetAlerts(): Promise<FleetAlert[]> {
  const alerts: FleetAlert[] = [];
  const now = new Date();
  const limiteDocumento = new Date(now.getTime() + DIAS_ALERTA_DOCUMENTO * 24 * 60 * 60 * 1000);
  const seteDiasAtras = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Dias da semana em que o checklist é obrigatório (Configurações >
  // Notificações). Com dias configurados, o alerta dispara quando o
  // checklist do dia ainda não foi feito; sem configuração, mantém a
  // regra antiga de 7 dias sem checklist.
  const settings = await prisma.systemSettings
    .findUnique({ where: { id: "default" } })
    .catch(() => null);
  const checklistDays = (settings?.checklistDays || "")
    .split(",")
    .map((d) => parseInt(d.trim(), 10))
    .filter((d) => !Number.isNaN(d));
  const hojeEDiaDeChecklist = checklistDays.length > 0 && checklistDays.includes(now.getDay());
  const inicioDoDia = new Date(now);
  inicioDoDia.setHours(0, 0, 0, 0);

  const vehicles = await prisma.vehicle.findMany({
    where: { situacao: { not: "Inativo" } },
    include: {
      documentos: true,
      oilChanges: { orderBy: { data: "desc" }, take: 1 },
      checklists: { orderBy: { data: "desc" }, take: 1 },
    },
  });

  for (const v of vehicles) {
    const label = `${v.placa} — ${v.marca} ${v.modelo}`;

    for (const doc of v.documentos) {
      if (doc.arquivado) continue;
      if (!doc.dataVencimento) continue;
      if (doc.dataVencimento < now) {
        alerts.push({
          id: `doc-${doc.id}`,
          tipo: "documento",
          severidade: "critico",
          titulo: `Documento vencido (${doc.tipo})`,
          descricao: `${label}: ${doc.tipo} venceu em ${doc.dataVencimento.toLocaleDateString("pt-BR")}`,
          veiculo: label,
          vehicleId: v.id,
          data: doc.dataVencimento.toISOString(),
        });
      } else if (doc.dataVencimento <= limiteDocumento) {
        alerts.push({
          id: `doc-${doc.id}`,
          tipo: "documento",
          severidade: "atencao",
          titulo: `Documento vencendo (${doc.tipo})`,
          descricao: `${label}: ${doc.tipo} vence em ${doc.dataVencimento.toLocaleDateString("pt-BR")}`,
          veiculo: label,
          vehicleId: v.id,
          data: doc.dataVencimento.toISOString(),
        });
      }
    }

    const lastOil = v.oilChanges[0];
    if (lastOil?.kmProximaTroca) {
      const diff = lastOil.kmProximaTroca - v.kmAtual;
      if (diff <= 0) {
        alerts.push({
          id: `oil-${lastOil.id}`,
          tipo: "troca_oleo",
          severidade: "critico",
          titulo: "Troca de óleo vencida",
          descricao: `${label}: km atual (${v.kmAtual}) já ultrapassou o previsto (${lastOil.kmProximaTroca})`,
          veiculo: label,
          vehicleId: v.id,
        });
      } else if (diff <= KM_ALERTA_TROCA_OLEO) {
        alerts.push({
          id: `oil-${lastOil.id}`,
          tipo: "troca_oleo",
          severidade: "atencao",
          titulo: "Troca de óleo próxima",
          descricao: `${label}: faltam ${diff} km para a próxima troca`,
          veiculo: label,
          vehicleId: v.id,
        });
      }
    }

    const lastChecklist = v.checklists[0];
    if (checklistDays.length > 0) {
      // Regra por dias configurados: alerta no dia de checklist ainda sem registro.
      if (hojeEDiaDeChecklist && (!lastChecklist || lastChecklist.data < inicioDoDia)) {
        alerts.push({
          id: `checklist-${v.id}`,
          tipo: "checklist",
          severidade: "atencao",
          titulo: "Checklist do dia não realizado",
          descricao: `${label}: o checklist de hoje ainda não foi registrado`,
          veiculo: label,
          vehicleId: v.id,
        });
      }
    } else if (!lastChecklist || lastChecklist.data < seteDiasAtras) {
      alerts.push({
        id: `checklist-${v.id}`,
        tipo: "checklist",
        severidade: "atencao",
        titulo: "Checklist não realizado esta semana",
        descricao: `${label}: nenhum checklist registrado nos últimos 7 dias`,
        veiculo: label,
        vehicleId: v.id,
      });
    }

    if (v.situacao === "Manutencao") {
      alerts.push({
        id: `manut-${v.id}`,
        tipo: "manutencao",
        severidade: "atencao",
        titulo: "Veículo em manutenção",
        descricao: `${label}: situação atual é "Em manutenção"`,
        veiculo: label,
        vehicleId: v.id,
      });
    }
  }

  return alerts;
}
