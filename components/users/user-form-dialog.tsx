"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { userSchema, type UserFormValues } from "@/lib/validations";
import { useCreateUser, useUpdateUser, type AppUser } from "@/hooks/use-users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus } from "lucide-react";

const emptyValues: UserFormValues = {
  name: "",
  email: "",
  password: "",
  role: "USER",
};

export function UserFormDialog({ user }: { user?: AppUser }) {
  const [open, setOpen] = useState(false);
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: user ? { ...user, password: "" } : emptyValues,
  });

  useEffect(() => {
    if (open) reset(user ? { ...user, password: "" } : emptyValues);
  }, [open, user, reset]);

  const role = watch("role");

  async function onSubmit(data: UserFormValues) {
    try {
      if (user) {
        await updateUser.mutateAsync({ id: user.id, data });
        toast.success("Usuário atualizado");
      } else {
        await createUser.mutateAsync(data);
        toast.success("Usuário cadastrado");
      }
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar usuário");
    }
  }

  const isSaving = createUser.isPending || updateUser.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          user ? (
            <Button variant="ghost" size="sm">
              Editar
            </Button>
          ) : (
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Novo Usuário
            </Button>
          )
        }
      />
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{user ? "Editar usuário" : "Novo usuário"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>E-mail *</Label>
            <Input type="email" {...register("email")} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>{user ? "Nova senha (deixe em branco para manter)" : "Senha *"}</Label>
            <Input type="password" {...register("password")} />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Perfil *</Label>
            <Select value={role} onValueChange={(v) => setValue("role", v as UserFormValues["role"])}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o perfil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Administrador</SelectItem>
                <SelectItem value="USER">Usuário</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
