"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  MileageLogFormValues,
  OilChangeFormValues,
  MaintenanceFormValues,
  ChecklistFormValues,
  FuelFormValues,
  CalendarEventFormValues,
  VehicleDocumentFormValues,
} from "@/lib/validations";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.formErrors?.[0] || body?.error || "Erro na requisição");
  }
  return res.json();
}

// -------------------- Quilometragem --------------------

export type MileageLogRecord = {
  id: string;
  vehicleId: string;
  data: string;
  km: number;
  vehicle: { id: string; placa: string; marca: string; modelo: string };
  user: { id: string; name: string } | null;
};

export function useMileageLogs(vehicleId?: string) {
  const params = new URLSearchParams();
  if (vehicleId) params.set("vehicleId", vehicleId);
  return useQuery({
    queryKey: ["mileage-logs", vehicleId],
    queryFn: () => fetchJson<MileageLogRecord[]>(`/api/frota/mileage-logs?${params.toString()}`),
  });
}

export function useCreateMileageLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: MileageLogFormValues) =>
      fetchJson<MileageLogRecord>("/api/frota/mileage-logs", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mileage-logs"] });
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      qc.invalidateQueries({ queryKey: ["fleet-dashboard"] });
    },
  });
}

export function useDeleteMileageLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchJson(`/api/frota/mileage-logs/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mileage-logs"] }),
  });
}

// -------------------- Troca de óleo --------------------

export type OilChangeRecord = {
  id: string;
  vehicleId: string;
  data: string;
  km: number;
  tipoOleo: string | null;
  quantidade: string | null;
  oficina: string | null;
  valor: string | null;
  observacoes: string | null;
  kmProximaTroca: number | null;
  vehicle: { id: string; placa: string; marca: string; modelo: string; kmAtual: number };
};

export function useOilChanges(vehicleId?: string) {
  const params = new URLSearchParams();
  if (vehicleId) params.set("vehicleId", vehicleId);
  return useQuery({
    queryKey: ["oil-changes", vehicleId],
    queryFn: () => fetchJson<OilChangeRecord[]>(`/api/frota/oil-changes?${params.toString()}`),
  });
}

export function useCreateOilChange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: OilChangeFormValues) =>
      fetchJson<OilChangeRecord>("/api/frota/oil-changes", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["oil-changes"] });
      qc.invalidateQueries({ queryKey: ["fleet-dashboard"] });
      qc.invalidateQueries({ queryKey: ["fleet-alerts"] });
    },
  });
}

export function useUpdateOilChange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: OilChangeFormValues }) =>
      fetchJson<OilChangeRecord>(`/api/frota/oil-changes/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["oil-changes"] });
      qc.invalidateQueries({ queryKey: ["fleet-dashboard"] });
    },
  });
}

export function useDeleteOilChange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchJson(`/api/frota/oil-changes/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["oil-changes"] }),
  });
}

// -------------------- Manutenções --------------------

export type MaintenanceRecord = {
  id: string;
  vehicleId: string;
  tipo: string;
  data: string;
  oficina: string | null;
  valor: string | null;
  km: number | null;
  descricao: string | null;
  vehicle: { id: string; placa: string; marca: string; modelo: string };
  responsavelUser: { id: string; name: string } | null;
};

export function useMaintenances(vehicleId?: string) {
  const params = new URLSearchParams();
  if (vehicleId) params.set("vehicleId", vehicleId);
  return useQuery({
    queryKey: ["maintenances", vehicleId],
    queryFn: () => fetchJson<MaintenanceRecord[]>(`/api/frota/maintenances?${params.toString()}`),
  });
}

export function useCreateMaintenance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: MaintenanceFormValues) =>
      fetchJson<MaintenanceRecord>("/api/frota/maintenances", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["maintenances"] });
      qc.invalidateQueries({ queryKey: ["fleet-dashboard"] });
    },
  });
}

export function useUpdateMaintenance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MaintenanceFormValues }) =>
      fetchJson<MaintenanceRecord>(`/api/frota/maintenances/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["maintenances"] });
      qc.invalidateQueries({ queryKey: ["fleet-dashboard"] });
    },
  });
}

