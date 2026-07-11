"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useVehicles } from "@/hooks/use-vehicles";
import {
  useAllVehicleDocuments,
  useCreateVehicleDocument,
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
  Trash2,
  LayoutGrid,
  List as ListIcon,
  PackageOpen,
  Upload,
} from "lucide-react";
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

function NovoDocumentoDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [vehicleId, setVehicleId] = useState("");
  const [tipo, setTipo] = useState<(typeof tipoDocumentoOptions)[number]>("CRLV");
  const [dataEmissao, setDataEmissao] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");
  const [arquivoUrl, setArquivoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const createDoc = useCreateVehicleDocument(vehicleId);

  useEffect(() => {
    if (!open) {
      setVehicleId("");
      setTipo("CRLV");
      setDataEmissao("");
      setDataVencimento("");
      setArquivoUrl("");
    }
  }, [open]);

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
      setArquivoUrl(url);
    } catch {
      toast.error("Erro ao enviar arquivo");
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
      await createDoc.mutateAsync({ vehicleId, tipo, dataEmissao, dataVencimento, arquivoUrl });
      toast.success("Documento lançado com sucesso");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao lançar documento");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Lançar documento</DialogTitle>
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
          <Button className="w-full" onClick={handleSubmit} disabled={createDoc.isPending || uploading}>
            <Upload className="mr-2 h-4 w-4" />
            Lançar documento
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DocumentCard({ doc, onDelete }: { doc: VehicleDocumentWithVehicle; onDelete: () => void }) {
  const status = getDocStatus(doc);
  return (
    <Card className="flex flex-col overflow-hidden transition-shadow duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{doc.tipo}</p>
              <p className="truncate text-xs text-muted-foreground">
                {doc.vehicle.placa} • {doc.vehicle.marca} {doc.vehicle.modelo}
              </p>
            </div>
          </div>
          <Badge variant={status.variant} className="shrink-0">
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

      <div className="flex items-center justify-end gap-1 border-t p-3 pt-2">
        {doc.arquivoUrl && (
          <a
            href={doc.arquivoUrl}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({
              variant: "ghost",
              size: "sm",
              className: "text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-500/10",
            })}
          >
            Ver arquivo
          </a>
        )}
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

export default function DocumentosPage() {
  const { data: vehicles = [] } = useVehicles();
  const { data: allDocs = [], isLoading } = useAllVehicleDocuments();
  const [vehicleId, setVehicleId] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [newDocOpen, setNewDocOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<VehicleDocumentWithVehicle | null>(null);
  const deleteDoc = useDeleteVehicleDocument(pendingDelete?.vehicle.id ?? "");

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
          {filtered.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} onDelete={() => setPendingDelete(doc)} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto rounded-xl border">
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
                  {filtered.map((doc) => {
                    const status = getDocStatus(doc);
                    return (
                      <TableRow key={doc.id} className="transition-colors odd:bg-muted/20 hover:bg-muted/40">
                        <TableCell className="font-medium">{doc.vehicle.placa}</TableCell>
                        <TableCell>{doc.tipo}</TableCell>
                        <TableCell>{doc.dataEmissao ? formatDateBR(doc.dataEmissao) : "—"}</TableCell>
                        <TableCell>{doc.dataVencimento ? formatDateBR(doc.dataVencimento) : "—"}</TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {doc.arquivoUrl && (
                              <a
                                href={doc.arquivoUrl}
                                target="_blank"
                                rel="noreferrer"
                                title="Ver arquivo"
                                className={cn(
                                  "rounded-md p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10"
                                )}
                              >
                                <FileText className="h-4 w-4" />
                              </a>
                            )}
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
