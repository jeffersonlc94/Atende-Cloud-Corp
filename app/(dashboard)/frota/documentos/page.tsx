"use client";

import { useState } from "react";
import Link from "next/link";
import { useVehicles } from "@/hooks/use-vehicles";
import { useVehicleDocuments } from "@/hooks/use-fleet";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateBR } from "@/lib/format";

function DocumentsForVehicle({ vehicleId, placa }: { vehicleId: string; placa: string }) {
  const { data: docs = [] } = useVehicleDocuments(vehicleId);
  const now = new Date();

  return (
    <>
      {docs.map((d) => {
        const vencido = d.dataVencimento && new Date(d.dataVencimento) < now;
        const vencendo =
          d.dataVencimento &&
          !vencido &&
          new Date(d.dataVencimento) <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        return (
          <TableRow key={d.id}>
            <TableCell>
              <Link href={`/frota/veiculos/${vehicleId}`} className="hover:underline">
                {placa}
              </Link>
            </TableCell>
            <TableCell>{d.tipo}</TableCell>
            <TableCell>{d.dataEmissao ? formatDateBR(d.dataEmissao) : "—"}</TableCell>
            <TableCell>{d.dataVencimento ? formatDateBR(d.dataVencimento) : "—"}</TableCell>
            <TableCell>
              {vencido && <Badge variant="destructive">Vencido</Badge>}
              {vencendo && <Badge variant="outline">Vencendo</Badge>}
              {!vencido && !vencendo && <Badge variant="secondary">OK</Badge>}
            </TableCell>
          </TableRow>
        );
      })}
    </>
  );
}

export default function DocumentosPage() {
  const { data: vehicles = [] } = useVehicles();
  const [vehicleId, setVehicleId] = useState<string>("all");

  const filtered = vehicleId === "all" ? vehicles : vehicles.filter((v) => v.id === vehicleId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documentos</h1>
          <p className="text-sm text-muted-foreground">
            Documentos dos veículos, com alertas de vencimento. Para adicionar um documento, acesse a página do veículo.
          </p>
        </div>
        <Select value={vehicleId} onValueChange={(v) => setVehicleId(v ?? "")}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os veículos</SelectItem>
            {vehicles.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.placa}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Placa</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Emissão</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      Nenhum veículo cadastrado
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((v) => (
                  <DocumentsForVehicle key={v.id} vehicleId={v.id} placa={v.placa} />
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
