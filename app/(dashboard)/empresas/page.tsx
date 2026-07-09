"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useCompanies, useDeleteCompany } from "@/hooks/use-companies";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CompanyFormDialog } from "@/components/companies/company-form-dialog";
import { Trash2 } from "lucide-react";

export default function EmpresasPage() {
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
          <h1 className="text-2xl font-bold tracking-tight">Empresas Emissoras</h1>
          <p className="text-sm text-muted-foreground">
            Cadastro das empresas usadas na emissão de orçamentos
          </p>
        </div>
        <CompanyFormDialog />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
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
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && companies.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      Nenhuma empresa cadastrada
                    </TableCell>
                  </TableRow>
                )}
                {companies.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.razaoSocial}</TableCell>
                    <TableCell>{c.nomeFantasia || "—"}</TableCell>
                    <TableCell>{c.cnpj || "—"}</TableCell>
                    <TableCell>
                      {c.cidade ? `${c.cidade}${c.estado ? "/" + c.estado : ""}` : "—"}
                    </TableCell>
                    <TableCell className="flex justify-end gap-1">
                      <CompanyFormDialog company={c} />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setPendingDelete(c.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
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
