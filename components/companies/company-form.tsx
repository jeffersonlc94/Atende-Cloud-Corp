"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { companySchema, type CompanyFormValues } from "@/lib/validations";
import {
  useCreateCompany,
  useUpdateCompany,
  type Company,
} from "@/hooks/use-companies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  Upload,
  Star,
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  User,
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

const emptyValues: CompanyFormValues = {
  razaoSocial: "",
  nomeFantasia: "",
  cnpj: "",
  inscricaoEstadual: "",
  endereco: "",
  cidade: "",
  estado: "",
  cep: "",
  telefone1: "",
  telefone2: "",
  email: "",
  site: "",
  logoUrl: "",
  nomeResponsavel: "",
  isDefault: false,
};

export function CompanyForm({ initialData }: { initialData?: Company }) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingData, setPendingData] = useState<CompanyFormValues | null>(null);
  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: initialData ?? emptyValues,
  });

  const logoUrl = watch("logoUrl");
  const isEditing = !!initialData;

  function goBack() {
    router.push("/configuracoes?tab=empresas");
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error();
      const { url } = await res.json();
      setValue("logoUrl", url, { shouldValidate: true });
    } catch {
      toast.error("Erro ao enviar logo");
    } finally {
      setUploading(false);
    }
  }

  async function persist(data: CompanyFormValues) {
    try {
      if (initialData) {
        await updateCompany.mutateAsync({ id: initialData.id, data });
        toast.success("Empresa atualizada");
      } else {
        await createCompany.mutateAsync(data);
        toast.success("Empresa cadastrada");
      }
      goBack();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar empresa");
    }
  }

  async function onSubmit(data: CompanyFormValues) {
    if (initialData) {
      setPendingData(data);
      setConfirmOpen(true);
      return;
    }
    await persist(data);
  }

  const isSaving = createCompany.isPending || updateCompany.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditing ? "Editar Empresa" : "Nova Empresa"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Configurações <span className="mx-1">›</span> Empresas Emissoras <span className="mx-1">›</span>{" "}
            {isEditing ? "Editar Empresa" : "Nova Empresa"}
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
          <Button type="button" variant="outline" onClick={goBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="py-0 gap-0 rounded-2xl">
          <SectionHeader icon={Building2} title="Dados da Empresa" description="Informações usadas na emissão de orçamentos e como empresa responsável na Frota" />
          <CardContent className="grid gap-4 pt-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <FieldLabel icon={Building2}>Logo</FieldLabel>
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="Logo" className="h-14 w-14 rounded object-contain border" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded border text-xs text-muted-foreground">
                    Sem logo
                  </div>
                )}
                <label className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent">
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Enviar logo
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <FieldLabel icon={Building2}>Razão social *</FieldLabel>
              <Input {...register("razaoSocial")} />
              {errors.razaoSocial && (
                <p className="text-sm text-destructive">{errors.razaoSocial.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <FieldLabel icon={Building2}>Nome fantasia</FieldLabel>
              <Input {...register("nomeFantasia")} />
            </div>
            <div className="space-y-2">
              <FieldLabel icon={Building2}>CNPJ</FieldLabel>
              <Input {...register("cnpj")} />
            </div>
            <div className="space-y-2">
              <FieldLabel icon={Building2}>Inscrição estadual</FieldLabel>
              <Input {...register("inscricaoEstadual")} />
            </div>
            <div className="space-y-2">
              <FieldLabel icon={User}>Nome do responsável</FieldLabel>
              <Input {...register("nomeResponsavel")} />
            </div>
          </CardContent>
        </Card>

        <Card className="py-0 gap-0 rounded-2xl">
          <SectionHeader icon={MapPin} title="Endereço e Contato" description="Endereço, telefones e canais de contato" />
          <CardContent className="grid gap-4 pt-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <FieldLabel icon={MapPin}>Endereço</FieldLabel>
              <Input {...register("endereco")} />
            </div>
            <div className="space-y-2">
              <FieldLabel icon={MapPin}>Cidade</FieldLabel>
              <Input {...register("cidade")} />
            </div>
            <div className="space-y-2">
              <FieldLabel icon={MapPin}>Estado (UF)</FieldLabel>
              <Input maxLength={2} {...register("estado")} />
            </div>
            <div className="space-y-2">
              <FieldLabel icon={MapPin}>CEP</FieldLabel>
              <Input {...register("cep")} />
            </div>
            <div className="space-y-2">
              <FieldLabel icon={Phone}>Telefone 1</FieldLabel>
              <Input {...register("telefone1")} />
            </div>
            <div className="space-y-2">
              <FieldLabel icon={Phone}>Telefone 2</FieldLabel>
              <Input {...register("telefone2")} />
            </div>
            <div className="space-y-2">
              <FieldLabel icon={Mail}>E-mail</FieldLabel>
              <Input type="email" {...register("email")} />
            </div>
            <div className="space-y-2">
              <FieldLabel icon={Globe}>Site</FieldLabel>
              <Input {...register("site")} />
            </div>
            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-3 sm:col-span-2">
              <Checkbox
                id="isDefault"
                checked={watch("isDefault")}
                onCheckedChange={(checked) => setValue("isDefault", checked === true)}
              />
              <Label htmlFor="isDefault" className="flex items-center gap-1.5 font-normal">
                <Star className="h-3.5 w-3.5 text-amber-500" />
                Empresa padrão (usada na Gestão de Frota)
              </Label>
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Deseja salvar as alterações?"
        description="Os dados da empresa serão atualizados."
        onConfirm={() => pendingData && persist(pendingData)}
      />
    </form>
  );
}
