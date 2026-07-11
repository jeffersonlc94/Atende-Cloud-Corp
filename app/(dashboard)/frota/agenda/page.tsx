"use client";

import { useMemo, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VehicleSelect } from "@/components/frota/vehicle-select";
import { cn } from "@/lib/utils";
import {
  Trash2,
  Pencil,
  X,
  Wrench,
  Droplet,
  FileText,
  ClipboardList,
  CalendarDays,
  CalendarClock,
  CalendarCheck2,
  type LucideIcon,
} from "lucide-react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

const tipoEventoLabels: Record<string, string> = {
  Manutencao: "Manutenção",
  TrocaOleo: "Troca de óleo",
  Documento: "Documento",
  Checklist: "Checklist",
  Outro: "Outro",
};

const tipoEventoIcons: Record<string, LucideIcon> = {
  Manutencao: Wrench,
  TrocaOleo: Droplet,
  Documento: FileText,
  Checklist: ClipboardList,
  Outro: CalendarDays,
};

const tipoEventoColors: Record<string, string> = {
  Manutencao: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  TrocaOleo: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
  Documento: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400",
  Checklist: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  Outro: "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-400",
};

const mesesAbrev = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

function daysUntil(dateStr: string) {
  const hoje = new Date();
  hoje.setUTCHours(0, 0, 0, 0);
  const data = new Date(dateStr);
  data.setUTCHours(0, 0, 0, 0);
  return Math.round((data.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

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

  const { hojeCount, semanaCount } = useMemo(() => {
    let hoje = 0;
    let semana = 0;
    for (const e of events) {
      const dias = daysUntil(e.data);
      if (dias === 0) hoje++;
      if (dias >= 0 && dias <= 7) semana++;
    }
    return { hojeCount: hoje, semanaCount: semana };
  }, [events]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Agenda</h1>
        <p className="text-sm text-muted-foreground">Próximos eventos relacionados à frota</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-l-4 border-l-sky-400 dark:border-l-sky-600">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total de eventos</p>
              <p className="text-xl font-bold">{events.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-400 dark:border-l-amber-600">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
              <CalendarClock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Hoje</p>
              <p className="text-xl font-bold">{hojeCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-400 dark:border-l-emerald-600">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
              <CalendarCheck2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Próximos 7 dias</p>
              <p className="text-xl font-bold">{semanaCount}</p>
            </div>
          </CardContent>
        </Card>
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
                  <SelectValue>
                    {(value: string) => {
                      const Icon = tipoEventoIcons[value] ?? CalendarDays;
                      return (
                        <span className="flex items-center gap-1.5">
                          <Icon className="h-3.5 w-3.5" />
                          {tipoEventoLabels[value] ?? value}
                        </span>
                      );
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {tipoEventoAgendaOptions.map((t) => {
                    const Icon = tipoEventoIcons[t];
                    return (
                      <SelectItem key={t} value={t}>
                        <span className="flex items-center gap-1.5">
                          <Icon className="h-3.5 w-3.5" />
                          {tipoEventoLabels[t]}
                        </span>
                      </SelectItem>
                    );
                  })}
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
        <CardContent className="space-y-2 pb-2">
          {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
          {!isLoading && events.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum evento futuro cadastrado.</p>
          )}
          {events.map((e) => {
            const Icon = tipoEventoIcons[e.tipo] ?? CalendarDays;
            const dias = daysUntil(e.data);
            const date = new Date(e.data);
            const day = date.getUTCDate().toString().padStart(2, "0");
            const monthYear = `${mesesAbrev[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
            return (
              <div
                key={e.id}
                className={cn(
                  "flex flex-wrap items-center gap-3 rounded-xl border p-3 text-sm shadow-sm transition-colors",
                  dias === 0 && "border-amber-300 bg-amber-50/50 dark:border-amber-700 dark:bg-amber-500/5"
                )}
              >
                <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-muted">
                  <span className="text-base font-bold leading-none">{day}</span>
                  <span className="text-[9px] font-medium text-muted-foreground">{monthYear}</span>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-medium leading-tight">
                    {e.titulo}
                    {dias === 0 && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                        Hoje
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {e.vehicle ? `${e.vehicle.placa} • ` : ""}
                    {e.descricao || ""}
                  </p>
                </div>

                <span
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                    tipoEventoColors[e.tipo] ?? tipoEventoColors.Outro
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tipoEventoLabels[e.tipo] ?? e.tipo}
                </span>

                <div className="flex shrink-0 items-center gap-1">
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
            );
          })}
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
