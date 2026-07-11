"use client";

import { useState } from "react";
import type { VehicleRecord } from "@/hooks/use-vehicles";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";
import { Car } from "lucide-react";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="truncate text-sm font-medium">{value ?? "—"}</p>
    </div>
  );
}

export function VehicleViewDialog({
  vehicle,
  open,
  onOpenChange,
}: {
  vehicle: VehicleRecord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [fotoError, setFotoError] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {vehicle.marca} {vehicle.modelo} — {vehicle.placa}
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          <div className="flex items-center gap-3">
            {vehicle.fotoUrl && !fotoError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={vehicle.fotoUrl}
                alt={vehicle.placa}
                onError={() => setFotoError(true)}
                className="h-20 w-24 shrink-0 rounded-lg border object-cover"
              />
            ) : (
              <div className="flex h-20 w-24 shrink-0 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
                <Car className="h-7 w-7" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-base font-bold">
                {vehicle.nome || `${vehicle.marca} ${vehicle.modelo}`}
              </p>
              <p className="text-sm text-muted-foreground">
                {vehicle.company.nomeFantasia || vehicle.company.razaoSocial}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Placa" value={vehicle.placa} />
            <Field label="Situação" value={vehicle.situacao === "Manutencao" ? "Manutenção" : vehicle.situacao} />
            <Field label="Marca" value={vehicle.marca} />
            <Field label="Modelo" value={vehicle.modelo} />
            <Field label="Versão" value={vehicle.versao} />
            <Field label="Ano" value={vehicle.ano} />
            <Field label="Cor" value={vehicle.cor} />
            <Field label="Combustível" value={vehicle.combustivel} />
            <Field label="Categoria" value={vehicle.categoria} />
            <Field label="Tipo de uso" value={vehicle.tipoUso} />
            <Field label="Tração" value={vehicle.tracao} />
            <Field
              label="Capacidade de carga"
              value={vehicle.capacidadeCarga ? `${vehicle.capacidadeCarga} kg` : null}
            />
            <Field label="Potência" value={vehicle.potencia ? `${vehicle.potencia} cv` : null} />
            <Field label="KM atual" value={`${vehicle.kmAtual.toLocaleString("pt-BR")} km`} />
            <Field
              label="Intervalo troca de óleo"
              value={vehicle.oilChangeIntervalKm ? `${vehicle.oilChangeIntervalKm} km` : null}
            />
            <Field label="Renavam" value={vehicle.renavam} />
            <Field label="Chassi" value={vehicle.chassi} />
            <Field
              label="Valor de aquisição"
              value={vehicle.valorAquisicao ? formatCurrencyBRL(Number(vehicle.valorAquisicao)) : null}
            />
            <Field label="Data de aquisição" value={vehicle.dataAquisicao ? formatDateBR(vehicle.dataAquisicao) : null} />
          </div>

          {vehicle.observacoesAdicionais && (
            <Field label="Observações adicionais" value={vehicle.observacoesAdicionais} />
          )}
          {vehicle.observacoes && <Field label="Observações" value={vehicle.observacoes} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
