"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";
import { formatDateBR } from "@/lib/format";
import {
  checklistItemTipoLabels,
} from "@/lib/validations";
import { statusLabels } from "@/components/frota/checklist-item-status";
import { FotoThumb } from "@/components/shared/foto-thumb";
import type { ChecklistDetailRecord } from "@/hooks/use-fleet";

const statusBadgeClasses: Record<string, string> = {
  OK: "bg-emerald-100 text-emerald-800",
  Atencao: "bg-amber-100 text-amber-800",
  NecessitaManutencao: "bg-red-100 text-red-800",
};

export function ChecklistPrintLayout({
  checklist,
  id = "checklist-print-area",
}: {
  checklist: ChecklistDetailRecord;
  id?: string;
}) {
  const company = checklist.vehicle.company;
  const [logoError, setLogoError] = useState(false);

  const enderecoCompleto = [
    company?.endereco,
    company?.cidade && company?.estado ? `${company.cidade}/${company.estado}` : company?.cidade,
    company?.cep,
  ]
    .filter(Boolean)
    .join(" - ");

  return (
    <div
      className="mx-auto w-full max-w-[210mm] bg-white p-8 text-black print:p-0 print:shadow-none"
      id={id}
    >
      {/* Cabeçalho */}
      <div className="flex items-center gap-4 border-b-2 border-black pb-4">
        {company?.logoUrl && !logoError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={company.logoUrl}
            alt="Logo"
            className="h-16 w-16 shrink-0 object-contain"
            onError={() => setLogoError(true)}
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded border border-gray-300 bg-gray-100 text-gray-400">
            <Building2 className="h-8 w-8" />
          </div>
        )}
        <div className="flex-1">
          <p className="text-[1.125em] font-bold uppercase leading-tight">
            {company?.razaoSocial || "Empresa não selecionada"}
          </p>
          {company?.nomeFantasia && (
            <p className="text-[0.75em] italic text-gray-700">{company.nomeFantasia}</p>
          )}
          {enderecoCompleto && (
            <p className="text-[0.75em] italic text-gray-700">{enderecoCompleto}</p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[1.125em] font-bold uppercase">Checklist {checklist.tipo}</p>
          <p className="text-[0.75em] text-gray-700">
            {formatDateBR(checklist.data)} {checklist.hora || ""}
          </p>
        </div>
      </div>

      {/* Dados do veículo */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-[0.875em]">
        <p>
          <span className="font-semibold">VEÍCULO:</span> {checklist.vehicle.placa} —{" "}
          {checklist.vehicle.marca} {checklist.vehicle.modelo}
          {checklist.vehicle.cor ? ` (${checklist.vehicle.cor})` : ""}
        </p>
        <p>
          <span className="font-semibold">KM ATUAL:</span>{" "}
          {checklist.km ? checklist.km.toLocaleString("pt-BR") : "—"}
        </p>
        <p>
          <span className="font-semibold">REALIZADO POR:</span> {checklist.user?.name ?? "—"}
        </p>
        <p className="flex items-center gap-1.5">
          <span className="font-semibold">STATUS GERAL:</span>
          <span
            className={`rounded px-1.5 py-0.5 text-[0.85em] font-medium ${statusBadgeClasses[checklist.statusGeral] ?? ""}`}
          >
            {statusLabels[checklist.statusGeral] ?? checklist.statusGeral}
          </span>
        </p>
      </div>

      {/* Itens de inspeção */}
      <table className="mt-4 w-full border-collapse text-[0.875em]">
        <thead>
          <tr className="border-y-2 border-black bg-sky-100">
            <th className="border border-gray-400 p-1.5 text-left">ITEM</th>
            <th className="w-40 border border-gray-400 p-1.5 text-center">STATUS</th>
          </tr>
        </thead>
        <tbody>
          {checklist.itens.map((i, idx) => (
            <tr key={i.id} className={idx % 2 === 1 ? "bg-gray-50" : undefined}>
              <td className="border border-gray-400 p-1.5">
                {checklistItemTipoLabels[i.item as keyof typeof checklistItemTipoLabels] ?? i.item}
              </td>
              <td className="border border-gray-400 p-1.5 text-center">
                <span
                  className={`rounded px-1.5 py-0.5 text-[0.85em] font-medium ${statusBadgeClasses[i.status] ?? ""}`}
                >
                  {statusLabels[i.status] ?? i.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Observações */}
      {checklist.observacoes && (
        <p className="mt-4 text-[0.875em]">
          <span className="font-semibold">Observações:</span> {checklist.observacoes}
        </p>
      )}

      {/* Fotos */}
      {checklist.fotos?.length > 0 && (
        <div className="mt-4">
          <p className="text-[0.875em] font-semibold">Fotos:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {checklist.fotos.map((url) => (
              <FotoThumb key={url} url={url} alt="Foto do checklist" className="h-28 w-28" />
            ))}
          </div>
        </div>
      )}

      {/* Assinatura */}
      <div className="mt-16 flex flex-col items-center pb-8 text-center text-[0.875em]">
        <p className="text-gray-700">
          {(company?.cidade || "—")}, {formatDateBR(checklist.data)}
        </p>
        <div className="mt-12 w-64 border-t border-black pt-1">
          <p>{checklist.user?.name ?? "Responsável"}</p>
          <p className="text-[0.75em] text-gray-600">
            {company?.nomeFantasia || company?.razaoSocial}
          </p>
        </div>
      </div>
    </div>
  );
}
