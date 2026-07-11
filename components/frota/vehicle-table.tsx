"use client";

import { useState } from "react";
import Link from "next/link";
import type { VehicleRecord } from "@/hooks/use-vehicles";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateBR } from "@/lib/format";
import { getOilChangeStatus, getLastKmUpdate } from "@/components/frota/vehicle-maintenance-info";
import { VehicleViewDialog } from "@/components/frota/vehicle-view-dialog";
import { cn } from "@/lib/utils";
import {
  Car,
  Eye,
  Pencil,
  History,
  ClipboardList,
  FileText,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react";

const situacaoBadge: Record<VehicleRecord["situacao"], { label: string; className: string }> = {
  Ativo: {
    label: "Ativo",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  },
  Manutencao: {
    label: "Manutenção",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  },
  Inativo: {
    label: "Inativo",
    className: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  },
};

const actionLinkClass = "rounded-md p-1.5 transition-colors";

export type VehicleSortKey = "veiculo" | "placa" | "ano" | "kmAtual" | "situacao";

export function VehicleTable({
  vehicles,
  canDelete,
  onDelete,
  sortKey,
  sortDir,
  onSort,
}: {
  vehicles: VehicleRecord[];
  canDelete: boolean;
  onDelete: (id: string) => void;
  sortKey: VehicleSortKey | null;
  sortDir: "asc" | "desc";
  onSort: (key: VehicleSortKey) => void;
}) {
  const [viewingVehicle, setViewingVehicle] = useState<VehicleRecord | null>(null);

  function SortableHead({ label, sortKey: key }: { label: string; sortKey: VehicleSortKey }) {
    const active = sortKey === key;
    const Icon = active ? (sortDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
    return (
      <TableHead>
        <button
          type="button"
          onClick={() => onSort(key)}
          className={cn(
            "flex items-center gap-1 hover:text-foreground",
            active && "font-semibold text-foreground"
          )}
        >
          {label}
          <Icon className={cn("h-3 w-3", active ? "opacity-100" : "opacity-30")} />
        </button>
      </TableHead>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-14" />
            <SortableHead label="Veículo" sortKey="veiculo" />
            <SortableHead label="Placa" sortKey="placa" />
            <SortableHead label="Ano" sortKey="ano" />
            <TableHead>Empresa</TableHead>
            <SortableHead label="Status" sortKey="situacao" />
            <SortableHead label="KM atual" sortKey="kmAtual" />
            <TableHead>Próxima manutenção</TableHead>
            <TableHead>Combustível</TableHead>
            <TableHead>Últ. atualização</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vehicles.map((v) => {
            const badge = situacaoBadge[v.situacao];
            const oilStatus = getOilChangeStatus(v);
            const lastKmUpdate = getLastKmUpdate(v);
            return (
              <TableRow key={v.id} className="transition-colors odd:bg-muted/20 hover:bg-muted/40">
                <TableCell>
                  {v.fotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={v.fotoUrl}
                      alt={v.placa}
                      className="h-9 w-9 rounded-md border object-cover"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-md border bg-muted text-muted-foreground">
                      <Car className="h-4 w-4" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">
                  <Link href={`/frota/veiculos/${v.id}`} className="hover:underline">
                    {v.marca} {v.modelo}
                  </Link>
                </TableCell>
                <TableCell>{v.placa}</TableCell>
                <TableCell>{v.ano}</TableCell>
                <TableCell className="max-w-[160px] truncate">
                  {v.company.nomeFantasia || v.company.razaoSocial}
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex w-fit shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      badge.className
                    )}
                  >
                    {badge.label}
                  </span>
                </TableCell>
                <TableCell>{v.kmAtual.toLocaleString("pt-BR")} km</TableCell>
                <TableCell>
                  {oilStatus.hasData ? (
                    <span
                      className={cn(
                        "text-xs font-medium",
                        oilStatus.overdue ? "text-red-600" : "text-amber-600"
                      )}
                    >
                      {oilStatus.label}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>{v.combustivel}</TableCell>
                <TableCell>{formatDateBR(lastKmUpdate) || "—"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      title="Visualizar cadastro"
                      onClick={() => setViewingVehicle(v)}
                      className={cn(actionLinkClass, "text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-500/10")}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <Link
                      href={`/frota/veiculos/${v.id}/editar`}
                      title="Editar"
                      className={cn(actionLinkClass, "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10")}
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <Link
                      href={`/frota/veiculos/${v.id}`}
                      title="Histórico"
                      className={cn(actionLinkClass, "text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10")}
                    >
                      <History className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/frota/checklists"
                      title="Checklist"
                      className={cn(actionLinkClass, "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10")}
                    >
                      <ClipboardList className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/frota/documentos"
                      title="Documentos"
                      className={cn(actionLinkClass, "text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/10")}
                    >
                      <FileText className="h-4 w-4" />
                    </Link>
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Excluir"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-500/10"
                        onClick={() => onDelete(v.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {viewingVehicle && (
        <VehicleViewDialog
          vehicle={viewingVehicle}
          open={!!viewingVehicle}
          onOpenChange={(open) => !open && setViewingVehicle(null)}
        />
      )}
    </div>
  );
}
