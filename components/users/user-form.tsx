"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { userSchema, type UserFormValues } from "@/lib/validations";
import { useCreateUser, useUpdateUser, type AppUser } from "@/hooks/use-users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Loader2,
  Save,
  ArrowLeft,
  User,
  Mail,
  Lock,
  ShieldCheck,
  Briefcase,
  FileText,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
}) {
  return (
    <CardHeader className="border-b">
      <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </CardTitle>
      {description && <CardDescription>{description}</CardDescription>}
    </CardHeader>
  );
}

function FieldLabel({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <Label className="flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      {children}
    </Label>
  );
}

const emptyValues: UserFormValues = {
  name: "",
  email: "",
  password: "",
  role: "USER",
  cargo: undefined,
  canAccessOrcamentos: true,
  canAccessFrota: true,
};

export function UserForm({ initialData }: { initialData?: AppUser }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingData, setPendingData] = useState<UserFormValues | null>(null);
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: initialData
      ? { ...initialData, password: "", cargo: initialData.cargo ?? undefined }
      : emptyValues,
  });

  const role = watch("role");
  const cargo = watch("cargo");
  const canAccessOrcamentos = watch("canAccessOrcamentos");
  const canAccessFrota = watch("canAccessFrota");
  const isEditing = !!initialData;

  async function persist(data: UserFormValues) {
    try {
      if (initialData) {
        await updateUser.mutateAsync({ id: initialData.id, data });
        toast.success("Usuário atualizado");
      } else {
        await createUser.mutateAsync(data);
        toast.success("Usuário cadastrado");
      }
      router.push("/usuarios");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar usuário");
    }
  }

  async function onSubmit(data: UserFormValues) {
    if (initialData) {
      setPendingData(data);
      setConfirmOpen(true);
      return;
    }
    await persist(data);
  }

  const isSaving = createUser.isPending || updateUser.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditing ? "Editar Usuário" : "Novo Usuário"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Usuários <span className="mx-1">›</span>{" "}
            {isEditing ? "Editar Usuário" : "Novo Usuário"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/usuarios")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="py-0 gap-0 rounded-2xl">
          <SectionHeader icon={User} title="Dados do Usuário" description="Informações de acesso ao sistema" />
          <CardContent className="grid gap-4 pt-4 pb-5 sm:grid-cols-2">
            <div className="space-y-2">
              <FieldLabel icon={User}>Nome *</FieldLabel>
              <Input {...register("name")} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <FieldLabel icon={Mail}>E-mail *</FieldLabel>
              <Input type="email" {...register("email")} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <FieldLabel icon={Lock}>
                {isEditing ? "Nova senha (deixe em branco para manter)" : "Senha *"}
              </FieldLabel>
              <Input type="password" {...register("password")} />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <FieldLabel icon={ShieldCheck}>Perfil *</FieldLabel>
              <Select value={role} onValueChange={(v) => setValue("role", v as UserFormValues["role"])}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o perfil">
                    {(value) =>
                      value === "ADMIN"
                        ? "Administrador"
                        : value === "USER"
                          ? "Usuário"
                          : "Selecione o perfil"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                  <SelectItem value="USER">Usuário</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <FieldLabel icon={Briefcase}>Cargo</FieldLabel>
              <Select
                value={cargo ?? "none"}
                onValueChange={(v) =>
                  setValue("cargo", v === "none" ? undefined : (v as UserFormValues["cargo"]))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o cargo">
                    {(value) =>
                      value === "TECNICO"
                        ? "Técnico"
                        : value === "VENDEDOR"
                          ? "Vendedor"
                          : "Não definido"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não definido</SelectItem>
                  <SelectItem value="TECNICO">Técnico</SelectItem>
                  <SelectItem value="VENDEDOR">Vendedor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="py-0 gap-0 rounded-2xl">
          <SectionHeader
            icon={ShieldCheck}
            title="Permissões de Módulo"
            description="Controle quais módulos este usuário pode acessar (administradores sempre têm acesso total)"
          />
          <CardContent className="grid gap-4 pt-4 pb-5 sm:grid-cols-2">
            <label className="flex items-center gap-2 rounded-lg border p-3 text-sm font-medium">
              <Checkbox
                checked={!!canAccessOrcamentos}
                onCheckedChange={(v) => setValue("canAccessOrcamentos", v === true)}
              />
              <FileText className="h-4 w-4 text-muted-foreground" />
              Orçamentos
            </label>
            <label className="flex items-center gap-2 rounded-lg border p-3 text-sm font-medium">
              <Checkbox
                checked={!!canAccessFrota}
                onCheckedChange={(v) => setValue("canAccessFrota", v === true)}
              />
              <Truck className="h-4 w-4 text-muted-foreground" />
              Controle de Veículos
            </label>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Deseja salvar as alterações?"
        description="As informações do usuário serão atualizadas."
        onConfirm={() => pendingData && persist(pendingData)}
      />
    </form>
  );
}
