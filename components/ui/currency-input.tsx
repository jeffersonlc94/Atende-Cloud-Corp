"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { formatCurrencyBRL } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Monetary input with live Brazilian currency masking (R$ 1.250,75).
 *
 * Digits are treated as cents, entered right-to-left (the standard currency
 * mask pattern): typing "150000" produces "R$ 1.500,00". The value handed
 * back via onChange/onValueChange is always a plain `number` (e.g. 1500)
 * suitable for saving as-is, or `undefined` when the field is empty.
 */
export interface CurrencyInputProps
  extends Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> {
  value?: number | null;
  onChange?: (value: number | undefined) => void;
  onValueChange?: (value: number | undefined) => void;
}

function formatCents(cents: number): string {
  return formatCurrencyBRL(cents / 100);
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, onValueChange, className, ...props }, ref) => {
    const [display, setDisplay] = React.useState<string>(() =>
      value === null || value === undefined ? "" : formatCurrencyBRL(value)
    );
    const isFocused = React.useRef(false);

    React.useEffect(() => {
      if (isFocused.current) return;
      setDisplay(value === null || value === undefined ? "" : formatCurrencyBRL(value));
    }, [value]);

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode="decimal"
        className={cn(className)}
        value={display}
        onFocus={(e) => {
          isFocused.current = true;
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          isFocused.current = false;
          const digits = display.replace(/\D/g, "");
          const num = digits === "" ? undefined : Number(digits) / 100;
          setDisplay(num === undefined ? "" : formatCurrencyBRL(num));
          props.onBlur?.(e);
        }}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "");
          if (digits === "") {
            setDisplay("");
            onChange?.(undefined);
            onValueChange?.(undefined);
            return;
          }
          const cents = Number(digits);
          const num = cents / 100;
          setDisplay(formatCents(cents));
          onChange?.(num);
          onValueChange?.(num);
        }}
      />
    );
  }
);
CurrencyInput.displayName = "CurrencyInput";
