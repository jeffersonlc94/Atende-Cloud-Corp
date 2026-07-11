"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  useCalendarEvents,
  useCreateCalendarEvent,
  useUpdateCalendarEvent,
  useDeleteCalendarEvent,
} from "@/hooks/use-fleet";
import { tipoEventoAgendaOptions } from "@/lib/validations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VehicleSelect } from "@/components/frota/vehicle-select";
import { formatDateBR } from "@/lib/format";
import { Trash2, Pencil, X } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

export default function AgendaPage() {
  const { data: events = [], isLoading } = useCalendarEvents({ futuras: true });
  const createEvent = useCreateCalendarEvent();
  const updateEvent = useUpdateCalendarEvent();
  const deleteEvent = useDeleteCalendarEvent();
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [confirmAddOpen, setConfirmAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const emptyForm = {
    vehicleId: "",
    titulo: "",
    data: new Date().toISOString().slice(0, 10),
    descricao: "",
    tipo: "Outro" as (typeof tipoEventoAgendaOptions)[number],
  };
  const [form, setForm] = useState(emptyForm);

  function handleEdit(e: (typeof events)[number]) {
    setEditingId(e.id);
    setForm({
      vehicleId: e.vehicleId || "",
      titulo: e.titulo,
      data: e.data.slice(0, 10),
      descricao: e.descricao || "",
      tipo: e.tipo as (typeof tipoEventoAgendaOptions)[number],
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleAdd() {
    if (!form.titulo) {
      toast.error("Informe o título do evento");
      return;
    }
    try {
      if (editingId) {
        await updateEvent.mutateAsync({ id: editingId, data: form });
        toast.success("Evento atualizado");
      } else {
        await createEvent.mutateAsync(form);
        toast.success("Evento adicionado à agenda");
      }
      cancelEdit();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar evento");
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Agenda</h1>
        <p className="text-sm text-muted-foreground">Próximos eventos relacionados à frota</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Editar evento" : "Novo evento"}</CardTitle>
          <CardDescription>
            {editingId
              ? "Atualize os dados do evento selecionado"
              : "Adicione compromissos e lembretes relacionados à frota"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <Label>Título *</Label>
              <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Data</Label>
              <Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as typeof form.tipo })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tipoEventoAgendaOptions.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Veículo (opcional)</Label>
              <VehicleSelect
                value={form.vehicleId}
                onChange={(v) => setForm({ ...form, vehicleId: v })}
                placeholder="Nenhum"
                allowEmpty
                emptyLabel="Nenhum veículo"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Descrição</Label>
            <Textarea rows={2} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                if (!form.titulo) {
                  toast.error("Informe o título do evento");
                  return;
                }
                setConfirmAddOpen(true);
              }}
              disabled={createEvent.isPending || updateEvent.isPending}
            >
              {editingId ? "Salvar alterações" : "Adicionar evento"}
            </Button>
            {editingId && (
              <Button type="button" variant="outline" onClick={cancelEdit}>
                <X className="mr-1 h-4 w-4" /> Cancelar edição
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Próximos eventos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
          {!isLoading && events.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum evento futuro cadastrado.</p>
          )}
          {events.map((e) => (
            <div key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm">
              <div>
                <p className="font-medium">
                  {formatDateBR(e.data)} — {e.titulo}
                </p>
                <p className="text-xs text-muted-foreground">
                  {e.vehicle ? `${e.vehicle.placa} • ` : ""}
                  {e.descricao || ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{e.tipo}</Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Editar"
                  className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-500/10"
                  onClick={() => handleEdit(e)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Excluir"
                  className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-500/10"
                  onClick={() => setPendingDelete(e.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title="Confirma a exclusão deste evento?"
        description="Esta ação não pode ser desfeita."
        variant="destructive"
        confirmLabel="Excluir"
        onConfirm={() => pendingDelete && deleteEvent.mutate(pendingDelete)}
      />
      <ConfirmDialog
        open={confirmAddOpen}
        onOpenChange={setConfirmAddOpen}
        title={editingId ? "Confirma a alteração deste evento?" : "Confirma a inclusão deste evento na agenda?"}
        confirmLabel={editingId ? "Salvar" : "Adicionar"}
        onConfirm={handleAdd}
      />
    </div>
  );
}
