"use client";

import type { LucideIcon } from "lucide-react";
import {
  CircleDot,
  Disc3,
  Lightbulb,
  Droplets,
  Fuel,
  Cog,
  Wrench,
  Battery,
  FileText,
  ShieldCheck,
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

// Óleo usa "Fuel" pois a biblioteca lucide-react não possui um ícone "OilCan".
export const checklistItemIcons: Record<(typeof checklistItemTipoOptions)[number], LucideIcon> = {
  Pneus: CircleDot,
  Freios: Disc3,
  Luzes: Lightbulb,
  Oleo: Fuel,
  Agua: Droplets,
  Motor: Cog,
  Suspensao: Wrench,
  Bateria: Battery,
  Documentacao: FileText,
  EquipObrigatorio: ShieldCheck,
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

export const statusBorderClasses: Record<string, string> = {
  OK: "border-emerald-400 dark:border-emerald-600",
  Atencao: "border-amber-400 dark:border-amber-600",
  NecessitaManutencao: "border-red-400 dark:border-red-600",
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
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl border-2 bg-card p-3 text-center shadow-sm transition-colors",
        statusBorderClasses[status]
      )}
    >
      <Icon className="text-primary" style={{ height: 22, width: 22 }} />
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
