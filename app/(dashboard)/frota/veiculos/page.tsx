"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useVehicles, useDeleteVehicle } from "@/hooks/use-vehicles";
import { canDeleteRecords } from "@/lib/permissions";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Car, Plus, Trash2 } from "lucide-react";

export default function VeiculosPage() {
  const { data: session } = useSession();
  const canDelete = canDeleteRecords(session);
  const [placa, setPlaca] = useState("");
  const { data: vehicles = [], isLoading } = useVehicles({ placa });
  const deleteVehicle = useDeleteVehicle();
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  async function handleDelete(id: string) {
    try {
      await deleteVehicle.mutateAsync(id);
      toast.success("Veículo excluído");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir veículo");
    } finally {
      setPendingDelete(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Veículos</h1>
          <p className="text-sm text-muted-foreground">Cadastro de veículos da frota</p>
        </div>
        <Link href="/frota/veiculos/novo" className={buttonVariants()}>
          <Plus className="mr-2 h-4 w-4" /> Novo Veículo
        </Link>
      </div>

      <Card>
        <CardContent className="p-4">
          <Input
            placeholder="Buscar por placa"
            value={placa}
            onChange={(e) => setPlaca(e.target.value)}
            className="max-w-xs"
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14" />
                  <TableHead>Placa</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead>KM atual</TableHead>
                  <TableHead className="w-40" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && vehicles.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      Nenhum veículo cadastrado
                    </TableCell>
                  </TableRow>
                )}
                {vehicles.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell>
                      {v.fotoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={v.fotoUrl}
                          alt={v.placa}
                          className="h-10 w-10 rounded-full border object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border bg-muted text-muted-foreground">
                          <Car className="h-5 w-5" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link href={`/frota/veiculos/${v.id}`} className="hover:underline">
                        {v.placa}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {v.marca} {v.modelo} {v.versao ? `— ${v.versao}` : ""}
                    </TableCell>
                    <TableCell>{v.company.nomeFantasia || v.company.razaoSocial}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          v.situacao === "Ativo"
                            ? "default"
                            : v.situacao === "Manutencao"
                            ? "outline"
                            : "secondary"
                        }
                      >
                        {v.situacao === "Manutencao" ? "Manutenção" : v.situacao}
                      </Badge>
                    </TableCell>
                    <TableCell>{v.kmAtual.toLocaleString("pt-BR")} km</TableCell>
                    <TableCell className="flex justify-end gap-1">
                      <Link
                        href={`/frota/veiculos/${v.id}/editar`}
                        className={buttonVariants({ variant: "ghost", size: "sm" })}
                      >
                        Editar
                      </Link>
                      {canDelete && (
                        <Button variant="ghost" size="icon" onClick={() => setPendingDelete(v.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-sm">
            <CardContent className="space-y-4 p-6">
              <p className="font-medium">Confirma a exclusão deste veículo?</p>
              <p className="text-sm text-muted-foreground">
                Todos os registros vinculados (checklists, manutenções, documentos, etc.) serão excluídos.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setPendingDelete(null)}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={() => handleDelete(pendingDelete)}>
                  Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
