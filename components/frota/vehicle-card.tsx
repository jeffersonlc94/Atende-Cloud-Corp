"use client";

import { useState } from "react";
import Link from "next/link";
import type { VehicleRecord } from "@/hooks/use-vehicles";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatDateBR } from "@/lib/format";
import { getOilChangeStatus, getLastKmUpdate } from "@/components/frota/vehicle-maintenance-info";
import { cn } from "@/lib/utils";
import { Car, Pencil, History, ClipboardList, FileText, Trash2 } from "lucide-react";

const situacaoBadge: Record<VehicleRecord["situacao"], { label: string; variant: "default" | "outline" | "secondary" }> = {
  Ativo: { label: "Ativo", variant: "default" },
  Manutencao: { label: "Manutenção", variant: "outline" },
  Inativo: { label: "Inativo", variant: "secondary" },
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
  const badge = situacaoBadge[vehicle.situacao];
  const oilStatus = getOilChangeStatus(vehicle);
  const lastKmUpdate = getLastKmUpdate(vehicle);

  return (
    <Card className="flex flex-col transition-shadow duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="flex items-start gap-3">
          {vehicle.fotoUrl && !fotoError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={vehicle.fotoUrl}
              alt={vehicle.placa}
              onError={() => setFotoError(true)}
              className="h-14 w-14 shrink-0 rounded-lg border object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
              <Car className="h-6 w-6" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate font-semibold leading-tight">
                {vehicle.marca} {vehicle.modelo}
              </p>
              <Badge variant={badge.variant} className="shrink-0">
                {badge.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {vehicle.placa} • {vehicle.ano}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
          <div>
            <p className="text-muted-foreground">Empresa</p>
            <p className="truncate font-medium">
              {vehicle.company.nomeFantasia || vehicle.company.razaoSocial}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Combustível</p>
            <p className="font-medium">{vehicle.combustivel}</p>
          </div>
          <div>
            <p className="text-muted-foreground">KM atual</p>
            <p className="font-medium">{vehicle.kmAtual.toLocaleString("pt-BR")} km</p>
          </div>
          <div>
            <p className="text-muted-foreground">Últ. atualização</p>
            <p className="font-medium">{formatDateBR(lastKmUpdate) || "—"}</p>
          </div>
          {vehicle.renavam && (
            <div className="col-span-2">
              <p className="text-muted-foreground">Renavam</p>
              <p className="truncate font-medium">{vehicle.renavam}</p>
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

      <CardFooter className="flex flex-wrap items-center justify-end gap-1 bg-transparent p-3 pt-0">
        <Link
          href={`/frota/veiculos/${vehicle.id}/editar`}
          title="Editar"
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <Pencil className="h-4 w-4" />
        </Link>
        <Link
          href={`/frota/veiculos/${vehicle.id}`}
          title="Histórico"
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <History className="h-4 w-4" />
        </Link>
        <Link
          href="/frota/checklists"
          title="Checklist"
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <ClipboardList className="h-4 w-4" />
        </Link>
        <Link
          href="/frota/documentos"
          title="Documentos"
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <FileText className="h-4 w-4" />
        </Link>
        {canDelete && (
          <Button
            variant="ghost"
            size="icon"
            title="Excluir"
            onClick={() => onDelete(vehicle.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
