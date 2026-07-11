"use client";

import { useState } from "react";
import type { VehicleRecord } from "@/hooks/use-vehicles";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";
import {
  Car,
  Tag,
  Hash,
  CalendarDays,
  Building2,
  ClipboardCheck,
  Wrench,
  Fuel,
  Palette,
  Gauge,
  MessageSquareText,
  type LucideIcon,
} from "lucide-react";

const situacaoLabels: Record<string, string> = {
  Ativo: "Ativo",
  Manutencao: "Manutenção",
  Inativo: "Inativo",
};

const situacaoBadgeVariant: Record<string, "default" | "secondary" | "outline"> = {
  Ativo: "default",
  Manutencao: "outline",
  Inativo: "secondary",
};

function SectionHeader({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="flex items-center gap-2 border-b px-4 py-3 text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">
      <Icon className="h-4 w-4 text-primary" />
      {title}
    </div>
  );
}

function FieldLabel({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {children}
    </span>
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
      <DialogContent className="max-w-2xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {vehicle.marca} {vehicle.modelo} — {vehicle.placa}
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[75vh] space-y-4 overflow-y-auto pr-1">
          <Card className="py-0 gap-0 overflow-hidden rounded-2xl">
            <SectionHeader icon={Car} title="Informações principais" />
            <CardContent className="grid gap-4 pt-4 pb-5 sm:grid-cols-3">
              <div className="flex items-center gap-3 sm:col-span-3">
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
              <div className="space-y-2">
                <FieldLabel icon={Tag}>Nome do veículo</FieldLabel>
                <Input readOnly disabled value={vehicle.nome || "—"} />
              </div>
              <div className="space-y-2">
                <FieldLabel icon={Hash}>Placa</FieldLabel>
                <Input readOnly disabled className="uppercase" value={vehicle.placa} />
              </div>
              <div className="space-y-2">
                <FieldLabel icon={Hash}>Renavam</FieldLabel>
                <Input readOnly disabled value={vehicle.renavam || "—"} />
              </div>
              <div className="space-y-2">
                <FieldLabel icon={Car}>Marca</FieldLabel>
                <Input readOnly disabled value={vehicle.marca} />
              </div>
              <div className="space-y-2">
                <FieldLabel icon={Car}>Modelo</FieldLabel>
                <Input readOnly disabled value={vehicle.modelo} />
              </div>
              <div className="space-y-2">
                <FieldLabel icon={CalendarDays}>Ano</FieldLabel>
                <Input readOnly disabled value={vehicle.ano} />
              </div>
              <div className="space-y-2">
                <FieldLabel icon={Building2}>Empresa</FieldLabel>
                <Input
                  readOnly
                  disabled
                  value={vehicle.company.nomeFantasia || vehicle.company.razaoSocial}
                />
              </div>
              <div className="space-y-2">
                <FieldLabel icon={ClipboardCheck}>Status</FieldLabel>
                <div>
                  <Badge variant={situacaoBadgeVariant[vehicle.situacao] ?? "outline"}>
                    {situacaoLabels[vehicle.situacao] ?? vehicle.situacao}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <FieldLabel icon={Tag}>Categoria</FieldLabel>
                <Input readOnly disabled value={vehicle.categoria || "Não informado"} />
              </div>
            </CardContent>
          </Card>

          <Card className="py-0 gap-0 overflow-hidden rounded-2xl">
            <SectionHeader icon={Wrench} title="Especificações" />
            <CardContent className="grid gap-4 pt-4 pb-5 sm:grid-cols-3">
              <div className="space-y-2">
                <FieldLabel icon={Fuel}>Tipo de combustível</FieldLabel>
                <Input readOnly disabled value={vehicle.combustivel} />
              </div>
              <div className="space-y-2">
                <FieldLabel icon={Palette}>Cor</FieldLabel>
                <Input readOnly disabled value={vehicle.cor || "—"} />
              </div>
              <div className="space-y-2">
                <FieldLabel icon={Hash}>Chassi</FieldLabel>
                <Input readOnly disabled value={vehicle.chassi || "—"} />
              </div>
              <div className="space-y-2">
                <FieldLabel icon={Gauge}>Capacidade de carga (kg)</FieldLabel>
                <Input
                  readOnly
                  disabled
                  value={vehicle.capacidadeCarga ? `${vehicle.capacidadeCarga}` : "—"}
                />
              </div>
              <div className="space-y-2">
                <FieldLabel icon={Gauge}>Potência (cv)</FieldLabel>
                <Input readOnly disabled value={vehicle.potencia ? `${vehicle.potencia}` : "—"} />
              </div>
              <div className="space-y-2">
                <FieldLabel icon={Car}>Tração</FieldLabel>
                <Input readOnly disabled value={vehicle.tracao || "Não informado"} />
              </div>
              <div className="space-y-2">
                <FieldLabel icon={ClipboardCheck}>Tipo de uso</FieldLabel>
                <Input readOnly disabled value={vehicle.tipoUso || "Não informado"} />
              </div>
              <div className="space-y-2">
                <FieldLabel icon={Gauge}>Valor de aquisição</FieldLabel>
                <Input
                  readOnly
                  disabled
                  value={
                    vehicle.valorAquisicao ? formatCurrencyBRL(Number(vehicle.valorAquisicao)) : "—"
                  }
                />
              </div>
              <div className="space-y-2">
                <FieldLabel icon={CalendarDays}>Data de aquisição</FieldLabel>
                <Input
                  readOnly
                  disabled
                  value={vehicle.dataAquisicao ? formatDateBR(vehicle.dataAquisicao) : "—"}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="py-0 gap-0 overflow-hidden rounded-2xl">
            <SectionHeader icon={ClipboardCheck} title="Informações de uso" />
            <CardContent className="grid gap-4 pt-4 pb-5 sm:grid-cols-3">
              <div className="space-y-2">
                <FieldLabel icon={Gauge}>KM atual</FieldLabel>
                <Input readOnly disabled value={`${vehicle.kmAtual.toLocaleString("pt-BR")} km`} />
              </div>
              <div className="space-y-2">
                <FieldLabel icon={Gauge}>Intervalo troca de óleo</FieldLabel>
                <Input
                  readOnly
                  disabled
                  value={vehicle.oilChangeIntervalKm ? `${vehicle.oilChangeIntervalKm} km` : "—"}
                />
              </div>
              <div className="space-y-2">
                <FieldLabel icon={CalendarDays}>Última atualização</FieldLabel>
                <Input readOnly disabled value={formatDateBR(vehicle.updatedAt) || "—"} />
              </div>
            </CardContent>
          </Card>

          {(vehicle.observacoes || vehicle.observacoesAdicionais) && (
            <Card className="py-0 gap-0 overflow-hidden rounded-2xl">
              <SectionHeader icon={MessageSquareText} title="Observações" />
              <CardContent className="space-y-3 pt-4 pb-5">
                {vehicle.observacoes && (
                  <div className="space-y-2">
                    <FieldLabel icon={MessageSquareText}>Observações</FieldLabel>
                    <Textarea readOnly disabled rows={3} value={vehicle.observacoes} />
                  </div>
                )}
                {vehicle.observacoesAdicionais && (
                  <div className="space-y-2">
                    <FieldLabel icon={MessageSquareText}>Observações adicionais</FieldLabel>
                    <Textarea readOnly disabled rows={3} value={vehicle.observacoesAdicionais} />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
