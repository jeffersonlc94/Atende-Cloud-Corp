"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useVehicles } from "@/hooks/use-vehicles";
import {
  useAllVehicleDocuments,
  useCreateVehicleDocument,
  useUpdateVehicleDocument,
  useDeleteVehicleDocument,
  type VehicleDocumentWithVehicle,
} from "@/hooks/use-fleet";
import { tipoDocumentoOptions } from "@/lib/validations";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { VehicleSelect } from "@/components/frota/vehicle-select";
import { formatDateBR } from "@/lib/format";
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  LayoutGrid,
  List as ListIcon,
  PackageOpen,
  Upload,
  Eye,
  Download,
  Printer,
  Archive,
  ArchiveRestore,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const VIEW_MODE_KEY = "atende:documentos:viewMode";
type ViewMode = "grid" | "list";

function getDocStatus(doc: Pick<VehicleDocumentWithVehicle, "dataVencimento">) {
  if (!doc.dataVencimento) return { label: "Sem vencimento", variant: "secondary" as const };
  const now = new Date();
  const vencimento = new Date(doc.dataVencimento);
  if (vencimento < now) return { label: "Vencido", variant: "destructive" as const };
  if (vencimento <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)) {
    return { label: "Vencendo", variant: "outline" as const };
  }
  return { label: "OK", variant: "secondary" as const };
}

