import type { VehicleRecord } from "@/hooks/use-vehicles";

/**
 * Calcula o status da próxima troca de óleo a partir do último registro de OilChange,
 * usando a mesma lógica já aplicada no dashboard da Frota e no detalhe do veículo.
 */
export function getOilChangeStatus(vehicle: Pick<VehicleRecord, "kmAtual" | "oilChanges">) {
  const lastOil = vehicle.oilChanges?.[0];
  if (!lastOil?.kmProximaTroca) {
    return { hasData: false as const, falta: null, overdue: false, label: "Sem registro" };
  }
  const falta = lastOil.kmProximaTroca - vehicle.kmAtual;
  const overdue = falta <= 0;
  const label = overdue
    ? `Vencida ${Math.abs(falta).toLocaleString("pt-BR")} km`
    : `Faltam ${falta.toLocaleString("pt-BR")} km`;
  return { hasData: true as const, falta, overdue, label };
}

/** Retorna a data da última atualização de KM: mileage log mais recente ou updatedAt. */
export function getLastKmUpdate(vehicle: Pick<VehicleRecord, "updatedAt" | "mileageLogs">) {
  return vehicle.mileageLogs?.[0]?.data ?? vehicle.updatedAt;
}
