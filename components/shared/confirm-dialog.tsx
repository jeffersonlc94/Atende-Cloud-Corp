"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void;
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
  variant = "default",
  onConfirm,
}: ConfirmDialogProps) {
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
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {cancelLabel}
            </Button>
            <Button
              variant={variant === "destructive" ? "destructive" : "default"}
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
            >
              {confirmLabel}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>,
    document.body
  );
}