export function useDeleteMaintenance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchJson(`/api/frota/maintenances/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["maintenances"] }),
  });
}

// -------------------- Checklists --------------------

export type ChecklistItemRecord = { id: string; item: string; status: string };

export type ChecklistRecord = {
  id: string;
  vehicleId: string;
  tipo: string;
  data: string;
  hora: string | null;
  km: number | null;
  statusGeral: string;
  observacoes: string | null;
  fotos: string[];
  vehicle: { id: string; placa: string; marca: string; modelo: string };
  user: { id: string; name: string } | null;
  itens: ChecklistItemRecord[];
};

export function useChecklists(vehicleId?: string) {
  const params = new URLSearchParams();
  if (vehicleId) params.set("vehicleId", vehicleId);
  return useQuery({
    queryKey: ["checklists", vehicleId],
    queryFn: () => fetchJson<ChecklistRecord[]>(`/api/frota/checklists?${params.toString()}`),
  });
}

export function useCreateChecklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ChecklistFormValues) =>
      fetchJson<ChecklistRecord>("/api/frota/checklists", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["checklists"] });
      qc.invalidateQueries({ queryKey: ["fleet-dashboard"] });
      qc.invalidateQueries({ queryKey: ["fleet-alerts"] });
    },
  });
}

export function useDeleteChecklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchJson(`/api/frota/checklists/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["checklists"] }),
  });
}

// -------------------- Abastecimentos --------------------

export type FuelRecord = {
  id: string;
  vehicleId: string;
  data: string;
  km: number | null;
  litros: string;
  valorLitro: string;
  valorTotal: string;
  posto: string | null;
  tipoCombustivel: string;
  vehicle: { id: string; placa: string; marca: string; modelo: string };
};

export function useFuels(vehicleId?: string) {
  const params = new URLSearchParams();
  if (vehicleId) params.set("vehicleId", vehicleId);
  return useQuery({
    queryKey: ["fuels", vehicleId],
    queryFn: () => fetchJson<FuelRecord[]>(`/api/frota/fuels?${params.toString()}`),
  });
}

export function useCreateFuel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FuelFormValues) =>
      fetchJson<FuelRecord>("/api/frota/fuels", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fuels"] });
      qc.invalidateQueries({ queryKey: ["fleet-dashboard"] });
    },
  });
}

export function useUpdateFuel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FuelFormValues }) =>
      fetchJson<FuelRecord>(`/api/frota/fuels/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fuels"] }),
  });
}

export function useDeleteFuel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchJson(`/api/frota/fuels/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fuels"] }),
  });
}

// -------------------- Agenda --------------------

export type CalendarEventRecord = {
  id: string;
  vehicleId: string | null;
  titulo: string;
  data: string;
  descricao: string | null;
  tipo: string;
  vehicle: { id: string; placa: string; marca: string; modelo: string } | null;
};

export function useCalendarEvents(opts?: { vehicleId?: string; futuras?: boolean }) {
  const params = new URLSearchParams();
  if (opts?.vehicleId) params.set("vehicleId", opts.vehicleId);
  if (opts?.futuras) params.set("futuras", "1");
  return useQuery({
    queryKey: ["calendar-events", opts],
    queryFn: () => fetchJson<CalendarEventRecord[]>(`/api/frota/calendar-events?${params.toString()}`),
  });
}

export function useCreateCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CalendarEventFormValues) =>
      fetchJson<CalendarEventRecord>("/api/frota/calendar-events", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calendar-events"] }),
  });
}

export function useUpdateCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CalendarEventFormValues }) =>
      fetchJson<CalendarEventRecord>(`/api/frota/calendar-events/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calendar-events"] }),
  });
}

export function useDeleteCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchJson(`/api/frota/calendar-events/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["calendar-events"] }),
  });
}

// -------------------- Documentos --------------------

export type VehicleDocumentRecord = {
  id: string;
  vehicleId: string;
  tipo: string;
  arquivoUrl: string | null;
  versoes: { url: string; substituidaEm: string }[] | null;
  dataEmissao: string | null;
  dataVencimento: string | null;
};

