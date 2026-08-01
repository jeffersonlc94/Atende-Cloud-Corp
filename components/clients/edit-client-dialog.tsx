"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useUpdateClient } from "@/hooks/use-clients";

export function EditClientDialog({
  open,
  onOpenChange,
  clientId,
  clientNome,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientNome: string;
  onSaved: (nome: string) => void;
}) {
  const [nome, setNome] = useState(clientNome);
  const updateClient = useUpdateClient();

  useEffect(() => {
    if (open) setNome(clientNome);
  }, [open, clientNome]);

  async function handleSave() {
    const trimmed = nome.trim();
    if (!trimmed) {
      toast.error("Informe o nome do cliente");
      return;
    }
    try {
      await updateClient.mutateAsync({ id: clientId, nome: trimmed });
      toast.success("Cliente corrigido com sucesso");
      onSaved(trimmed);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao corrigir cliente");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Corrigir cliente</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="edit-client-nome">Nome do cliente</Label>
          <Input
            id="edit-client-nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            A correção é aplicada ao cadastro do cliente e reflete em todos os orçamentos vinculados a ele.
          </p>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave} disabled={updateClient.isPending}>
            {updateClient.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