function DocumentPreviewDialog({
  doc,
  open,
  onOpenChange,
}: {
  doc: VehicleDocumentWithVehicle | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // Permite alternar entre o arquivo atual e as versões antigas do histórico.
  const [versaoUrl, setVersaoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open) setVersaoUrl(null);
  }, [open]);

  function handlePrint() {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.focus();
    win.print();
  }

  if (!doc?.arquivoUrl) return null;
  const url = versaoUrl ?? doc.arquivoUrl;
  const versoes = doc.versoes ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {doc.tipo} — {doc.vehicle.placa}
          </DialogTitle>
        </DialogHeader>
        {versaoUrl && (
          <div className="flex items-center justify-between gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
            <span>Você está vendo uma versão antiga deste documento.</span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setVersaoUrl(null)}
            >
              Voltar para a versão atual
            </Button>
          </div>
        )}
        <div className="h-[70vh] w-full overflow-hidden rounded-md border bg-muted">
          <iframe key={url} ref={iframeRef} src={url} title={doc.tipo} className="h-full w-full bg-white" />
        </div>
        {versoes.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              Histórico de versões ({versoes.length})
            </p>
            <div className="flex max-h-24 flex-col gap-1 overflow-y-auto">
              {versoes.map((v, i) => (
                <button
                  key={`${v.url}-${i}`}
                  type="button"
                  onClick={() => setVersaoUrl(v.url)}
                  className={cn(
                    "flex items-center justify-between rounded-md border px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-muted",
                    versaoUrl === v.url && "border-primary bg-primary/5"
                  )}
                >
                  <span className="truncate text-muted-foreground">
                    Versão substituída em {formatDateBR(v.substituidaEm)}
                  </span>
                  <span className="ml-2 shrink-0 text-sky-600">Visualizar / imprimir</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <a
            href={url}
            download
            className={buttonVariants({
              variant: "outline",
              className: "text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-500/10",
            })}
          >
            <Download className="mr-2 h-4 w-4" /> Baixar
          </a>
          <Button
            variant="outline"
            onClick={handlePrint}
            className="text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-500/10"
          >
            <Printer className="mr-2 h-4 w-4" /> Imprimir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function NovoDocumentoDialog({
  open,
  onOpenChange,
  editDoc,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editDoc?: VehicleDocumentWithVehicle | null;
}) {
  const [vehicleId, setVehicleId] = useState("");
  const [tipo, setTipo] = useState<(typeof tipoDocumentoOptions)[number]>("CRLV");
  const [dataEmissao, setDataEmissao] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");
  const [arquivoUrl, setArquivoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const createDoc = useCreateVehicleDocument(vehicleId);
  const updateDoc = useUpdateVehicleDocument(editDoc?.vehicle.id ?? vehicleId);

  useEffect(() => {
    if (!open) {
      setVehicleId("");
      setTipo("CRLV");
      setDataEmissao("");
      setDataVencimento("");
      setArquivoUrl("");
    } else if (editDoc) {
      setVehicleId(editDoc.vehicle.id);
      setTipo(editDoc.tipo as (typeof tipoDocumentoOptions)[number]);
      setDataEmissao(editDoc.dataEmissao ? editDoc.dataEmissao.slice(0, 10) : "");
      setDataVencimento(editDoc.dataVencimento ? editDoc.dataVencimento.slice(0, 10) : "");
      setArquivoUrl(editDoc.arquivoUrl || "");
    }
  }, [open, editDoc]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          typeof body?.error === "string" ? body.error : "Erro ao enviar arquivo"
        );
      }
      setArquivoUrl(body.url);
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Erro ao enviar arquivo");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    if (!vehicleId) {
      toast.error("Selecione o veículo");
      return;
    }
    try {
      if (editDoc) {
        await updateDoc.mutateAsync({ id: editDoc.id, data: { vehicleId, tipo, dataEmissao, dataVencimento, arquivoUrl } });
        toast.success("Documento atualizado");
      } else {
        await createDoc.mutateAsync({ vehicleId, tipo, dataEmissao, dataVencimento, arquivoUrl });
        toast.success("Documento lançado com sucesso");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar documento");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editDoc ? "Editar documento" : "Lançar documento"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Veículo *</Label>
            <VehicleSelect value={vehicleId} onChange={setVehicleId} className="w-full" />
          </div>
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as typeof tipo)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tipoDocumentoOptions.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Emissão</Label>
              <Input type="date" value={dataEmissao} onChange={(e) => setDataEmissao(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Vencimento</Label>
              <Input type="date" value={dataVencimento} onChange={(e) => setDataVencimento(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Arquivo</Label>
            <Input type="file" onChange={handleFileChange} disabled={uploading} />
          </div>
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={createDoc.isPending || updateDoc.isPending || uploading}
          >
            <Upload className="mr-2 h-4 w-4" />
            {editDoc ? "Salvar alterações" : "Lançar documento"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function VehicleThumb({
  vehicle,
  className,
}: {
  vehicle: VehicleDocumentWithVehicle["vehicle"];
  className?: string;
}) {
  const [fotoError, setFotoError] = useState(false);
  if (vehicle.fotoUrl && !fotoError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={vehicle.fotoUrl}
        alt={vehicle.placa}
        onError={() => setFotoError(true)}
        className={cn("shrink-0 rounded-lg border bg-muted object-contain", className)}
      />
    );
  }
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg border bg-muted text-muted-foreground",
        className
      )}
    >
      <FileText className="h-5 w-5" />
    </div>
  );
}

function DocumentCard({
  doc,
  onView,
  onEdit,
  onDelete,
}: {
  doc: VehicleDocumentWithVehicle;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const status = getDocStatus(doc);
  return (
    <Card className="flex flex-col overflow-hidden transition-shadow duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <VehicleThumb vehicle={doc.vehicle} className="h-10 w-12" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{doc.tipo}</p>
              <p className="truncate text-xs text-muted-foreground">
                {doc.vehicle.placa} • {doc.vehicle.marca} {doc.vehicle.modelo}
              </p>
            </div>
          </div>
          <Badge variant={status.variant} className="shrink-0 whitespace-nowrap">
            {status.label}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-muted-foreground">Emissão</p>
            <p className="font-semibold">{doc.dataEmissao ? formatDateBR(doc.dataEmissao) : "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Vencimento</p>
            <p className="font-semibold">{doc.dataVencimento ? formatDateBR(doc.dataVencimento) : "—"}</p>
          </div>
        </div>
      </CardContent>

      <div className="flex flex-wrap items-center justify-end gap-1 border-t p-3 pt-2">
        {doc.arquivoUrl && (
          <Button
            variant="ghost"
            size="sm"
            title="Visualizar"
            className="text-sky-600 hover:bg-sky-50 hover:text-sky-700 dark:hover:bg-sky-500/10"
            onClick={onView}
          >
            <Eye className="mr-1 h-4 w-4" /> Visualizar
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          title="Editar"
          className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-500/10"
          onClick={onEdit}
        >
          <Pencil className="mr-1 h-4 w-4" /> Editar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          title="Excluir"
          className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-500/10"
          onClick={onDelete}
        >
          <Trash2 className="mr-1 h-4 w-4" /> Excluir
        </Button>
      </div>
    </Card>
  );
}

const tipoOrdem = ["CRLV", "IPVA", "Seguro", "Licenciamento", "Outro"] as const;

function VehicleDocsCard({
  vehicle,
  docs,
  onOpen,
}: {
  vehicle: VehicleDocumentWithVehicle["vehicle"];
  docs: VehicleDocumentWithVehicle[];
  onOpen: () => void;
}) {
  const ativos = docs.filter((d) => !d.arquivado);
  const arquivados = docs.length - ativos.length;
  const vencidos = ativos.filter((d) => getDocStatus(d).label === "Vencido").length;
  const vencendo = ativos.filter((d) => getDocStatus(d).label === "Vencendo").length;

  return (
    <button type="button" onClick={onOpen} className="text-left">
      <Card className="flex h-full flex-col overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
        <CardContent className="flex flex-1 flex-col gap-3">
          <div className="flex items-center gap-3">
            <VehicleThumb vehicle={vehicle} className="h-12 w-14" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{vehicle.placa}</p>
              <p className="truncate text-xs text-muted-foreground">
                {vehicle.marca} {vehicle.modelo}
                {vehicle.cor ? ` • ${vehicle.cor}` : ""}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-700 dark:bg-sky-500/15 dark:text-sky-400">
              {ativos.length} documento(s)
            </span>
            {vencidos > 0 && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700 dark:bg-red-500/15 dark:text-red-400">
                {vencidos} vencido(s)
              </span>
            )}
            {vencendo > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                {vencendo} vencendo
              </span>
            )}
            {arquivados > 0 && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-500/15 dark:text-slate-400">
                {arquivados} arquivado(s)
              </span>
            )}
          </div>
          <p className="mt-auto text-xs text-sky-600">Clique para abrir os documentos →</p>
        </CardContent>
      </Card>
    </button>
  );
}

function VehicleDocsDialog({
  vehicle,
  docs,
  open,
  onOpenChange,
  onView,
  onEdit,
  onDelete,
  onArchive,
}: {
  vehicle: VehicleDocumentWithVehicle["vehicle"] | null;
  docs: VehicleDocumentWithVehicle[];
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onView: (d: VehicleDocumentWithVehicle) => void;
  onEdit: (d: VehicleDocumentWithVehicle) => void;
  onDelete: (d: VehicleDocumentWithVehicle) => void;
  onArchive: (d: VehicleDocumentWithVehicle) => void;
}) {
  const [tab, setTab] = useState<string>("CRLV");

  useEffect(() => {
    if (open) {
      // Abre na primeira aba que tiver documento ativo.
      const ativos = docs.filter((d) => !d.arquivado);
      const primeiro = tipoOrdem.find((t) => ativos.some((d) => d.tipo === t));
      setTab(primeiro ?? "CRLV");
    }
  }, [open, docs]);

  if (!vehicle) return null;

  const arquivados = docs.filter((d) => d.arquivado);

  function DocRow({ doc }: { doc: VehicleDocumentWithVehicle }) {
    const status = getDocStatus(doc);
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-lg border p-3 text-sm">
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 font-medium">
            {doc.tipo}
            {doc.arquivado ? (
              <Badge variant="secondary">Arquivado</Badge>
            ) : (
              <Badge variant={status.variant}>{status.label}</Badge>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            Emissão: {doc.dataEmissao ? formatDateBR(doc.dataEmissao) : "—"} • Vencimento:{" "}
            {doc.dataVencimento ? formatDateBR(doc.dataVencimento) : "—"}
            {doc.versoes && doc.versoes.length > 0 && ` • ${doc.versoes.length} versão(ões) antiga(s)`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {doc.arquivoUrl && (
            <Button
              variant="ghost"
              size="icon"
              title="Visualizar / imprimir"
              className="text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-500/10"
              onClick={() => onView(doc)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {!doc.arquivado && (
            <Button
              variant="ghost"
              size="icon"
              title="Editar"
              className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
              onClick={() => onEdit(doc)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            title={doc.arquivado ? "Restaurar (desarquivar)" : "Arquivar"}
            className={cn(
              doc.arquivado
                ? "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                : "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10"
            )}
            onClick={() => onArchive(doc)}
          >
            {doc.arquivado ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Excluir"
            className="text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
            onClick={() => onDelete(doc)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <VehicleThumb vehicle={vehicle} className="h-10 w-12" />
            <span>
              Documentos — {vehicle.placa}
              <span className="block text-xs font-normal text-muted-foreground">
                {vehicle.marca} {vehicle.modelo}
                {vehicle.cor ? ` • ${vehicle.cor}` : ""}
              </span>
            </span>
          </DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex w-full flex-wrap">
            {tipoOrdem.map((t) => {
              const count = docs.filter((d) => d.tipo === t && !d.arquivado).length;
              return (
                <TabsTrigger key={t} value={t} className="gap-1.5">
                  {t}
                  {count > 0 && (
                    <span className="rounded-full bg-muted px-1.5 text-[10px] font-bold">{count}</span>
                  )}
                </TabsTrigger>
              );
            })}
            <TabsTrigger value="arquivados" className="gap-1.5">
              <Archive className="h-3.5 w-3.5" /> Arquivados
              {arquivados.length > 0 && (
                <span className="rounded-full bg-muted px-1.5 text-[10px] font-bold">
                  {arquivados.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {tipoOrdem.map((t) => {
            const docsDoTipo = docs.filter((d) => d.tipo === t && !d.arquivado);
            return (
              <TabsContent key={t} value={t} className="space-y-2 pt-3">
                {docsDoTipo.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Nenhum documento de {t} ativo para este veículo.
                  </p>
                ) : (
                  docsDoTipo.map((d) => <DocRow key={d.id} doc={d} />)
                )}
              </TabsContent>
            );
          })}
          <TabsContent value="arquivados" className="space-y-2 pt-3">
            {arquivados.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhum documento arquivado. Ao receber um documento novo (ex.: CRLV do ano),
                arquive o antigo — ele fica aqui para consulta e reimpressão.
              </p>
            ) : (
              arquivados.map((d) => <DocRow key={d.id} doc={d} />)
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default function DocumentosPage() {
  const { data: vehicles = [] } = useVehicles();
  const { data: allDocs = [], isLoading } = useAllVehicleDocuments();
  const [vehicleId, setVehicleId] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [newDocOpen, setNewDocOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<VehicleDocumentWithVehicle | null>(null);
  const [previewingDoc, setPreviewingDoc] = useState<VehicleDocumentWithVehicle | null>(null);
  const [pendingDelete, setPendingDelete] = useState<VehicleDocumentWithVehicle | null>(null);
  const [openVehicleId, setOpenVehicleId] = useState<string | null>(null);
  const [pendingArchive, setPendingArchive] = useState<VehicleDocumentWithVehicle | null>(null);
  const deleteDoc = useDeleteVehicleDocument(pendingDelete?.vehicle.id ?? "");
  const updateDocArchive = useUpdateVehicleDocument(pendingArchive?.vehicle.id ?? "");

  useEffect(() => {
    const stored = window.localStorage.getItem(VIEW_MODE_KEY);
    if (stored === "grid" || stored === "list") setViewMode(stored);
  }, []);

  function handleViewModeChange(mode: ViewMode) {
    setViewMode(mode);
    window.localStorage.setItem(VIEW_MODE_KEY, mode);
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    try {
      await deleteDoc.mutateAsync(pendingDelete.id);
      toast.success("Documento excluído");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir documento");
    } finally {
      setPendingDelete(null);
    }
  }

  const filtered = !vehicleId ? allDocs : allDocs.filter((d) => d.vehicle.id === vehicleId);
  const filteredAtivos = filtered.filter((d) => !d.arquivado);

  // Agrupa documentos por veículo para o modo grade (um card por veículo).
  const porVeiculo = new Map<string, { vehicle: VehicleDocumentWithVehicle["vehicle"]; docs: VehicleDocumentWithVehicle[] }>();
  for (const d of filtered) {
    const g = porVeiculo.get(d.vehicle.id);
    if (g) g.docs.push(d);
    else porVeiculo.set(d.vehicle.id, { vehicle: d.vehicle, docs: [d] });
  }
  const grupos = Array.from(porVeiculo.values());
  const veiculoAberto = openVehicleId ? porVeiculo.get(openVehicleId) : null;

  async function handleConfirmArchive() {
    if (!pendingArchive) return;
    const d = pendingArchive;
    try {
      await updateDocArchive.mutateAsync({
        id: d.id,
        data: {
          vehicleId: d.vehicle.id,
          tipo: d.tipo as never,
          dataEmissao: d.dataEmissao ? d.dataEmissao.slice(0, 10) : "",
          dataVencimento: d.dataVencimento ? d.dataVencimento.slice(0, 10) : "",
          arquivoUrl: d.arquivoUrl || "",
          arquivado: !d.arquivado,
        },
      });
      toast.success(d.arquivado ? "Documento restaurado" : "Documento arquivado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao arquivar documento");
    } finally {
      setPendingArchive(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documentos</h1>
          <p className="text-sm text-muted-foreground">
            Documentos dos veículos, com alertas de vencimento.
          </p>
        </div>
        <Button onClick={() => setNewDocOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Lançar documento
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-2">
          <VehicleSelect
            value={vehicleId}
            onChange={setVehicleId}
            placeholder="Todos os veículos"
            allowEmpty
            emptyLabel="Todos os veículos"
            className="sm:w-72"
          />
          <div className="ml-auto flex items-center gap-1 rounded-lg border p-1">
            <Button
              type="button"
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => handleViewModeChange("grid")}
              title="Visualização em grade"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => handleViewModeChange("list")}
              title="Visualização em lista"
            >
              <ListIcon className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <PackageOpen className="h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {vehicles.length === 0
                ? "Nenhum veículo cadastrado"
                : "Nenhum documento lançado ainda"}
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {grupos.map((g) => (
            <VehicleDocsCard
              key={g.vehicle.id}
              vehicle={g.vehicle}
              docs={g.docs}
              onOpen={() => setOpenVehicleId(g.vehicle.id)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-hidden rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead>Placa</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Emissão</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAtivos.map((doc) => {
                    const status = getDocStatus(doc);
                    return (
                      <TableRow key={doc.id} className="transition-colors odd:bg-muted/20 hover:bg-muted/40">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <VehicleThumb vehicle={doc.vehicle} className="h-9 w-11" />
                            <div className="min-w-0">
                              <p>{doc.vehicle.placa}</p>
                              <p className="truncate text-xs font-normal text-muted-foreground">
                                {doc.vehicle.marca} {doc.vehicle.modelo}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{doc.tipo}</TableCell>
                        <TableCell>{doc.dataEmissao ? formatDateBR(doc.dataEmissao) : "—"}</TableCell>
                        <TableCell>{doc.dataVencimento ? formatDateBR(doc.dataVencimento) : "—"}</TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {doc.arquivoUrl && (
                              <button
                                type="button"
                                title="Visualizar"
                                onClick={() => setPreviewingDoc(doc)}
                                className={cn(
                                  "rounded-md p-1.5 text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-500/10"
                                )}
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Editar"
                              className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-500/10"
                              onClick={() => setEditingDoc(doc)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Excluir"
                              className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-500/10"
                              onClick={() => setPendingDelete(doc)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <NovoDocumentoDialog open={newDocOpen} onOpenChange={setNewDocOpen} />
      <NovoDocumentoDialog
        open={!!editingDoc}
        onOpenChange={(o) => !o && setEditingDoc(null)}
        editDoc={editingDoc}
      />
      <DocumentPreviewDialog
        doc={previewingDoc}
        open={!!previewingDoc}
        onOpenChange={(o) => !o && setPreviewingDoc(null)}
      />
      <VehicleDocsDialog
        vehicle={veiculoAberto?.vehicle ?? null}
        docs={veiculoAberto?.docs ?? []}
        open={!!veiculoAberto}
        onOpenChange={(o) => !o && setOpenVehicleId(null)}
        onView={(d) => setPreviewingDoc(d)}
        onEdit={(d) => setEditingDoc(d)}
        onDelete={(d) => setPendingDelete(d)}
        onArchive={(d) => setPendingArchive(d)}
      />
      <ConfirmDialog
        open={!!pendingArchive}
        onOpenChange={(o) => !o && setPendingArchive(null)}
        title={
          pendingArchive?.arquivado
            ? "Restaurar este documento arquivado?"
            : "Arquivar este documento?"
        }
        description={
          pendingArchive?.arquivado
            ? "Ele volta a aparecer como documento ativo do veículo."
            : "Documentos arquivados saem dos alertas de vencimento, mas continuam disponíveis para consulta e reimpressão na aba Arquivados."
        }
        confirmLabel={pendingArchive?.arquivado ? "Restaurar" : "Arquivar"}
        onConfirm={handleConfirmArchive}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title="Confirma a exclusão deste documento?"
        confirmLabel="Excluir"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
