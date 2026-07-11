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
  categoriaVeiculoOptions,
  tracaoOptions,
  tipoUsoOptions,
} from "@/lib/validations";
import { useCreateVehicle, useUpdateVehicle, type VehicleRecord } from "@/hooks/use-vehicles";
import { useCompanies } from "@/hooks/use-companies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDateBR } from "@/lib/format";
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
  Trash2,
  Info,
  Wrench,
  DollarSign,
  Tag,
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

function FieldLabel({
  icon: Icon,
  children,
  tooltip,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
  tooltip?: string;
}) {
  return (
    <Label className="flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      {children}
      {tooltip && (
        <Tooltip>
          <TooltipTrigger className="inline-flex">
            <Info className="h-3.5 w-3.5 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
      )}
    </Label>
  );
}

const NONE = "__none__";

const emptyValues: VehicleFormValues = {
  fotoUrl: "",
  nome: "",
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
  categoria: undefined,
  capacidadeCarga: undefined,
  potencia: undefined,
  tracao: undefined,
  oilChangeIntervalKm: undefined,
  tipoUso: undefined,
  valorAquisicao: undefined,
  observacoesAdicionais: "",
  dataAquisicao: "",
  observacoes: "",
};

const situacaoLabels: Record<string, string> = {
  Ativo: "Ativo",
  Inativo: "Inativo",
  Manutencao: "Em manutenção",
};

