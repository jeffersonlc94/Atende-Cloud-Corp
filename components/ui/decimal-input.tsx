"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";

export interface DecimalInputProps
  extends Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> {
  value?: number | null;
  onValueChange?: (value: number | undefined) => void;
  maximum?: number;
}

function formatDecimal(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "";
  return value.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

export const DecimalInput = React.forwardRef<HTMLInputElement, DecimalInputProps>(
  ({ value, onValueChange, maximum, onBlur, onFocus, ...props }, ref) => {
    const [display, setDisplay] = React.useState(() => formatDecimal(value));
    const focused = React.useRef(false);

    React.useEffect(() => {
      if (!focused.current) setDisplay(formatDecimal(value));
    }, [value]);

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode="decimal"
        value={display}
        onFocus={(event) => {
          focused.current = true;
          onFocus?.(event);
        }}
        onBlur={(event) => {
          focused.current = false;
          const parsed = Number(display.replace(",", "."));
          const normalized = display.trim() === "" || !Number.isFinite(parsed)
            ? undefined
            : maximum !== undefined
              ? Math.min(maximum, Math.max(0, parsed))
              : Math.max(0, parsed);
          setDisplay(formatDecimal(normalized));
          onValueChange?.(normalized);
          onBlur?.(event);
        }}
        onChange={(event) => {
          const next = event.target.value;
          if (!/^\d*(?:[.,]\d{0,2})?$/.test(next)) return;
          setDisplay(next);
          if (next === "" || next.endsWith(",") || next.endsWith(".")) {
            onValueChange?.(next === "" ? undefined : Number(next.slice(0, -1)) || 0);
            return;
          }
          const parsed = Number(next.replace(",", "."));
          if (Number.isFinite(parsed) && (maximum === undefined || parsed <= maximum)) {
            onValueChange?.(parsed);
          }
        }}
      />
    );
  }
);
DecimalInput.displayName = "DecimalInput";
