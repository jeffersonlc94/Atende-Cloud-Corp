"use client";

import type { LucideIcon } from "lucide-react";
import {
  Circle,
  Disc,
  Lightbulb,
  Droplet,
  Waves,
  Cog,
  Activity,
  Battery,
  FileText,
  TriangleAlert,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { checklistItemTipoOptions, checklistItemTipoLabels } from "@/lib/validations";
import { cn } from "@/lib/utils";

export const checklistItemIcons: Record<(typeof checklistItemTipoOptions)[number], LucideIcon> = {
  Pneus: Circle,
  Freios: Disc,
  Luzes: Lightbulb,
  Oleo: Droplet,
  Agua: Waves,
  Motor: Cog,
  Suspensao: Activity,
  Bateria: Battery,
  Documentacao: FileText,
  EquipObrigatorio: TriangleAlert,
};

export const checklistItemIconColors: Record<(typeof checklistItemTipoOptions)[number], string> = {
  Pneus: "text-slate-600",
  Freios: "text-sky-600",
  Luzes: "text-yellow-500",
  Oleo: "text-orange-600",
  Agua: "text-blue-500",
  Motor: "text-zinc-600",
  Suspensao: "text-purple-600",
  Bateria: "text-emerald-600",
  Documentacao: "text-indigo-600",
  EquipObrigatorio: "text-amber-600",
};

export const statusLabels: Record<string, string> = {
  OK: "OK",
  Atencao: "Atenção",
  NecessitaManutencao: "Necessita manutenção",
};

export const statusDotClasses: Record<string, string> = {
  OK: "bg-emerald-500",
  Atencao: "bg-amber-500",
  NecessitaManutencao: "bg-red-500",
};

/** Card compacto de item de checklist: ícone + nome + select de status com bolinha colorida. */
export function ChecklistItemStatusCard({
  item,
  status,
  onChange,
  statusOptions,
}: {
  item: (typeof checklistItemTipoOptions)[number];
  status: string;
  onChange: (status: string) => void;
  statusOptions: readonly string[];
}) {
  const Icon = checklistItemIcons[item];

  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border bg-card p-3 text-center shadow-sm">
      <Icon className={cn("h-5 w-5", checklistItemIconColors[item])} />
      <p className="text-xs font-medium leading-tight">{checklistItemTipoLabels[item]}</p>
      <Select value={status} onValueChange={(v) => onChange(v ?? "OK")}>
        <SelectTrigger className="h-8 w-full text-xs">
          <SelectValue>
            <span className="flex items-center gap-1.5">
              <span className={cn("h-2 w-2 shrink-0 rounded-full", statusDotClasses[status])} />
              {statusLabels[status] ?? "OK"}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((s) => (
            <SelectItem key={s} value={s}>
              <span className="flex items-center gap-1.5">
                <span className={cn("h-2 w-2 shrink-0 rounded-full", statusDotClasses[s])} />
                {statusLabels[s]}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
