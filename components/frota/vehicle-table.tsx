"use client";

import Link from "next/link";
import type { VehicleRecord } from "@/hooks/use-vehicles";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";
import {
  Car,
  Pencil,
  History,
  ClipboardList,
  FileText,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react";

const situacaoBadge: Record<VehicleRecord["situacao"], { label: string; variant: "default" | "outline" | "secondary" }> = {
  Ativo: { label: "Ativo", variant: "default" },
  Manutencao: { label: "Manutenção", variant: "outline" },
  Inativo: { label: "Inativo", variant: "secondary" },
};

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
  function SortableHead({ label, sortKey: key }: { label: string; sortKey: VehicleSortKey }) {
    const active = sortKey === key;
    const Icon = active ? (sortDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
    return (
      <TableHead>
        <button
          type="button"
          onClick={() => onSort(key)}
          className="flex items-center gap-1 hover:text-foreground"
        >
          {label}
          <Icon className={cn("h-3 w-3", active ? "opacity-100" : "opacity-30")} />
        </button>
      </TableHead>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
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
              <TableRow key={v.id}>
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
                  <Badge variant={badge.variant}>{badge.label}</Badge>
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
                    <Link
                      href={`/frota/veiculos/${v.id}/editar`}
                      title="Editar"
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <Link
                      href={`/frota/veiculos/${v.id}`}
                      title="Histórico"
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <History className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/frota/checklists"
                      title="Checklist"
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <ClipboardList className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/frota/documentos"
                      title="Documentos"
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <FileText className="h-4 w-4" />
                    </Link>
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Excluir"
                        onClick={() => onDelete(v.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
