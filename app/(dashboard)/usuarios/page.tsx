"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useUsers, useDeleteUser } from "@/hooks/use-users";
import { canManageUsers } from "@/lib/permissions";
import { Card, CardContent } from "@/components/ui/card";
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
import { Plus, Trash2, ShieldAlert } from "lucide-react";

export default function UsuariosPage() {
  const { data: session } = useSession();
  const allowed = canManageUsers(session);
  const { data: users = [], isLoading } = useUsers();
  const deleteUser = useDeleteUser();
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  async function handleDelete(id: string) {
    try {
      await deleteUser.mutateAsync(id);
      toast.success("Usuário excluído");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir usuário");
    } finally {
      setPendingDelete(null);
    }
  }

  if (!allowed) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 p-10 text-center text-muted-foreground">
          <ShieldAlert className="h-8 w-8" />
          <p>Apenas administradores podem acessar o gerenciamento de usuários.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usuários</h1>
          <p className="text-sm text-muted-foreground">
            Gerenciamento de acesso ao sistema (somente administradores)
          </p>
        </div>
        <Link href="/usuarios/novo" className={buttonVariants()}>
          <Plus className="mr-2 h-4 w-4" /> Novo Usuário
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead className="w-32" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      Nenhum usuário cadastrado
                    </TableCell>
                  </TableRow>
                )}
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>
                        {u.role === "ADMIN" ? "Administrador" : "Usuário"}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex justify-end gap-1">
                      <Link
                        href={`/usuarios/${u.id}/editar`}
                        className={buttonVariants({ variant: "ghost", size: "sm" })}
                      >
                        Editar
                      </Link>
                      <Button variant="ghost" size="icon" onClick={() => setPendingDelete(u.id)}>
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
              <p className="font-medium">Confirma a exclusão deste usuário?</p>
              <p className="text-sm text-muted-foreground">
                Usuários com registros vinculados (orçamentos, checklists, etc.) não podem ser excluídos.
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