const situacaoBadgeVariant: Record<string, "default" | "secondary" | "outline"> = {
  Ativo: "default",
  Inativo: "secondary",
  Manutencao: "outline",
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
          nome: initialData.nome ?? "",
          dataAquisicao: initialData.dataAquisicao ? initialData.dataAquisicao.slice(0, 10) : "",
          fotoUrl: initialData.fotoUrl ?? "",
          versao: initialData.versao ?? "",
          cor: initialData.cor ?? "",
          renavam: initialData.renavam ?? "",
          chassi: initialData.chassi ?? "",
          observacoes: initialData.observacoes ?? "",
          categoria: (initialData.categoria as VehicleFormValues["categoria"]) ?? undefined,
          capacidadeCarga: initialData.capacidadeCarga ?? undefined,
          potencia: initialData.potencia ?? undefined,
          tracao: (initialData.tracao as VehicleFormValues["tracao"]) ?? undefined,
          oilChangeIntervalKm: initialData.oilChangeIntervalKm ?? undefined,
          tipoUso: (initialData.tipoUso as VehicleFormValues["tipoUso"]) ?? undefined,
          valorAquisicao: initialData.valorAquisicao
            ? Number(initialData.valorAquisicao)
            : undefined,
          observacoesAdicionais: initialData.observacoesAdicionais ?? "",
        }
      : { ...emptyValues, companyId: defaultCompany?.id ?? "" },
  });

  const fotoUrl = watch("fotoUrl");
  const observacoes = watch("observacoes") ?? "";
  const observacoesAdicionais = watch("observacoesAdicionais") ?? "";
  const kmAtual = watch("kmAtual") ?? 0;
  const isEditing = !!initialData;

  const lastOil = initialData?.oilChanges?.[0];
  const lastMileage = initialData?.mileageLogs?.[0];
  const oilIntervalKm = initialData?.oilChangeIntervalKm ?? undefined;

  // Meta de km para a próxima troca: prioriza o kmProximaTroca do último
  // registro de troca; se não houver, usa o fallback (última troca + intervalo).
  const proximaTrocaKm =
    lastOil?.kmProximaTroca ??
    (lastOil && oilIntervalKm ? lastOil.km + oilIntervalKm : undefined);

  const progress =
    lastOil && proximaTrocaKm && proximaTrocaKm > lastOil.km
      ? Math.min(100, Math.max(0, ((kmAtual - lastOil.km) / (proximaTrocaKm - lastOil.km)) * 100))
      : 0;

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
        <div className="flex items-start gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="mt-0.5"
            onClick={() => router.push("/frota/veiculos")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isEditing ? "Editar Veículo" : "Novo Veículo"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isEditing
                ? "Atualize as informações do veículo da frota."
                : "Cadastre um novo veículo da frota."}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => router.push("/frota/veiculos")}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isEditing ? "Salvar alterações" : "Cadastrar veículo"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Coluna esquerda (larga) */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="py-0 gap-0 rounded-2xl">
            <SectionHeader icon={Car} title="Informações principais" />
            <CardContent className="grid gap-4 pt-4 pb-5 sm:grid-cols-3">
              <div className="space-y-2">
                <FieldLabel icon={Tag}>Nome do veículo</FieldLabel>
                <Input placeholder="Ex.: Van 01" {...register("nome")} />
              </div>
              <div className="space-y-2">
                <FieldLabel icon={Hash}>Placa *</FieldLabel>
                <Input {...register("placa")} className="uppercase" />
                {errors.placa && <p className="text-sm text-destructive">{errors.placa.message}</p>}
              </div>
              <div className="space-y-2">
                <FieldLabel icon={Hash}>Renavam</FieldLabel>
                <Input {...register("renavam")} />
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
                <FieldLabel icon={CalendarDays}>Ano *</FieldLabel>
                <Input type="number" {...register("ano", { valueAsNumber: true })} />
                {errors.ano && <p className="text-sm text-destructive">{errors.ano.message}</p>}
              </div>
              <div className="space-y-2">
                <FieldLabel icon={Building2}>Empresa *</FieldLabel>
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
                <FieldLabel icon={ClipboardCheck}>Status *</FieldLabel>
                <Controller
                  control={control}
                  name="situacao"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {(value) => (
                            <Badge variant={situacaoBadgeVariant[value as string] ?? "outline"}>
                              {situacaoLabels[value as string] ?? "Selecione..."}
                            </Badge>
                          )}
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
              <div className="space-y-2">
                <FieldLabel icon={Tag}>Categoria</FieldLabel>
                <Controller
                  control={control}
                  name="categoria"
                  render={({ field }) => (
                    <Select
                      value={field.value ?? NONE}
                      onValueChange={(v) => field.onChange(v === NONE ? undefined : v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>Não informado</SelectItem>
                        {categoriaVeiculoOptions.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
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
            <SectionHeader icon={Wrench} title="Especificações" />
            <CardContent className="grid gap-4 pt-4 pb-5 sm:grid-cols-3">
              <div className="space-y-2">
                <FieldLabel icon={Fuel}>Tipo de combustível</FieldLabel>
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
                <FieldLabel icon={Palette}>Cor</FieldLabel>
                <Input {...register("cor")} />
              </div>
              <div className="space-y-2">
                <FieldLabel icon={Hash}>Chassi</FieldLabel>
                <Input {...register("chassi")} />
              </div>
              <div className="space-y-2">
                <FieldLabel icon={Gauge}>Capacidade de carga (kg)</FieldLabel>
                <Controller
                  control={control}
                  name="capacidadeCarga"
                  render={({ field }) => (
                    <NumberInput value={field.value as number | undefined} onValueChange={field.onChange} onBlur={field.onBlur} />
                  )}
                />
              </div>
              <div className="space-y-2">
                <FieldLabel icon={Gauge}>Potência (cv)</FieldLabel>
                <Input type="number" {...register("potencia", { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <FieldLabel icon={Car}>Tração</FieldLabel>
                <Controller
                  control={control}
                  name="tracao"
                  render={({ field }) => (
                    <Select
                      value={field.value ?? NONE}
                      onValueChange={(v) => field.onChange(v === NONE ? undefined : v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>Não informado</SelectItem>
                        {tracaoOptions.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
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
            <SectionHeader icon={Gauge} title="Referência de Troca de Óleo" />
            <CardContent className="grid gap-4 pt-4 pb-5 sm:grid-cols-2">
              <div className="grid gap-4 sm:grid-cols-3 sm:col-span-2">
                <div className="space-y-2">
                  <FieldLabel
                    icon={Gauge}
                    tooltip="Intervalo padrão sugerido para troca de óleo deste veículo (ex.: a cada 5.000 km). Diferente do histórico real de trocas."
                  >
                    Intervalo de troca de óleo * (km)
                  </FieldLabel>
                  <Controller
                    control={control}
                    name="oilChangeIntervalKm"
                    render={({ field }) => (
                      <NumberInput
                        placeholder="Ex.: 5.000"
                        value={field.value as number | undefined}
                        onValueChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <FieldLabel icon={Gauge}>KM da última troca</FieldLabel>
                  <Input readOnly disabled value={lastOil ? lastOil.km.toLocaleString("pt-BR") : "—"} />
                </div>
                <div className="space-y-2">
                  <FieldLabel icon={CalendarDays}>Data da última troca</FieldLabel>
                  <Input
                    readOnly
                    disabled
                    value={lastOil ? formatDateBR(lastOil.data) : "Nenhum registro"}
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <Card className="bg-muted/40">
                  <CardContent className="space-y-2 p-4">
                    <p className="text-sm font-semibold">Progresso atual</p>
                    {lastOil && proximaTrocaKm ? (
                      <>
                        <Progress value={progress} className="[&>div]:bg-green-600" />
                        <p className="text-xs text-muted-foreground">
                          {Math.round(progress)}% — Você já percorreu{" "}
                          {Math.max(0, kmAtual - lastOil.km).toLocaleString("pt-BR")} dos{" "}
                          {(proximaTrocaKm - lastOil.km).toLocaleString("pt-BR")} km
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Próxima manutenção estimada: {proximaTrocaKm.toLocaleString("pt-BR")} km
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Nenhum registro de troca de óleo para calcular o progresso.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card className="py-0 gap-0 rounded-2xl">
            <SectionHeader icon={ClipboardCheck} title="Informações de uso" />
            <CardContent className="grid gap-4 pt-4 pb-5 sm:grid-cols-3">
              <div className="space-y-2">
                <FieldLabel icon={Gauge}>KM atual</FieldLabel>
                <Controller
                  control={control}
                  name="kmAtual"
                  render={({ field }) => (
                    <NumberInput value={field.value as number | undefined} onValueChange={field.onChange} onBlur={field.onBlur} />
                  )}
                />
              </div>
              <div className="space-y-2">
                <FieldLabel icon={CalendarDays}>Data da última atualização</FieldLabel>
                <Input
                  readOnly
                  disabled
                  value={
                    lastMileage
                      ? formatDateBR(lastMileage.data)
                      : initialData
                        ? formatDateBR(initialData.updatedAt)
                        : "—"
                  }
                />
              </div>
              <div className="space-y-2">
                <FieldLabel icon={Gauge}>Próxima manutenção</FieldLabel>
                <Input
                  readOnly
                  disabled
                  value={proximaTrocaKm ? `${proximaTrocaKm.toLocaleString("pt-BR")} km` : "—"}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="py-0 gap-0 rounded-2xl">
            <SectionHeader icon={MessageSquareText} title="Observações" />
            <CardContent className="space-y-1 pt-4 pb-5">
              <Textarea
                rows={4}
                maxLength={500}
                placeholder="Observações gerais sobre o veículo..."
                {...register("observacoes")}
              />
              <p className="text-right text-xs text-muted-foreground">
                {observacoes.length}/500
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Coluna direita (estreita) */}
        <div className="space-y-6">
          <Card className="py-0 gap-0 rounded-2xl">
            <SectionHeader icon={ImageIcon} title="Imagem do veículo" />
            <CardContent className="space-y-3 pt-4 pb-5">
              {fotoUrl && !fotoError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={fotoUrl}
                  alt="Veículo"
                  className="h-40 w-full rounded-lg object-cover border"
                  onError={() => setFotoError(true)}
                />
              ) : (
                <div className="flex h-40 w-full items-center justify-center rounded-lg border text-sm text-muted-foreground">
                  {fotoUrl ? <ImageOff className="h-6 w-6" /> : "Sem foto"}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <label className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent">
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Alterar imagem
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
                {fotoUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setValue("fotoUrl", "", { shouldValidate: true });
                      setFotoError(false);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Formatos aceitos: PNG, JPG ou WEBP. Tamanho máximo: 5MB.
              </p>
            </CardContent>
          </Card>

          <Card className="py-0 gap-0 rounded-2xl">
            <SectionHeader icon={Info} title="Informações adicionais" />
            <CardContent className="space-y-4 pt-4 pb-5">
              <div className="space-y-2">
                <FieldLabel icon={Tag}>Tipo de uso</FieldLabel>
                <Controller
                  control={control}
                  name="tipoUso"
                  render={({ field }) => (
                    <Select
                      value={field.value ?? NONE}
                      onValueChange={(v) => field.onChange(v === NONE ? undefined : v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>Não informado</SelectItem>
                        {tipoUsoOptions.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <FieldLabel icon={CalendarDays}>Data de aquisição</FieldLabel>
                <Input type="date" {...register("dataAquisicao")} />
              </div>
              <div className="space-y-2">
                <FieldLabel icon={DollarSign}>Valor de aquisição (R$)</FieldLabel>
                <Controller
                  control={control}
                  name="valorAquisicao"
                  render={({ field }) => (
                    <CurrencyInput value={field.value as number | undefined} onValueChange={field.onChange} onBlur={field.onBlur} />
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="py-0 gap-0 rounded-2xl">
            <SectionHeader icon={MessageSquareText} title="Observações adicionais" />
            <CardContent className="space-y-1 pt-4 pb-5">
              <Textarea
                rows={4}
                maxLength={300}
                placeholder="Observações adicionais..."
                {...register("observacoesAdicionais")}
              />
              <p className="text-right text-xs text-muted-foreground">
                {observacoesAdicionais.length}/300
              </p>
            </CardContent>
          </Card>
        </div>
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