export type VehicleDocumentWithVehicle = VehicleDocumentRecord & {
  vehicle: { id: string; placa: string; marca: string; modelo: string; fotoUrl: string | null };
};

export function useAllVehicleDocuments() {
  return useQuery({
    queryKey: ["vehicle-documents-all"],
    queryFn: () => fetchJson<VehicleDocumentWithVehicle[]>("/api/frota/documents"),
  });
}

export function useVehicleDocuments(vehicleId?: string) {
  return useQuery({
    queryKey: ["vehicle-documents", vehicleId],
    queryFn: () => fetchJson<VehicleDocumentRecord[]>(`/api/frota/vehicles/${vehicleId}/documents`),
    enabled: !!vehicleId,
  });
}

export function useCreateVehicleDocument(vehicleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: VehicleDocumentFormValues) =>
      fetchJson<VehicleDocumentRecord>(`/api/frota/vehicles/${vehicleId}/documents`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicle-documents", vehicleId] });
      qc.invalidateQueries({ queryKey: ["vehicle-documents-all"] });
      qc.invalidateQueries({ queryKey: ["fleet-dashboard"] });
      qc.invalidateQueries({ queryKey: ["vehicles", vehicleId] });
    },
  });
}

export function useUpdateVehicleDocument(vehicleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: VehicleDocumentFormValues }) =>
      fetchJson<VehicleDocumentRecord>(`/api/frota/vehicles/${vehicleId}/documents/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicle-documents", vehicleId] });
      qc.invalidateQueries({ queryKey: ["vehicle-documents-all"] });
    },
  });
}

export function useDeleteVehicleDocument(vehicleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (docId: string) =>
      fetchJson(`/api/frota/vehicles/${vehicleId}/documents/${docId}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicle-documents", vehicleId] });
      qc.invalidateQueries({ queryKey: ["vehicle-documents-all"] });
    },
  });
}

// -------------------- Dashboard / Alertas --------------------

export type FleetDashboardStats = {
  totalVeiculos: number;
  veiculosAtivos: number;
  veiculosEmDia: number;
  veiculosManutencao: number;
  checklistsPendentes: number;
  manutencoesPendentes: number;
  documentosVencendo: number;
  documentosVencidos: number;
  trocasOleoProximas: number;
  trocasOleoAteMilKm: number;
  manutencoesPorMes: { mes: string; quantidade: number; valor: number }[];
  evolucaoKm: { mes: string; km: number }[];
  checklistDonut: { status: string; quantidade: number }[];
  documentosAVencer: {
    id: string;
    tipo: string;
    placa: string;
    veiculo: string;
    dataVencimento: string;
    diasRestantes: number;
  }[];
  proximasTrocasOleo: {
    id: string;
    placa: string;
    veiculo: string;
    kmAtual: number;
    kmProximaTroca: number;
    kmFalta: number;
    percentual: number;
  }[];
  veiculos: {
    id: string;
    placa: string;
    marca: string;
    modelo: string;
    ano: number;
    situacao: string;
    kmAtual: number;
    empresa: string;
    ultimoChecklist: string | null;
    checklistRealizadoSemana: boolean;
    documentoAlerta: boolean;
    documentoStatus: "Em dia" | "Vencendo" | "Vencido";
    kmProximaTroca: number | null;
  }[];
  alertas: FleetAlertRecord[];
};

export type FleetAlertRecord = {
  id: string;
  tipo: string;
  severidade: "atencao" | "critico";
  titulo: string;
  descricao: string;
  vehicleId: string | null;
  data?: string;
};

export function useFleetDashboard() {
  return useQuery({
    queryKey: ["fleet-dashboard"],
    queryFn: () => fetchJson<FleetDashboardStats>("/api/frota/dashboard"),
  });
}

export function useFleetAlerts() {
  return useQuery({
    queryKey: ["fleet-alerts"],
    queryFn: () => fetchJson<FleetAlertRecord[]>("/api/frota/alerts"),
  });
}
