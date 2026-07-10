"use client";

import { useFieldArray, type Control, type UseFormRegister } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { formatCurrencyBRL } from "@/lib/format";
import type { QuoteFormValues } from "@/lib/validations";

export function QuoteItemsTable({
  control,
  register,
  watchItems,
}: {
  control: Control<QuoteFormValues>;
  register: UseFormRegister<QuoteFormValues>;
  watchItems: QuoteFormValues["itens"];
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "itens",
  });

  function addItem() {
    append({
      ordem: fields.length,
      descricao: "",
      quantidade: 1,
      valorUnitario: undefined,
    });
  }

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-28">Qtd.</TableHead>
              <TableHead className="w-36">Valor Unit.</TableHead>
              <TableHead className="w-36">Total</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field, index) => {
              const item = watchItems?.[index];
              const totalLinha =
                (Number(item?.quantidade) || 0) * (Number(item?.valorUnitario) || 0);
              return (
                <TableRow key={field.id}>
                  <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                  <TableCell>
                    <Input
                      {...register(`itens.${index}.descricao`)}
                      placeholder="Descrição do item"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register(`itens.${index}.quantidade`, { valueAsNumber: true })}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register(`itens.${index}.valorUnitario`, { valueAsNumber: true })}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrencyBRL(totalLinha)}
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                      aria-label="Remover item"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={addItem}>
        <Plus className="mr-1 h-4 w-4" /> Adicionar item
      </Button>
    </div>
  );
}
