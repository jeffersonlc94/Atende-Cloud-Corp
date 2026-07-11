"use client";

import { useState } from "react";
import Link from "next/link";
import type { VehicleRecord } from "@/hooks/use-vehicles";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatDateBR } from "@/lib/format";
import { getOilChangeStatus, getLastKmUpdate } from "@/components/frota/vehicle-maintenance-info";
import { VehicleViewDialog } from "@/components/frota/vehicle-view-dialog";
import { cn } from "@/lib/utils";
import {
  Car,
  Pencil,
  History,
  ClipboardList,
  FileText,
  Trash2,
  Building2,
  Fuel,
  Gauge,
  CalendarClock,
  Eye,
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

export function VehicleCard({
  vehicle,
  canDelete,
  onDelete,
}: {
  vehicle: VehicleRecord;
  canDelete: boolean;
  onDelete: (id: string) => void;
}) {
  const [fotoError, setFotoError] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const badge = situacaoBadge[vehicle.situacao];
  const oilStatus = getOilChangeStatus(vehicle);
  const lastKmUpdate = getLastKmUpdate(vehicle);

  return (
    <Card className="flex flex-col overflow-hidden transition-shadow duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="flex items-stretch gap-3">
          {vehicle.fotoUrl && !fotoError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={vehicle.fotoUrl}
              alt={vehicle.placa}
              onError={() => setFotoError(true)}
              className="h-24 w-28 shrink-0 rounded-lg border object-cover"
            />
          ) : (
            <div className="flex h-24 w-28 shrink-0 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
              <Car className="h-8 w-8" />
            </div>
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span
              className={cn(
                "w-fit shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                badge.className
              )}
            >
              {badge.label}
            </span>
            <p className="truncate text-base font-bold leading-tight">
              {vehicle.marca} {vehicle.modelo}
            </p>
            <p className="text-sm text-muted-foreground">
              {vehicle.placa} • {vehicle.ano}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 text-xs">
          <div className="flex items-start gap-1.5">
            <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />
            <div className="min-w-0">
              <p className="text-muted-foreground">Empresa</p>
              <p className="truncate font-semibold">
                {vehicle.company.nomeFantasia || vehicle.company.razaoSocial}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-1.5">
            <Fuel className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
            <div className="min-w-0">
              <p className="text-muted-foreground">Combustível</p>
              <p className="truncate font-semibold">{vehicle.combustivel}</p>
            </div>
          </div>
          <div className="flex items-start gap-1.5">
            <Gauge className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-muted-foreground">KM atual</p>
              <p className="truncate font-semibold">{vehicle.kmAtual.toLocaleString("pt-BR")} km</p>
            </div>
          </div>
          <div className="flex items-start gap-1.5">
            <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-600" />
            <div className="min-w-0">
              <p className="text-muted-foreground">Últ. atualização</p>
              <p className="truncate font-semibold">{formatDateBR(lastKmUpdate) || "—"}</p>
            </div>
          </div>
          {vehicle.renavam && (
            <div className="col-span-2">
              <p className="text-muted-foreground">Renavam</p>
              <p className="truncate font-semibold">{vehicle.renavam}</p>
            </div>
          )}
        </div>

        {oilStatus.hasData && (
          <p
            className={cn(
              "rounded-md px-2 py-1 text-xs font-medium",
              oilStatus.overdue
                ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
                : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
            )}
          >
            {oilStatus.overdue ? "Manutenção " : ""}
            {oilStatus.label}
          </p>
        )}

        {vehicle.observacoes && (
          <p className="line-clamp-2 text-xs text-muted-foreground">{vehicle.observacoes}</p>
        )}
      </CardContent>

      <CardFooter className="grid grid-cols-2 gap-1 bg-transparent p-3 pt-0">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          title="Visualizar cadastro"
          className="justify-start text-sky-600 hover:bg-sky-50 hover:text-sky-700 dark:hover:bg-sky-500/10"
          onClick={() => setViewOpen(true)}
        >
          <Eye className="mr-1 h-4 w-4" /> Visualizar
        </Button>
        <Link
          href={`/frota/veiculos/${vehicle.id}/editar`}
          title="Editar"
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "justify-start text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-500/10",
          })}
        >
          <Pencil className="mr-1 h-4 w-4" /> Editar
        </Link>
        <Link
          href={`/frota/veiculos/${vehicle.id}`}
          title="Histórico"
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "justify-start text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-500/10",
          })}
        >
          <History className="mr-1 h-4 w-4" /> Histórico
        </Link>
        <Link
          href="/frota/documentos"
          title="Documentos"
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "justify-start text-violet-600 hover:bg-violet-50 hover:text-violet-700 dark:hover:bg-violet-500/10",
          })}
        >
          <FileText className="mr-1 h-4 w-4" /> Documentos
        </Link>
        <Link
          href="/frota/checklists"
          title="Checklist"
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "justify-start text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-500/10",
          })}
        >
          <ClipboardList className="mr-1 h-4 w-4" /> Checklist
        </Link>
        {canDelete && (
          <Button
            variant="ghost"
            size="sm"
            title="Excluir"
            className="justify-start text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-500/10"
            onClick={() => onDelete(vehicle.id)}
          >
            <Trash2 className="mr-1 h-4 w-4" /> Excluir
          </Button>
        )}
      </CardFooter>

      <VehicleViewDialog vehicle={vehicle} open={viewOpen} onOpenChange={setViewOpen} />
    </Card>
  );
}
