"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
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
  Car,
  Building2,
  Palette,
  Fuel,
  Hash,
  Gauge,
  CalendarDays,
  ClipboardCheck,
  MessageSquareText,
  ImageIcon,
  ImageOff,
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

export function VehicleForm({ initialData }: { initialData?: VehicleRecord }) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [fotoError, setFotoError] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingData, setPendingData] = useState<VehicleFormValues | null>(null);
  const { data: companies = [] } = useCompanies();
  const defaultCompany = companies.find((c) => c.isDefault);
  const createVehicle = useCreateVehicle();
  const updateVehicle = useUpdateVehicle();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          dataAquisicao: initialData.dataAquisicao ? initialData.dataAquisicao.slice(0, 10) : "",
          fotoUrl: initialData.fotoUrl ?? "",
          versao: initialData.versao ?? "",
          cor: initialData.cor ?? "",
          renavam: initialData.renavam ?? "",
          chassi: initialData.chassi ?? "",
          observacoes: initialData.observacoes ?? "",
        }
      : { ...emptyValues, companyId: defaultCompany?.id ?? "" },
  });

  const fotoUrl = watch("fotoUrl");
  const isEditing = !!initialData;

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
      setFotoError(false);
      setValue("fotoUrl", url, { shouldValidate: true });
    } catch {
      toast.error("Erro ao enviar foto");
    } finally {
      setUploading(false);
    }
  }

  async function persist(data: VehicleFormValues) {
    try {
      if (initialData) {
        await updateVehicle.mutateAsync({ id: initialData.id, data });
        toast.success("Veículo atualizado");
      } else {
        await createVehicle.mutateAsync(data);
        toast.success("Veículo cadastrado");
      }
      router.push("/frota/veiculos");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar veículo");
    }
  }

  async function onSubmit(data: VehicleFormValues) {
    setPendingData(data);
    setConfirmOpen(true);
  }

  const isSaving = createVehicle.isPending || updateVehicle.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditing ? "Editar Veículo" : "Novo Veículo"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Frota <span className="mx-1">›</span> Veículos <span className="mx-1">›</span>{" "}
            {isEditing ? "Editar Veículo" : "Novo Veículo"}
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
          <Button type="button" variant="outline" onClick={() => router.push("/frota/veiculos")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="py-0 gap-0 rounded-2xl">
          <SectionHeader icon={Car} title="Dados do Veículo" description="Informações cadastrais do veículo" />
          <CardContent className="grid gap-4 pt-4 pb-5 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <FieldLabel icon={ImageIcon}>Foto</FieldLabel>
              <div className="flex items-center gap-3">
                {fotoUrl && !fotoError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={fotoUrl}
                    alt="Veículo"
                    className="h-14 w-14 rounded object-cover border"
                    onError={() => setFotoError(true)}
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded border text-xs text-muted-foreground">
                    {fotoUrl ? <ImageOff className="h-5 w-5" /> : "Sem foto"}
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
              <FieldLabel icon={Hash}>Placa *</FieldLabel>
              <Input {...register("placa")} className="uppercase" />
              {errors.placa && <p className="text-sm text-destructive">{errors.placa.message}</p>}
            </div>
            <div className="space-y-2">
              <FieldLabel icon={Car}>Marca *</FieldLabel>
              <Input {...register("marca")} />
              {errors.marca && <p className="text-sm text-destructive">{errors.marca.message}</p>}
            </div>
            <div className="space-y-2">
              <FieldLabel icon={Car}>Modelo *</FieldLabel>
              <Input {...register("modelo")} />
              {errors.modelo && <p className="text-sm text-destructive">{errors.modelo.message}</p>}
            </div>
            <div className="space-y-2">
              <FieldLabel icon={Car}>Versão</FieldLabel>
              <Input {...register("versao")} />
            </div>
            <div className="space-y-2">
              <FieldLabel icon={CalendarDays}>Ano *</FieldLabel>
              <Input type="number" {...register("ano", { valueAsNumber: true })} />
              {errors.ano && <p className="text-sm text-destructive">{errors.ano.message}</p>}
            </div>
            <div className="space-y-2">
              <FieldLabel icon={Palette}>Cor</FieldLabel>
              <Input {...register("cor")} />
            </div>
            <div className="space-y-2">
              <FieldLabel icon={Fuel}>Combustível</FieldLabel>
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
              <FieldLabel icon={Hash}>RENAVAM</FieldLabel>
              <Input {...register("renavam")} />
            </div>
            <div className="space-y-2">
              <FieldLabel icon={Hash}>Chassi</FieldLabel>
              <Input {...register("chassi")} />
            </div>
            <div className="space-y-2">
              <FieldLabel icon={Gauge}>KM atual</FieldLabel>
              <Input type="number" {...register("kmAtual", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <FieldLabel icon={CalendarDays}>Data de aquisição</FieldLabel>
              <Input type="date" {...register("dataAquisicao")} />
            </div>
          </CardContent>
        </Card>

        <Card className="py-0 gap-0 rounded-2xl">
          <SectionHeader icon={Building2} title="Empresa e Situação" description="Empresa responsável e situação atual do veículo" />
          <CardContent className="grid gap-4 pt-4 pb-5 sm:grid-cols-2">
            <div className="space-y-2">
              <FieldLabel icon={Building2}>Empresa responsável *</FieldLabel>
              <Controller
                control={control}
                name="companyId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione a empresa">
                        {(value) =>
                          value
                            ? companies.find((c) => c.id === value)?.nomeFantasia ||
                              companies.find((c) => c.id === value)?.razaoSocial ||
                              "Selecione a empresa"
                            : "Selecione a empresa"
                        }
                      </SelectValue>
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
              <FieldLabel icon={ClipboardCheck}>Situação</FieldLabel>
              <Controller
                control={control}
                name="situacao"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {(value) => situacaoLabels[value as string] ?? "Selecione..."}
                      </SelectValue>
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
          </CardContent>
        </Card>

        <Card className="py-0 gap-0 rounded-2xl">
          <SectionHeader icon={MessageSquareText} title="Observações" description="Observações gerais sobre o veículo" />
          <CardContent className="pt-4 pb-5">
            <Textarea rows={4} placeholder="Observações gerais sobre o veículo..." {...register("observacoes")} />
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={isEditing ? "Deseja salvar as alterações?" : "Confirma o cadastro deste veículo?"}
        description={isEditing ? "Os dados do veículo serão atualizados." : "Um novo veículo será cadastrado."}
        onConfirm={() => pendingData && persist(pendingData)}
      />
    </form>
  );
}
