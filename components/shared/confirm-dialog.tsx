"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  cancelVariant?: "outline" | "destructive";
  secondaryLabel?: string;
  stackActions?: boolean;
  variant?: "default" | "destructive";
  onConfirm: () => unknown;
  onCancel?: () => unknown;
  onSecondary?: () => unknown;
}

/**
 * Diálogo de confirmação reutilizável para ações de excluir/salvar.
 * Evita duplicar o padrão de modal de confirmação em cada tela.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  cancelVariant = "outline",
  secondaryLabel,
  stackActions = false,
  variant = "default",
  onConfirm,
  onCancel,
  onSecondary,
}: ConfirmDialogProps) {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!open) setConfirming(false);
  }, [open]);
  // Trava o scroll de TODOS os contêineres (o dashboard rola dentro do
  // <main>, não no body) bloqueando os eventos de rolagem na captura.
  // Como nenhum overflow é alterado, a scrollbar não some e o layout
  // não "dança" ao abrir/fechar o diálogo.
  useEffect(() => {
    if (!open) return;
    const blockEvent = (ev: Event) => {
      ev.preventDefault();
    };
    const blockScrollKeys = (ev: KeyboardEvent) => {
      const keys = ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "];
      const target = ev.target as HTMLElement | null;
      const isFormField =
        target !== null && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
      if (keys.includes(ev.key) && !isFormField) ev.preventDefault();
    };
    window.addEventListener("wheel", blockEvent, { passive: false, capture: true });
    window.addEventListener("touchmove", blockEvent, { passive: false, capture: true });
    window.addEventListener("keydown", blockScrollKeys, { capture: true });
    return () => {
      window.removeEventListener("wheel", blockEvent, { capture: true });
      window.removeEventListener("touchmove", blockEvent, { capture: true });
      window.removeEventListener("keydown", blockScrollKeys, { capture: true });
    };
  }, [open]);

  if (!open) return null;

  // Renderiza no body via portal: o <main> do dashboard usa contain:layout,
  // que prenderia o overlay fixed dentro dele em vez de cobrir a janela toda.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-sm">
        <CardContent className="space-y-4 p-6">
          <p className="font-medium">{title}</p>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
          <div className={stackActions ? "flex flex-col gap-2" : "flex flex-wrap justify-end gap-2"}>
            <Button
              variant={cancelVariant}
              className={stackActions ? "order-3 w-full" : undefined}
              disabled={confirming}
              onClick={() => {
                onCancel?.();
                onOpenChange(false);
              }}
            >
              {cancelLabel}
            </Button>
            {secondaryLabel && (
              <Button
                variant="outline"
                className={stackActions ? "order-2 w-full" : undefined}
                disabled={confirming}
                onClick={() => {
                  onSecondary?.();
                  onOpenChange(false);
                }}
              >
                {secondaryLabel}
              </Button>
            )}
            <Button
              variant={variant === "destructive" ? "destructive" : "default"}
              className={stackActions ? "order-1 w-full" : undefined}
              disabled={confirming}
              onClick={async () => {
                if (confirming) return;
                setConfirming(true);
                try {
                  await onConfirm();
                  onOpenChange(false);
                } finally {
                  setConfirming(false);
                }
              }}
            >
              {confirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {confirming ? "Aguarde..." : confirmLabel}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>,
    document.body
  );
}
