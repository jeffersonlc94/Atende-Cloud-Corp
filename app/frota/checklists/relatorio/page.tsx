"use client";

import { useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useChecklists } from "@/hooks/use-fleet";
import { useVehicles } from "@/hooks/use-vehicles";
import { formatVehicleLabel } from "@/components/frota/vehicle-select";
import { statusLabels } from "@/components/frota/checklist-item-status";
import { checklistItemStatusOptions, checklistItemTipoLabels } from "@/lib/validations";
import { formatDateBR } from "@/lib/format";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Printer, FileDown, Loader2 } from "lucide-react";

const statusBadgeClasses: Record<string, string> = {
  OK: "bg-emerald-100 text-emerald-800",
  Atencao: "bg-amber-100 text-amber-800",
  NecessitaManutencao: "bg-red-100 text-red-800",
};

export default function RelatorioChecklistsPage() {
  const searchParams = useSearchParams();
  const vehicleId = searchParams.get("vehicleId") || "";
  const status = searchParams.get("status") || "";

  const { data: checklists = [], isLoading } = useChecklists(vehicleId || undefined);
  const { data: vehicles = [] } = useVehicles();
  const printRef = useRef<HTMLDivElement>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const filtered = useMemo(
    () => (status ? checklists.filter((c) => c.statusGeral === status) : checklists),
    [checklists, status]
  );

  const filteredVehicle = vehicles.find((v) => v.id === vehicleId);
  const now = new Date();

  async function handleGeneratePdf() {
    if (!printRef.current) return;
    setGeneratingPdf(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);

      const targetEl = printRef.current.firstElementChild as HTMLElement | null;
      const captureWidth = targetEl?.scrollWidth || printRef.current.scrollWidth;
      const captureHeight = targetEl?.scrollHeight || printRef.current.scrollHeight;

      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        width: captureWidth,
        height: captureHeight,
        windowWidth: captureWidth,
        windowHeight: captureHeight,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pageWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`relatorio-checklists-${now.toISOString().slice(0, 10)}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF do relatório:", error);
      toast.error("Erro ao gerar PDF. Tente novamente.");
    } finally {
      setGeneratingPdf(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-200 dark:bg-gray-900">
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 border-b bg-background p-4 print:hidden">
        <Link href="/frota/checklists" className={buttonVariants({ variant: "ghost" })}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Imprimir
          </Button>
          <Button onClick={handleGeneratePdf} disabled={generatingPdf || isLoading}>
            {generatingPdf ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            Gerar PDF
          </Button>
        </div>
      </div>

      <div className="py-8">
        <div ref={printRef}>
          <div
            className="mx-auto w-full max-w-[210mm] bg-white p-8 text-black print:p-0 print:shadow-none"
            id="checklist-print-area"
          >
            <div className="border-b-2 border-black pb-4">
              <p className="text-[1.25em] font-bold uppercase leading-tight">
                Relatório de checklists
              </p>
              <p className="text-[0.75em] text-gray-700">
                Gerado em {formatDateBR(now.toISOString())}
                {filteredVehicle && ` — Veículo: ${formatVehicleLabel(filteredVehicle)}`}
                {status && ` — Status: ${statusLabels[status] ?? status}`}
              </p>
            </div>

            {isLoading ? (
              <div className="space-y-2 py-6">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            ) : (
              <table className="mt-4 w-full border-collapse text-[0.8em]">
                <thead>
                  <tr className="border-y-2 border-black bg-sky-100">
                    <th className="border border-gray-400 p-1.5 text-left">DATA</th>
                    <th className="border border-gray-400 p-1.5 text-left">VEÍCULO</th>
                    <th className="border border-gray-400 p-1.5 text-center">TIPO</th>
                    <th className="border border-gray-400 p-1.5 text-center">KM</th>
                    <th className="border border-gray-400 p-1.5 text-left">RESPONSÁVEL</th>
                    <th className="border border-gray-400 p-1.5 text-center">STATUS GERAL</th>
                    <th className="border border-gray-400 p-1.5 text-left">ITENS FORA DE OK</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="border border-gray-400 p-3 text-center text-gray-400">
                        Nenhum checklist encontrado para os filtros selecionados
                      </td>
                    </tr>
                  )}
                  {filtered.map((c, idx) => {
                    const itensForaDeOk = c.itens.filter((i) => i.status !== "OK");
                    return (
                      <tr key={c.id} className={idx % 2 === 1 ? "bg-gray-50" : undefined}>
                        <td className="border border-gray-400 p-1.5">
                          {formatDateBR(c.data)} {c.hora || ""}
                        </td>
                        <td className="border border-gray-400 p-1.5">
                          {c.vehicle.placa} — {c.vehicle.marca} {c.vehicle.modelo}
                        </td>
                        <td className="border border-gray-400 p-1.5 text-center">{c.tipo}</td>
                        <td className="border border-gray-400 p-1.5 text-center">
                          {c.km ? c.km.toLocaleString("pt-BR") : "—"}
                        </td>
                        <td className="border border-gray-400 p-1.5">{c.user?.name ?? "—"}</td>
                        <td className="border border-gray-400 p-1.5 text-center">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[0.9em] font-medium ${statusBadgeClasses[c.statusGeral] ?? ""}`}
                          >
                            {statusLabels[c.statusGeral] ?? c.statusGeral}
                          </span>
                        </td>
                        <td className="border border-gray-400 p-1.5">
                          {itensForaDeOk.length === 0
                            ? "—"
                            : itensForaDeOk
                                .map(
                                  (i) =>
                                    `${checklistItemTipoLabels[i.item as keyof typeof checklistItemTipoLabels] ?? i.item} (${statusLabels[i.status] ?? i.status})`
                                )
                                .join(", ")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            <p className="mt-4 text-[0.75em] text-gray-600">
              Total: {filtered.length} checklist{filtered.length === 1 ? "" : "s"}
              {" — "}
              {checklistItemStatusOptions
                .map((s) => `${statusLabels[s]}: ${filtered.filter((c) => c.statusGeral === s).length}`)
                .join(" · ")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
