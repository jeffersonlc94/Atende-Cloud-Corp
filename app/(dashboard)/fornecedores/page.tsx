"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useDeleteSupplier, useSuppliers, type SupplierRecord } from "@/hooks/use-supplier-quotations";
import { SupplierDialog } from "@/components/supplier-quotations/supplier-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Plus, Search, Store, Trash2 } from "lucide-react";

export default function SuppliersPage() {
  const { data: session } = useSession();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<SupplierRecord | null>(null);
  const [open, setOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<SupplierRecord | null>(null);
  const { data = [], isLoading } = useSuppliers(search);
  const remove = useDeleteSupplier();
  const admin = session?.user?.role === "ADMIN";

  return <div className="space-y-6 p-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="flex items-center gap-2 text-2xl font-bold"><Store className="h-6 w-6 text-primary" />Fornecedores</h1><p className="text-sm text-muted-foreground">Lista simples de fornecedores utilizados nas cotações.</p></div>
      <Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="mr-2 h-4 w-4" />Novo fornecedor</Button>
    </div>
    <div className="rounded-2xl border bg-card p-4 shadow-sm"><div className="relative max-w-xl"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Buscar fornecedor pelo nome" value={search} onChange={e => setSearch(e.target.value)} /></div></div>
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm"><table className="w-full text-sm"><thead className="bg-muted/50 text-left"><tr><th className="p-4">Nome do fornecedor</th><th className="p-4 text-right">Ações</th></tr></thead><tbody>
      {data.map(s => <tr key={s.id} className="border-t"><td className="p-4 font-medium">{s.razaoSocial}</td><td className="p-4"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" onClick={() => { setEditing(s); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>{admin && <Button variant="ghost" size="icon" onClick={() => setPendingDelete(s)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}</div></td></tr>)}
      {!isLoading && !data.length && <tr><td colSpan={2} className="p-10 text-center text-muted-foreground">Nenhum fornecedor encontrado.</td></tr>}
    </tbody></table></div>
    <SupplierDialog open={open} onOpenChange={setOpen} supplier={editing} />
    <ConfirmDialog open={!!pendingDelete} onOpenChange={open => !open && setPendingDelete(null)} title="Excluir fornecedor?" description={pendingDelete ? `O fornecedor ${pendingDelete.razaoSocial} será excluído permanentemente.` : ""} confirmLabel="Excluir" variant="destructive" onConfirm={async () => { if (!pendingDelete) return; try { await remove.mutateAsync(pendingDelete.id); toast.success("Fornecedor excluído"); setPendingDelete(null); } catch (error) { toast.error(error instanceof Error ? error.message : "Erro ao excluir"); } }} />
  </div>;
}
