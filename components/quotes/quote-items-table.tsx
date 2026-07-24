"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Controller, useFieldArray, type Control, type UseFormRegister } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Camera, Loader2, Plus, Trash2, X } from "lucide-react";
import { formatCurrencyBRL } from "@/lib/format";
import { computeItemTotal } from "@/lib/quote-calc";
import type { QuoteFormValues } from "@/lib/validations";
import { FotoThumb } from "@/components/shared/foto-thumb";

function ItemFotoCell({
  control,
  index,
}: {
  control: Control<QuoteFormValues>;
  index: number;
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <Controller
      control={control}
      name={`itens.${index}.fotoUrl`}
      render={({ field }) => {
        async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          setUploading(true);
          try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetch("/api/upload", { method: "POST", body: formData });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(body?.error || "Erro ao enviar foto");
            field.onChange(body.url);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Erro ao enviar foto");
          } finally {
            setUploading(false);
          }
        }

        return (
          <div className="flex items-center justify-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
            {field.value ? (
              <div className="relative">
                <FotoThumb url={field.value as string} alt="Foto do item" className="h-10 w-10" />
                <button
                  type="button"
                  onClick={() => field.onChange(undefined)}
                  className="absolute -right-1.5 -top-1.5 rounded-full bg-destructive p-0.5 text-destructive-foreground"
                  title="Remover foto"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                title="Adicionar foto (opcional)"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        );
      }}
    />
  );
}

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
      tipoItem: "Produto",
      descricao: "",
      fotoUrl: undefined,
      quantidade: 1,
      valorUnitario: undefined,
      descontoTipo: undefined,
      descontoValor: undefined,
    });
  }

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead className="w-16">Foto</TableHead>
              <TableHead className="w-32">Tipo</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-28">Qtd.</TableHead>
              <TableHead className="w-36">Valor Unit.</TableHead>
              <TableHead className="w-44">Desconto</TableHead>
              <TableHead className="w-36">Total</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field, index) => {
              const item = watchItems?.[index];
              const totalLinha = computeItemTotal(
                Number(item?.quantidade) || 0,
                Number(item?.valorUnitario) || 0,
                item?.descontoTipo,
                Number(item?.descontoValor) || 0
              );
              const descontoTipoAtual = item?.descontoTipo ?? "Valor";
              return (
                <TableRow key={field.id}>
                  <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                  <TableCell>
                    <ItemFotoCell control={control} index={index} />
                  </TableCell>
                  <TableCell>
                    <Controller
                      control={control}
                      name={`itens.${index}.tipoItem`}
                      render={({ field }) => (
                        <Select
                          value={field.value ?? "Produto"}
                          onValueChange={(v) => field.onChange(v)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Produto">Produto</SelectItem>
                            <SelectItem value="Servico">Serviço</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </TableCell>
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
                    <Controller
                      control={control}
                      name={`itens.${index}.valorUnitario`}
                      render={({ field }) => (
                        <CurrencyInput
                          value={field.value as number | undefined}
                          onValueChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Controller
                        control={control}
                        name={`itens.${index}.descontoTipo`}
                        render={({ field }) => (
                          <Select
                            value={field.value ?? "Valor"}
                            onValueChange={(v) => field.onChange(v)}
                          >
                            <SelectTrigger className="w-[4.5rem] shrink-0">
                              <SelectValue>
                                {(value: string) => (value === "Percentual" ? "%" : "R$")}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Valor">R$</SelectItem>
                              <SelectItem value="Percentual">%</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                      <Controller
                        control={control}
                        name={`itens.${index}.descontoValor`}
                        render={({ field }) =>
                          descontoTipoAtual === "Percentual" ? (
                            <div className="relative">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                className="pr-6"
                                value={(field.value as number | undefined) ?? ""}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value === "" ? undefined : Number(e.target.value)
                                  )
                                }
                                onBlur={field.onBlur}
                              />
                              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                %
                              </span>
                            </div>
                          ) : (
                            <CurrencyInput
                              value={field.value as number | undefined}
                              onValueChange={field.onChange}
                              onBlur={field.onBlur}
                            />
                          )
                        }
                      />
                    </div>
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
