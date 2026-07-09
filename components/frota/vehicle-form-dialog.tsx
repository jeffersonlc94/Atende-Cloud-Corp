"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  vehicleSchema,
  type VehicleFormValues,
  combustivelOptions,
  situacaoVeiculoOptions,
} from "@/lib/validations";
import { useCreateVehicle, useUpdateVehicle, type VehicleRecord } from "@/hooks/use-vehicles";
import { useCompanies } from "@/hooks/use-companies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Loader2, Plus, Upload } from "lucide-react";

const emptyValues: VehicleFormValues = {
  fotoUrl: "",
  placa: "",
  marca: "",
  modelo: "",
  versao: "",
  ano: new Date().getFullYear(),
  cor: "",
  renavam: "",
  chassi: "",
  combustivel: "Flex",
  companyId: "",
  kmAtual: 0,
  situacao: "Ativo",
  dataAquisicao: "",
  observacoes: "",
};

const situacaoLabels: Record<string, string> = {
  Ativo: "Ativo",
  Inativo: "Inativo",
  Manutencao: "Em manutenção",
};

export function VehicleFormDialog({ vehicle }: { vehicle?: VehicleRecord }) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { data: companies = [] } = useCompanies();
  const createVehicle = useCreateVehicle();
  const updateVehicle = useUpdateVehicle();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: vehicle
      ? {
          ...vehicle,
          dataAquisicao: vehicle.dataAquisicao ? vehicle.dataAquisicao.slice(0, 10) : "",
          fotoUrl: vehicle.fotoUrl ?? "",
          versao: vehicle.versao ?? "",
          cor: vehicle.cor ?? "",
          renavam: vehicle.renavam ?? "",
          chassi: vehicle.chassi ?? "",
          observacoes: vehicle.observacoes ?? "",
        }
      : emptyValues,
  });

  useEffect(() => {
    if (open) {
      reset(
        vehicle
          ? {
              ...vehicle,
              dataAquisicao: vehicle.dataAquisicao ? vehicle.dataAquisicao.slice(0, 10) : "",
              fotoUrl: vehicle.fotoUrl ?? "",
              versao: vehicle.versao ?? "",
              cor: vehicle.cor ?? "",
              renavam: vehicle.renavam ?? "",
              chassi: vehicle.chassi ?? "",
              observacoes: vehicle.observacoes ?? "",
            }
          : emptyValues
      );
    }
  }, [open, vehicle, reset]);

  const fotoUrl = watch("fotoUrl");

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
      setValue("fotoUrl", url, { shouldValidate: true });
    } catch {
      toast.error("Erro ao enviar foto");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(data: VehicleFormValues) {
    try {
      if (vehicle) {
        await updateVehicle.mutateAsync({ id: vehicle.id, data });
        toast.success("Veículo atualizado");
      } else {
        await createVehicle.mutateAsync(data);
        toast.success("Veículo cadastrado");
      }
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar veículo");
    }
  }

  const isSaving = createVehicle.isPending || updateVehicle.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          vehicle ? (
            <Button variant="ghost" size="sm">
              Editar
            </Button>
          ) : (
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Novo Veículo
            </Button>
          )
        }
      />
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{vehicle ? "Editar veículo" : "Novo veículo"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Foto</Label>
            <div className="flex items-center gap-3">
              {fotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fotoUrl} alt="Veículo" className="h-14 w-14 rounded object-cover border" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded border text-xs text-muted-foreground">
                  Sem foto
                </div>
              )}
              <label className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent">
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Enviar foto
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Placa *</Label>
            <Input {...register("placa")} className="uppercase" />
            {errors.placa && <p className="text-sm text-destructive">{errors.placa.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Empresa responsável *</Label>
            <Controller
              control={control}
              name="companyId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione a empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nomeFantasia || c.razaoSocial}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.companyId && (
              <p className="text-sm text-destructive">{errors.companyId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Marca *</Label>
            <Input {...register("marca")} />
            {errors.marca && <p className="text-sm text-destructive">{errors.marca.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Modelo *</Label>
            <Input {...register("modelo")} />
            {errors.modelo && <p className="text-sm text-destructive">{errors.modelo.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Versão</Label>
            <Input {...register("versao")} />
          </div>
          <div className="space-y-2">
            <Label>Ano *</Label>
            <Input type="number" {...register("ano", { valueAsNumber: true })} />
            {errors.ano && <p className="text-sm text-destructive">{errors.ano.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Cor</Label>
            <Input {...register("cor")} />
          </div>
          <div className="space-y-2">
            <Label>Combustível</Label>
            <Controller
              control={control}
              name="combustivel"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {combustivelOptions.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label>RENAVAM</Label>
            <Input {...register("renavam")} />
          </div>
          <div className="space-y-2">
            <Label>Chassi</Label>
            <Input {...register("chassi")} />
          </div>
          <div className="space-y-2">
            <Label>KM atual</Label>
            <Input type="number" {...register("kmAtual", { valueAsNumber: true })} />
          </div>
          <div className="space-y-2">
            <Label>Situação</Label>
            <Controller
              control={control}
              name="situacao"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {situacaoVeiculoOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {situacaoLabels[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label>Data de aquisição</Label>
            <Input type="date" {...register("dataAquisicao")} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Observações</Label>
            <Textarea rows={3} {...register("observacoes")} />
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
    </Dialog>
  );
}
