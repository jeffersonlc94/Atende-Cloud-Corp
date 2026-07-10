"use client";

import { Eye, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ChecklistRecord } from "@/hooks/use-fleet";
import { checklistItemIcons, statusDotClasses, statusLabels } from "@/components/frota/checklist-item-status";
import { checklistItemTipoLabels } from "@/lib/validations";
import { cn } from "@/lib/utils";

const mesesAbrev = [
  "JAN", "FEV", "MAR", "ABR", "MAI", "JUN",
  "JUL", "AGO", "SET", "OUT", "NOV", "DEZ",
];

/** Card de histórico de checklist: badge de data, resumo e ações (ver/excluir). */
export function ChecklistHistoryCard({
  checklist,
  onView,
  onDelete,
}: {
  checklist: ChecklistRecord;
  onView: () => void;
  onDelete: () => void;
}) {
  const date = new Date(checklist.data);
  const day = date.getUTCDate().toString().padStart(2, "0");
  const monthYear = `${mesesAbrev[date.getUTCMonth()]} ${date.getUTCFullYear()}`;

  return (
    <Card className="shadow-sm">
      <CardContent className="flex flex-wrap items-center gap-4 p-4">
        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-muted">
          <span className="text-lg font-bold leading-none">{day}</span>
          <span className="text-[10px] font-medium text-muted-foreground">{monthYear}</span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-medium leading-tight">
            {checklist.km ? `${checklist.km.toLocaleString("pt-BR")} km` : "KM não informado"} — Checklist {checklist.tipo}
          </p>
          <p className="text-xs text-muted-foreground">
            Por: {checklist.user?.name ?? "—"} {checklist.hora ? `• ${checklist.hora}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
            {checklist.itens.map((i) => {
              const Icon = checklistItemIcons[i.item as keyof typeof checklistItemIcons];
              return (
                <span key={i.id} className="flex items-center gap-1 text-xs text-muted-foreground">
                  {Icon && <Icon className="h-3.5 w-3.5" />}
                  {checklistItemTipoLabels[i.item as keyof typeof checklistItemTipoLabels] ?? i.item}:
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <span className={cn("h-1.5 w-1.5 rounded-full", statusDotClasses[i.status])} />
                    {statusLabels[i.status] ?? i.status}
                  </span>
                </span>
              );
            })}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="icon" title="Visualizar" onClick={onView}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" title="Excluir" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
