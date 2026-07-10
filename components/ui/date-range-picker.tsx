"use client";

import * as React from "react";
import type { DateRange } from "react-day-picker";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

function formatDate(date: Date) {
  return date.toLocaleDateString("pt-BR");
}

export function DateRangePicker({
  value,
  onChange,
  className,
}: {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [internal, setInternal] = React.useState<DateRange | undefined>(
    value ?? {
      from: new Date(new Date().setDate(new Date().getDate() - 8)),
      to: new Date(),
    }
  );

  const range = value ?? internal;

  function handleSelect(next: DateRange | undefined) {
    setInternal(next);
    onChange?.(next);
  }

  const label =
    range?.from && range?.to
      ? `${formatDate(range.from)} - ${formatDate(range.to)}`
      : range?.from
      ? formatDate(range.from)
      : "Selecione o período";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className={cn("justify-start gap-2 text-left font-normal", className)}
          >
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            {label}
          </Button>
        }
      />
      <PopoverContent align="end" className="w-auto p-0">
        <Calendar
          mode="range"
          defaultMonth={range?.from}
          selected={range}
          onSelect={handleSelect}
          numberOfMonths={2}
          locale={undefined}
        />
      </PopoverContent>
    </Popover>
  );
}
