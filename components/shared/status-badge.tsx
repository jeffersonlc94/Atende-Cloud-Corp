import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusTone = "critical" | "warning" | "success" | "neutral";

const toneClasses: Record<StatusTone, string> = {
  critical: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-400",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400",
  success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400",
  neutral: "bg-muted text-muted-foreground",
};

export function StatusBadge({
  tone,
  children,
  className,
}: {
  tone: StatusTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Badge className={cn(toneClasses[tone], "hover:opacity-90", className)}>
      {children}
    </Badge>
  );
}
