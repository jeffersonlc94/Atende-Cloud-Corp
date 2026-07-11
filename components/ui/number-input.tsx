"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { formatKM } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Integer input with live Brazilian thousands-separator masking (e.g. 1.000.000).
 * Used for KM / quilometragem fields and other plain-integer fields.
 *
 * The component keeps the displayed string formatted at all times; the value
 * handed back via onChange/onValueChange is always a plain `number`
 * (or `undefined` when the field is empty), suitable for saving as-is.
 */
export interface NumberInputProps
  extends Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> {
  value?: number | null;
  onChange?: (value: number | undefined) => void;
  onValueChange?: (value: number | undefined) => void;
}

function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, "");
}

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ value, onChange, onValueChange, className, ...props }, ref) => {
    const [display, setDisplay] = React.useState<string>(() =>
      value === null || value === undefined ? "" : formatKM(value)
    );
    const isFocused = React.useRef(false);

    React.useEffect(() => {
      if (isFocused.current) return;
      setDisplay(value === null || value === undefined ? "" : formatKM(value));
    }, [value]);

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode="numeric"
        className={cn(className)}
        value={display}
        onFocus={(e) => {
          isFocused.current = true;
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          isFocused.current = false;
          const digits = digitsOnly(display);
          const num = digits === "" ? undefined : Number(digits);
          setDisplay(num === undefined ? "" : formatKM(num));
          props.onBlur?.(e);
        }}
        onChange={(e) => {
          const digits = digitsOnly(e.target.value);
          const num = digits === "" ? undefined : Number(digits);
          setDisplay(digits === "" ? "" : formatKM(num));
          onChange?.(num);
          onValueChange?.(num);
        }}
      />
    );
  }
);
NumberInput.displayName = "NumberInput";

export { NumberInput as KmInput };
