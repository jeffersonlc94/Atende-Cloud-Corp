"use client";

import { useState } from "react";
import { Car, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useVehicles, type VehicleRecord } from "@/hooks/use-vehicles";

/** Formata um veículo como "PLACA - MARCA MODELO - COR", nunca exibindo o id. */
export function formatVehicleLabel(
  vehicle: (Pick<VehicleRecord, "placa" | "marca" | "modelo"> & { cor?: string | null }) | null | undefined
) {
  if (!vehicle) return "";
  const cor = vehicle.cor ? ` - ${vehicle.cor}` : "";
  return `${vehicle.placa} - ${vehicle.marca} ${vehicle.modelo}${cor}`.trim().toUpperCase();
}

export function VehicleSelect({
  value,
  onChange,
  placeholder = "Selecione o veículo",
  allowEmpty,
  emptyLabel = "Nenhum veículo",
  className,
}: {
  value: string;
  onChange: (vehicleId: string) => void;
  placeholder?: string;
  /** Permite uma opção vazia (ex: campo opcional de veículo). */
  allowEmpty?: boolean;
  emptyLabel?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const { data: vehicles = [] } = useVehicles();
  const selected = vehicles.find((v) => v.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between font-normal", className)}
          >
            <span className="flex min-w-0 items-center gap-2 truncate">
              <Car className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">
                {selected ? formatVehicleLabel(selected) : placeholder}
              </span>
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        }
      />
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Buscar por placa, marca, modelo ou cor..." />
          <CommandList>
            <CommandEmpty>Nenhum veículo encontrado.</CommandEmpty>
            <CommandGroup>
              {allowEmpty && (
                <CommandItem
                  value="__none__"
                  onSelect={() => {
                    onChange("");
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", !value ? "opacity-100" : "opacity-0")} />
                  {emptyLabel}
                </CommandItem>
              )}
              {vehicles.map((v) => (
                <CommandItem
                  key={v.id}
                  value={`${v.placa} ${v.marca} ${v.modelo} ${v.cor ?? ""}`}
                  onSelect={() => {
                    onChange(v.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn("mr-2 h-4 w-4", value === v.id ? "opacity-100" : "opacity-0")}
                  />
                  <Car className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                  {formatVehicleLabel(v)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
