"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Star, Plus } from "lucide-react";
import { useCompanies, useDeleteCompany } from "@/hooks/use-companies";
import { canDeleteRecords } from "@/lib/permissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

/**
 * Cadastro de empresas emissoras, reutilizado tanto pela aba "Empresas Emissoras"
 * em Configurações quanto (por compatibilidade) pela antiga rota /empresas.
 */
export function CompaniesManager() {
  const { data: session } = useSession();
  const canDelete = canDeleteRecords(session);
  const { data: companies = [], isLoading } = useCompanies();
  const deleteCompany = useDeleteCompany();
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  async function handleDelete(id: string) {
    try {
      await deleteCompany.mutateAsync(id);
      toast.success("Empresa excluída");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir empresa");
    } finally {
      setPendingDelete(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Empresas Emissoras</h2>
          <p className="text-sm text-muted-foreground">
            Cadastro das empresas usadas na emissão de orçamentos e como empresa
            responsável no módulo de Frota. Marque uma empresa como padrão para
            que ela seja pré-selecionada automaticamente em novos cadastros.
          </p>
        </div>
        <Link href="/configuracoes/empresas/novo" className={buttonVariants()}>
          <Plus className="mr-2 h-4 w-4" /> Nova Empresa
        </Link>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="border-b">
          <CardTitle className="text-sm font-semibold">Empresas cadastradas</CardTitle>
          <CardDescription>{companies.length} empresa(s)</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>Razão social</TableHead>
                  <TableHead>Nome fantasia</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Cidade/UF</TableHead>
                  <TableHead className="w-32" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && companies.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      Nenhuma empresa cadastrada
                    </TableCell>
                  </TableRow>
                )}
                {companies.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      {c.isDefault && (
                        <Badge variant="secondary" className="gap-1">
                          <Star className="h-3 w-3 text-amber-500" /> Padrão
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{c.razaoSocial}</TableCell>
                    <TableCell>{c.nomeFantasia || "—"}</TableCell>
                    <TableCell>{c.cnpj || "—"}</TableCell>
                    <TableCell>
                      {c.cidade ? `${c.cidade}${c.estado ? "/" + c.estado : ""}` : "—"}
                    </TableCell>
                    <TableCell className="flex justify-end gap-1">
                      <Link
                        href={`/configuracoes/empresas/${c.id}/editar`}
                        className={buttonVariants({ variant: "ghost", size: "sm" })}
                      >
                        Editar
                      </Link>
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setPendingDelete(c.id)}
                        >
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
          <Card className="w-full max-w-sm rounded-2xl">
            <CardContent className="space-y-4 p-6">
              <p className="font-medium">Confirma a exclusão desta empresa?</p>
              <p className="text-sm text-muted-foreground">
                Empresas com orçamentos vinculados não podem ser excluídas.
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
