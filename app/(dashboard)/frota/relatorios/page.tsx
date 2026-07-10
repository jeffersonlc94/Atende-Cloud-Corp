"use client";

import { useMemo, useRef, useState } from "react";
import { useVehicles } from "@/hooks/use-vehicles";
import {
  useMaintenances,
  useChecklists,
  useOilChanges,
  useFuels,
  useAllVehicleDocuments,
} from "@/hooks/use-fleet";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";
import { FileDown, Loader2 } from "lucide-react";

const categorias = [
  { value: "veiculos", label: "Veículos" },
  { value: "manutencoes", label: "Manutenções" },
  { value: "checklists", label: "Checklists" },
  { value: "trocaOleo", label: "Trocas de Óleo" },
  { value: "abastecimentos", label: "Custos de Abastecimento" },
  { value: "documentos", label: "Documentos" },
] as const;

type Categoria = (typeof categorias)[number]["value"];

export default function RelatoriosFrotaPage() {
  const [categoria, setCategoria] = useState<Categoria>("veiculos");
  const [generating, setGenerating] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const { data: vehicles = [] } = useVehicles();
  const { data: maintenances = [] } = useMaintenances();
  const { data: checklists = [] } = useChecklists();
  const { data: oilChanges = [] } = useOilChanges();
  const { data: fuels = [] } = useFuels();
  const { data: documentos = [] } = useAllVehicleDocuments();

  const totalCustoManutencao = useMemo(
    () => maintenances.reduce((acc, m) => acc + Number(m.valor ?? 0), 0),
    [maintenances]
  );
  const totalCustoAbastecimento = useMemo(
    () => fuels.reduce((acc, f) => acc + Number(f.valorTotal), 0),
    [fuels]
  );

  async function handleGeneratePdf() {
    if (!printRef.current) return;
    setGenerating(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);

      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
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

      pdf.save(`relatorio-frota-${categoria}.pdf`);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-sm text-muted-foreground">Relatórios da gestão de frota, exportáveis em PDF</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={categoria} onValueChange={(v) => setCategoria(v as Categoria)}>
            <SelectTrigger className="w-56">
              <SelectValue>
                {(value) => categorias.find((c) => c.value === value)?.label ?? "Selecione..."}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {categorias.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleGeneratePdf} disabled={generating}>
            {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
            Gerar PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div ref={printRef} className="bg-white p-4 text-black">
            <h2 className="mb-4 text-lg font-bold">
              Relatório de {categorias.find((c) => c.value === categoria)?.label}
            </h2>

            {categoria === "veiculos" && (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-gray-100 text-left">
                    <th className="p-2">Placa</th>
                    <th className="p-2">Veículo</th>
                    <th className="p-2">Situação</th>
                    <th className="p-2">KM atual</th>
                    <th className="p-2">Empresa</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((v) => (
                    <tr key={v.id} className="border-b">
                      <td className="p-2">{v.placa}</td>
                      <td className="p-2">{v.marca} {v.modelo}</td>
                      <td className="p-2">{v.situacao}</td>
                      <td className="p-2">{v.kmAtual.toLocaleString("pt-BR")}</td>
                      <td className="p-2">{v.company.nomeFantasia || v.company.razaoSocial}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {categoria === "manutencoes" && (
              <>
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b bg-gray-100 text-left">
                      <th className="p-2">Veículo</th>
                      <th className="p-2">Tipo</th>
                      <th className="p-2">Data</th>
                      <th className="p-2">Oficina</th>
                      <th className="p-2">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenances.map((m) => (
                      <tr key={m.id} className="border-b">
                        <td className="p-2">{m.vehicle.placa}</td>
                        <td className="p-2">{m.tipo}</td>
                        <td className="p-2">{formatDateBR(m.data)}</td>
                        <td className="p-2">{m.oficina || "—"}</td>
                        <td className="p-2">{m.valor ? formatCurrencyBRL(Number(m.valor)) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-4 font-semibold">
                  Custo total: {formatCurrencyBRL(totalCustoManutencao)}
                </p>
              </>
            )}

            {categoria === "checklists" && (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-gray-100 text-left">
                    <th className="p-2">Veículo</th>
                    <th className="p-2">Tipo</th>
                    <th className="p-2">Data</th>
                    <th className="p-2">Itens com atenção</th>
                  </tr>
                </thead>
                <tbody>
                  {checklists.map((c) => (
                    <tr key={c.id} className="border-b">
                      <td className="p-2">{c.vehicle.placa}</td>
                      <td className="p-2">{c.tipo}</td>
                      <td className="p-2">{formatDateBR(c.data)}</td>
                      <td className="p-2">
                        {c.itens.filter((i) => i.status !== "OK").length}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {categoria === "trocaOleo" && (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-gray-100 text-left">
                    <th className="p-2">Veículo</th>
                    <th className="p-2">Data</th>
                    <th className="p-2">KM</th>
                    <th className="p-2">Próxima troca</th>
                    <th className="p-2">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {oilChanges.map((o) => (
                    <tr key={o.id} className="border-b">
                      <td className="p-2">{o.vehicle.placa}</td>
                      <td className="p-2">{formatDateBR(o.data)}</td>
                      <td className="p-2">{o.km.toLocaleString("pt-BR")}</td>
                      <td className="p-2">{o.kmProximaTroca?.toLocaleString("pt-BR") ?? "—"}</td>
                      <td className="p-2">{o.valor ? formatCurrencyBRL(Number(o.valor)) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {categoria === "abastecimentos" && (
              <>
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b bg-gray-100 text-left">
                      <th className="p-2">Veículo</th>
                      <th className="p-2">Data</th>
                      <th className="p-2">Litros</th>
                      <th className="p-2">Valor total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fuels.map((f) => (
                      <tr key={f.id} className="border-b">
                        <td className="p-2">{f.vehicle.placa}</td>
                        <td className="p-2">{formatDateBR(f.data)}</td>
                        <td className="p-2">{Number(f.litros).toLocaleString("pt-BR")} L</td>
                        <td className="p-2">{formatCurrencyBRL(Number(f.valorTotal))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-4 font-semibold">
                  Custo total: {formatCurrencyBRL(totalCustoAbastecimento)}
                </p>
              </>
            )}

            {categoria === "documentos" && (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-gray-100 text-left">
                    <th className="p-2">Veículo</th>
                    <th className="p-2">Tipo</th>
                    <th className="p-2">Emissão</th>
                    <th className="p-2">Vencimento</th>
                  </tr>
                </thead>
                <tbody>
                  {documentos.map((d) => (
                    <tr key={d.id} className="border-b">
                      <td className="p-2">{d.vehicle.placa}</td>
                      <td className="p-2">{d.tipo}</td>
                      <td className="p-2">{d.dataEmissao ? formatDateBR(d.dataEmissao) : "—"}</td>
                      <td className="p-2">{d.dataVencimento ? formatDateBR(d.dataVencimento) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
