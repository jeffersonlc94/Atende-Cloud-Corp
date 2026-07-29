"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useChecklists, useCreateChecklist, useDeleteChecklist, type ChecklistRecord } from "@/hooks/use-fleet";
import {
  tipoChecklistOptions,
  checklistItemTipoOptions,
  checklistItemStatusOptions,
  checklistItemTipoLabels,
} from "@/lib/validations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { VehicleSelect, formatVehicleLabel } from "@/components/frota/vehicle-select";
import { ChecklistItemStatusCard, checklistItemIcons, checklistItemIconColors, statusDotClasses, statusLabels, statusBorderClasses } from "@/components/frota/checklist-item-status";
import { ChecklistHistoryCard } from "@/components/frota/checklist-history-card";
import { formatDateBR } from "@/lib/format";
import { List, CalendarDays, Clock, Camera, Save, X, ImageOff, ShieldAlert, Filter } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

function FotoThumb({ url, alt, className }: { url: string; alt: string; className: string }) {
  const [error, setError] = useState(false);
  if (error) {
    return (
      <div className={`flex items-center justify-center rounded-md border bg-muted text-muted-foreground ${className}`}>
        <ImageOff className="h-5 w-5" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={alt} className={`rounded-md border object-cover ${className}`} onError={() => setError(true)} />
  );
}

export default function ChecklistsPage() {
  const searchParams = useSearchParams();
  const [filterVehicleId, setFilterVehicleId] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const { data: checklistsData = [], isLoading } = useChecklists(filterVehicleId || undefined);
  const checklists = filterStatus
    ? checklistsData.filter((c) => c.statusGeral === filterStatus)
    : checklistsData;
  const createChecklist = useCreateChecklist();
  const deleteChecklist = useDeleteChecklist();

  const [vehicleId, setVehicleId] = useState("");

  useEffect(() => {
    const vehicleIdParam = searchParams.get("vehicleId");
    if (vehicleIdParam) setVehicleId(vehicleIdParam);
  }, [searchParams]);
  const [km, setKm] = useState("");
  const [tipo, setTipo] = useState<(typeof tipoChecklistOptions)[number]>("Diario");
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [hora, setHora] = useState("");
  const [statusGeral, setStatusGeral] = useState<(typeof checklistItemStatusOptions)[number]>("OK");
  const [observacoes, setObservacoes] = useState("");
  const [fotos, setFotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  const [itemStatus, setItemStatus] = useState<Record<string, string>>(
    Object.fromEntries(checklistItemTipoOptions.map((i) => [i, "OK"]))
  );
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [viewing, setViewing] = useState<ChecklistRecord | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setPage(1);
  }, [filterVehicleId, filterStatus]);

  function resetForm() {
    setVehicleId("");
    setKm("");
    setTipo("Diario");
    setData(new Date().toISOString().slice(0, 10));
    setHora("");
    setStatusGeral("OK");
    setObservacoes("");
    setFotos([]);
    setItemStatus(Object.fromEntries(checklistItemTipoOptions.map((i) => [i, "OK"])));
  }

  function validate() {
    if (!vehicleId) {
      toast.error("Selecione um veículo");
      return false;
    }
    const kmNumber = parseInt(km, 10);
    if (!km || Number.isNaN(kmNumber) || kmNumber <= 0) {
      toast.error("Informe o KM atual do veículo (maior que zero)");
      return false;
    }
    return true;
  }

  async function handleSubmit() {
    const kmNumber = parseInt(km, 10);
    try {
      await createChecklist.mutateAsync({
        vehicleId,
        km: kmNumber,
        tipo,
        data,
        hora,
        statusGeral,
        observacoes,
        fotos,
        itens: checklistItemTipoOptions.map((item) => ({
          item,
          status: itemStatus[item] as (typeof checklistItemStatusOptions)[number],
        })),
      });
      toast.success("Checklist registrado");
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao registrar checklist");
    }
  }

  async function handleUploadFoto(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error || "Erro ao enviar foto");
      }
      setFotos((prev) => [...prev, body.url]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar foto");
    } finally {
      setUploading(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(checklists.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = checklists.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const rangeStart = checklists.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, checklists.length);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Checklist do Veículo</h1>
          <p className="text-sm text-muted-foreground">
            Registre as inspeções do veículo e mantenha a frota sempre segura
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => historyRef.current?.scrollIntoView({ behavior: "smooth" })}
        >
          <List className="h-4 w-4" />
          Ver checklists
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novo checklist</CardTitle>
          <CardDescription>Informe os dados abaixo e avalie os itens de inspeção.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-1">
              <Label>Veículo *</Label>
              <VehicleSelect value={vehicleId} onChange={setVehicleId} />
            </div>
            <div className="space-y-1">
              <Label>KM atual *</Label>
              <div className="relative">
                <NumberInput
                  placeholder="Ex: 45.000"
                  value={km ? Number(km) : undefined}
                  onValueChange={(v) => setKm(v === undefined ? "" : String(v))}
                  className="pr-9"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  km
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Tipo de checklist</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as typeof tipo)}>
                <SelectTrigger className="w-full">
                  <span className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <SelectValue />
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {tipoChecklistOptions.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Data *</Label>
              <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Hora</Label>
              <div className="relative">
                <Input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className="pl-9" />
                <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {checklistItemTipoOptions.map((item) => (
              <ChecklistItemStatusCard
                key={item}
                item={item}
                status={itemStatus[item]}
                onChange={(v) => setItemStatus((s) => ({ ...s, [item]: v }))}
                statusOptions={checklistItemStatusOptions}
              />
            ))}
          </div>

          <div
            className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 bg-card p-3 ${statusBorderClasses[statusGeral]}`}
          >
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-semibold leading-tight">Status geral do checklist</p>
                <p className="text-xs text-muted-foreground">
                  Use quando houver algo fora dos itens fixos (ex.: para-brisa quebrado), registrando o
                  detalhe em Observações.
                </p>
              </div>
            </div>
            <Select value={statusGeral} onValueChange={(v) => setStatusGeral(v as typeof statusGeral)}>
              <SelectTrigger className="h-9 w-48">
                <SelectValue>
                  <span className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${statusDotClasses[statusGeral]}`} />
                    {statusLabels[statusGeral]}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {checklistItemStatusOptions.map((s) => (
                  <SelectItem key={s} value={s}>
                    <span className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${statusDotClasses[s]}`} />
                      {statusLabels[s]}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Observações</Label>
              <Textarea
                rows={3}
                placeholder="Adicione observações sobre o veículo (opcional)..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Fotos (opcional)</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadFoto(file);
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-4 w-4" />
                {uploading ? "Enviando..." : "Enviar fotos"}
              </Button>
              {fotos.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {fotos.map((url, idx) => (
                    <div key={url} className="relative">
                      <FotoThumb url={url} alt={`Foto ${idx + 1}`} className="h-14 w-14" />
                      <button
                        type="button"
                        onClick={() => setFotos((prev) => prev.filter((u) => u !== url))}
                        className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground"
                        title="Remover foto"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={resetForm}>
              Limpar
            </Button>
            <Button
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={() => validate() && setConfirmOpen(true)}
              disabled={createChecklist.isPending}
            >
              <Save className="h-4 w-4" />
              Salvar checklist
            </Button>
          </div>
        </CardContent>
      </Card>

      <div ref={historyRef} className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Histórico de checklists</h2>

        <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-3">
          <div className="flex items-center gap-1.5 self-center text-sm text-muted-foreground">
            <Filter className="h-4 w-4" /> Filtros
          </div>
          <div className="w-64 space-y-1">
            <Label className="text-xs">Veículo</Label>
            <VehicleSelect
              value={filterVehicleId}
              onChange={setFilterVehicleId}
              allowEmpty
              emptyLabel="Todos os veículos"
              placeholder="Todos os veículos"
            />
          </div>
          <div className="w-52 space-y-1">
            <Label className="text-xs">Status geral</Label>
            <Select
              value={filterStatus || "__todos__"}
              onValueChange={(v) => setFilterStatus(!v || v === "__todos__" ? "" : v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__todos__">Todos os status</SelectItem>
                {checklistItemStatusOptions.map((s) => (
                  <SelectItem key={s} value={s}>
                    {statusLabels[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(filterVehicleId || filterStatus) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterVehicleId("");
                setFilterStatus("");
              }}
            >
              Limpar filtros
            </Button>
          )}
        </div>

        {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
        {!isLoading && checklists.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum checklist registrado ainda.</p>
        )}

        <div className="space-y-3">
          {paginated.map((c) => (
            <ChecklistHistoryCard
              key={c.id}
              checklist={c}
              onView={() => setViewing(c)}
              onDelete={() => setPendingDelete(c.id)}
            />
          ))}
        </div>

        {checklists.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-sm text-muted-foreground">
            <p>
              Mostrando {rangeStart} a {rangeEnd} de {checklists.length} checklists
            </p>
            <div className="flex items-center gap-3">
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  setPageSize(Number(v));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-28 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} / página
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <span>
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-lg">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle>Checklist {viewing.tipo}</DialogTitle>
                <DialogDescription>
                  {formatVehicleLabel(viewing.vehicle)} — {formatDateBR(viewing.data)} {viewing.hora || ""}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <p>
                  <span className="font-medium">KM atual:</span> {viewing.km?.toLocaleString("pt-BR") ?? "—"}
                </p>
                <p>
                  <span className="font-medium">Por:</span> {viewing.user?.name ?? "—"}
                </p>
                <p className="flex items-center gap-1.5">
                  <span className="font-medium">Status geral:</span>
                  <span className={`h-2 w-2 rounded-full ${statusDotClasses[viewing.statusGeral]}`} />
                  {statusLabels[viewing.statusGeral] ?? viewing.statusGeral}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {viewing.itens.map((i) => {
                    const Icon = checklistItemIcons[i.item as keyof typeof checklistItemIcons];
                    const iconColor = checklistItemIconColors[i.item as keyof typeof checklistItemIconColors];
                    return (
                      <div key={i.id} className="flex items-center gap-2 rounded-md border p-2">
                        {Icon && <Icon className={`h-4 w-4 ${iconColor}`} />}
                        <span className="flex-1 truncate">
                          {checklistItemTipoLabels[i.item as keyof typeof checklistItemTipoLabels] ?? i.item}
                        </span>
                        <span className={`h-2 w-2 rounded-full ${statusDotClasses[i.status]}`} />
                        <span className="text-xs text-muted-foreground">{statusLabels[i.status]}</span>
                      </div>
                    );
                  })}
                </div>
                {viewing.observacoes && (
                  <p>
                    <span className="font-medium">Observações:</span> {viewing.observacoes}
                  </p>
                )}
                {viewing.fotos?.length > 0 && (
                  <div>
                    <p className="mb-1 font-medium">Fotos:</p>
                    <div className="flex flex-wrap gap-2">
                      {viewing.fotos.map((url) => (
                        <FotoThumb key={url} url={url} alt="Foto do checklist" className="h-20 w-20" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title="Confirma a exclusão deste checklist?"
        description="Esta ação não pode ser desfeita."
        variant="destructive"
        confirmLabel="Excluir"
        onConfirm={() => pendingDelete && deleteChecklist.mutate(pendingDelete)}
      />
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirma o registro deste checklist?"
        confirmLabel="Salvar"
        onConfirm={handleSubmit}
      />
    </div>
  );
}
