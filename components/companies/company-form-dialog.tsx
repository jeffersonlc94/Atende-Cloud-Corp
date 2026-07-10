"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus, Upload, Star } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

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

export function CompanyFormDialog({ company }: { company?: Company }) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingData, setPendingData] = useState<CompanyFormValues | null>(null);
  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: company ?? emptyValues,
  });

  useEffect(() => {
    if (open) reset(company ?? emptyValues);
  }, [open, company, reset]);

  const logoUrl = watch("logoUrl");

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
      if (company) {
        await updateCompany.mutateAsync({ id: company.id, data });
        toast.success("Empresa atualizada");
      } else {
        await createCompany.mutateAsync(data);
        toast.success("Empresa cadastrada");
      }
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar empresa");
    }
  }

  async function onSubmit(data: CompanyFormValues) {
    if (company) {
      setPendingData(data);
      setConfirmOpen(true);
      return;
    }
    await persist(data);
  }

  const isSaving = createCompany.isPending || updateCompany.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          company ? (
            <Button variant="ghost" size="sm">
              Editar
            </Button>
          ) : (
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nova Empresa
            </Button>
          )
        }
      />
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>{company ? "Editar empresa" : "Nova empresa emissora"}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Dados usados na emissão de orçamentos e como empresa responsável na Frota
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5 pt-2 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Logo</Label>
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
            <Label>Razão social *</Label>
            <Input {...register("razaoSocial")} />
            {errors.razaoSocial && (
              <p className="text-sm text-destructive">{errors.razaoSocial.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Nome fantasia</Label>
            <Input {...register("nomeFantasia")} />
          </div>
          <div className="space-y-2">
            <Label>CNPJ</Label>
            <Input {...register("cnpj")} />
          </div>
          <div className="space-y-2">
            <Label>Inscrição estadual</Label>
            <Input {...register("inscricaoEstadual")} />
          </div>
          <div className="space-y-2">
            <Label>Nome do responsável</Label>
            <Input {...register("nomeResponsavel")} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Endereço</Label>
            <Input {...register("endereco")} />
          </div>
          <div className="space-y-2">
            <Label>Cidade</Label>
            <Input {...register("cidade")} />
          </div>
          <div className="space-y-2">
            <Label>Estado (UF)</Label>
            <Input maxLength={2} {...register("estado")} />
          </div>
          <div className="space-y-2">
            <Label>CEP</Label>
            <Input {...register("cep")} />
          </div>
          <div className="space-y-2">
            <Label>Telefone 1</Label>
            <Input {...register("telefone1")} />
          </div>
          <div className="space-y-2">
            <Label>Telefone 2</Label>
            <Input {...register("telefone2")} />
          </div>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input type="email" {...register("email")} />
          </div>
          <div className="space-y-2">
            <Label>Site</Label>
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

          <DialogFooter className="sm:col-span-2">
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

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Deseja salvar as alterações?"
        description="Os dados da empresa serão atualizados."
        onConfirm={() => pendingData && persist(pendingData)}
      />
    </Dialog>
  );
}
