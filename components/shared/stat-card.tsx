import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type StatCardAccent =
  | "default"
  | "warning"
  | "critical"
  | "info"
  | "purple"
  | "teal";

const accentClasses: Record<StatCardAccent, string> = {
  default: "bg-primary/10 text-primary",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  critical: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
  info: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  purple: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
  teal: "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400",
};

const accentBorderClasses: Record<StatCardAccent, string> = {
  default: "border-l-4 border-l-emerald-500",
  warning: "border-l-4 border-l-amber-500",
  critical: "border-l-4 border-l-red-500",
  info: "border-l-4 border-l-blue-500",
  purple: "border-l-4 border-l-violet-500",
  teal: "border-l-4 border-l-teal-500",
};

const accentTextClasses: Record<StatCardAccent, string> = {
  default: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  critical: "text-red-600 dark:text-red-400",
  info: "text-blue-600 dark:text-blue-400",
  purple: "text-violet-600 dark:text-violet-400",
  teal: "text-teal-600 dark:text-teal-400",
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = "default",
  accentBorder = false,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon: LucideIcon;
  accent?: StatCardAccent;
  accentBorder?: boolean;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        accentBorder && accentBorderClasses[accent],
        className
      )}
    >
      <CardContent className="flex items-center gap-3 pt-5">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            accentClasses[accent]
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p
            className={cn(
              "line-clamp-2 text-xs font-medium leading-tight",
              accentBorder ? accentTextClasses[accent] : "text-muted-foreground"
            )}
          >
            {label}
          </p>
          <p className="truncate text-xl font-bold">{value}</p>
          {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
