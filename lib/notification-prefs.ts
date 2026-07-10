import { notificationTipoOptions } from "@/lib/validations";

export type NotificationTipo = (typeof notificationTipoOptions)[number];
export type CargoValue = "TECNICO" | "VENDEDOR";

export const notificationTipoLabels: Record<NotificationTipo, string> = {
  checklist: "Checklist não realizado",
  documento_vencendo: "Documento vencendo",
  documento_vencido: "Documento vencido",
  troca_oleo_proxima: "Troca de óleo próxima",
  troca_oleo_vencida: "Troca de óleo vencida",
};

export const cargoLabels: Record<CargoValue, string> = {
  TECNICO: "Técnico",
  VENDEDOR: "Vendedor",
};

// Mapeia o tipo interno usado em lib/frota-alerts.ts (FleetAlert.tipo + severidade)
// para o tipo de notificação configurável por cargo.
export function alertToNotificationTipo(
  tipo: "documento" | "troca_oleo" | "checklist" | "manutencao",
  severidade: "atencao" | "critico"
): NotificationTipo | null {
  if (tipo === "checklist") return "checklist";
  if (tipo === "documento") return severidade === "critico" ? "documento_vencido" : "documento_vencendo";
  if (tipo === "troca_oleo") return severidade === "critico" ? "troca_oleo_vencida" : "troca_oleo_proxima";
  return null;
}

export type NotificationCargoPrefs = Partial<Record<NotificationTipo, Partial<Record<CargoValue, boolean>>>>;

/**
 * Usuários sem cargo definido recebem todas as notificações (comportamento
 * anterior preservado). Para usuários com cargo definido, respeita a matriz
 * de preferências configurada em Configurações > Notificações. Ausência de
 * preferência explícita é tratada como habilitado (default true).
 */
export function isNotificationAllowedForCargo(
  prefs: NotificationCargoPrefs | null | undefined,
  cargo: CargoValue | null | undefined,
  tipo: NotificationTipo
): boolean {
  if (!cargo) return true;
  const pref = prefs?.[tipo]?.[cargo];
  return pref !== false;
}
