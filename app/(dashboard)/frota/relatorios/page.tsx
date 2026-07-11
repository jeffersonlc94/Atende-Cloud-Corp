"use client";

import { useMemo, useRef, useState } from "react";
import { useVehicles } from "@/hooks/use-vehicles";
import {
  useMaintenances,
  useChecklists,
  useOilChanges,
  useFuels,
  useAllVehicleDocuments,
  type MaintenanceRecord,
  type ChecklistRecord,
  type OilChangeRecord,
  type FuelRecord,
  type VehicleDocumentWithVehicle,
} from "@/hooks/use-fleet";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";
import { checklistItemIcons, checklistItemIconColors, statusDotClasses, statusLabels } from "@/components/frota/checklist-item-status";
import { checklistItemTipoLabels } from "@/lib/validations";
import { FileDown, Loader2, Eye, X } from "lucide-react";

const categorias = [
  { value: "veiculos", label: "Veículos" },
  { value: "manutencoes", label: "Manutenções" },
  { value: "checklists", label: "Checklists" },
  { value: "trocaOleo", label: "Trocas de Óleo" },
  { value: "abastecimentos", label: "Custos de Abastecimento" },
  { value: "documentos", label: "Documentos" },
] as const;

type Categoria = (typeof categorias)[number]["value"];
type ViewingRecord =
  | { tipo: "manutencao"; item: MaintenanceRecord }
  | { tipo: "checklist"; item: ChecklistRecord }
  | { tipo: "trocaOleo"; item: OilChangeRecord }
  | { tipo: "abastecimento"; item: FuelRecord }
  | { tipo: "documento"; item: VehicleDocumentWithVehicle };

function withinRange(dateStr: string, inicio: string, fim: string) {
  const d = dateStr.slice(0, 10);
  if (inicio && d < inicio) return false;
  if (fim && d > fim) return false;
  return true;
}

export default function RelatoriosFrotaPage() {
  const [categoria, setCategoria] = useState<Categoria>("veiculos");
  const [generating, setGenerating] = useState(false);
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  const [viewing, setViewing] = useState<ViewingRecord | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const { data: vehicles = [] } = useVehicles();
  const { data: maintenancesAll = [] } = useMaintenances();
  const { data: checklistsAll = [] } = useChecklists();
  const { data: oilChangesAll = [] } = useOilChanges();
  const { data: fuelsAll = [] } = useFuels();
  const { data: documentosAll = [] } = useAllVehicleDocuments();

  const maintenances = useMemo(
    () => maintenancesAll.filter((m) => withinRange(m.data, dataInicial, dataFinal)),
    [maintenancesAll, dataInicial, dataFinal]
  );
  const checklists = useMemo(
    () => checklistsAll.filter((c) => withinRange(c.data, dataInicial, dataFinal)),
    [checklistsAll, dataInicial, dataFinal]
  );
  const oilChanges = useMemo(
    () => oilChangesAll.filter((o) => withinRange(o.data, dataInicial, dataFinal)),
    [oilChangesAll, dataInicial, dataFinal]
  );
  const fuels = useMemo(
    () => fuelsAll.filter((f) => withinRange(f.data, dataInicial, dataFinal)),
    [fuelsAll, dataInicial, dataFinal]
  );
  const documentos = useMemo(
    () =>
      documentosAll.filter((d) => (d.dataEmissao ? withinRange(d.dataEmissao, dataInicial, dataFinal) : !dataInicial && !dataFinal)),
    [documentosAll, dataInicial, dataFinal]
  );

  const totalCustoManutencao = useMemo(
    () => maintenances.reduce((acc, m) => acc + Number(m.valor ?? 0), 0),
    [maintenances]
  );
  const totalCustoAbastecimento = useMemo(
    () => fuels.reduce((acc, f) => acc + Number(f.valorTotal), 0),
    [fuels]
  );

  function clearFilters() {
    setDataInicial("");
    setDataFinal("");
  }

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

  const showDateFilter = categoria !== "veiculos";

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

      {showDateFilter && (
        <Card>
          <CardContent className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label>Data inicial</Label>
              <Input type="date" value={dataInicial} onChange={(e) => setDataInicial(e.target.value)} className="w-44" />
            </div>
            <div className="space-y-1">
              <Label>Data final</Label>
              <Input type="date" value={dataFinal} onChange={(e) => setDataFinal(e.target.value)} className="w-44" />
            </div>
            {(dataInicial || dataFinal) && (
              <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
                <X className="mr-1 h-4 w-4" /> Limpar filtro
              </Button>
            )}
          </CardContent>
        </Card>
      )}

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
                      <th className="w-10 p-2 print:hidden" />
                    </tr>
                  </thead>
                  <tbody>
                    {maintenances.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-gray-400">Nenhum registro no período</td>
                      </tr>
                    )}
                    {maintenances.map((m) => (
                      <tr key={m.id} className="border-b">
                        <td className="p-2">{m.vehicle.placa}</td>
                        <td className="p-2">{m.tipo}</td>
                        <td className="p-2">{formatDateBR(m.data)}</td>
                        <td className="p-2">{m.oficina || "—"}</td>
                        <td className="p-2">{m.valor ? formatCurrencyBRL(Number(m.valor)) : "—"}</td>
                        <td className="p-2 print:hidden">
                          <button
                            type="button"
                            title="Visualizar"
                            onClick={() => setViewing({ tipo: "manutencao", item: m })}
                            className="rounded-md p-1 text-sky-600 hover:bg-sky-50"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
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
                    <th className="w-10 p-2 print:hidden" />
                  </tr>
                </thead>
                <tbody>
                  {checklists.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-gray-400">Nenhum registro no período</td>
                    </tr>
                  )}
                  {checklists.map((c) => (
                    <tr key={c.id} className="border-b">
                      <td className="p-2">{c.vehicle.placa}</td>
                      <td className="p-2">{c.tipo}</td>
                      <td className="p-2">{formatDateBR(c.data)}</td>
                      <td className="p-2">
                        {c.itens.filter((i) => i.status !== "OK").length}
                      </td>
                      <td className="p-2 print:hidden">
                        <button
                          type="button"
                          title="Visualizar"
                          onClick={() => setViewing({ tipo: "checklist", item: c })}
                          className="rounded-md p-1 text-sky-600 hover:bg-sky-50"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
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
                    <th className="w-10 p-2 print:hidden" />
                  </tr>
                </thead>
                <tbody>
                  {oilChanges.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-gray-400">Nenhum registro no período</td>
                    </tr>
                  )}
                  {oilChanges.map((o) => (
                    <tr key={o.id} className="border-b">
                      <td className="p-2">{o.vehicle.placa}</td>
                      <td className="p-2">{formatDateBR(o.data)}</td>
                      <td className="p-2">{o.km.toLocaleString("pt-BR")}</td>
                      <td className="p-2">{o.kmProximaTroca?.toLocaleString("pt-BR") ?? "—"}</td>
                      <td className="p-2">{o.valor ? formatCurrencyBRL(Number(o.valor)) : "—"}</td>
                      <td className="p-2 print:hidden">
                        <button
                          type="button"
                          title="Visualizar"
                          onClick={() => setViewing({ tipo: "trocaOleo", item: o })}
                          className="rounded-md p-1 text-sky-600 hover:bg-sky-50"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
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
                      <th className="w-10 p-2 print:hidden" />
                    </tr>
                  </thead>
                  <tbody>
                    {fuels.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-gray-400">Nenhum registro no período</td>
                      </tr>
                    )}
                    {fuels.map((f) => (
                      <tr key={f.id} className="border-b">
                        <td className="p-2">{f.vehicle.placa}</td>
                        <td className="p-2">{formatDateBR(f.data)}</td>
                        <td className="p-2">{Number(f.litros).toLocaleString("pt-BR")} L</td>
                        <td className="p-2">{formatCurrencyBRL(Number(f.valorTotal))}</td>
                        <td className="p-2 print:hidden">
                          <button
                            type="button"
                            title="Visualizar"
                            onClick={() => setViewing({ tipo: "abastecimento", item: f })}
                            className="rounded-md p-1 text-sky-600 hover:bg-sky-50"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
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
                    <th className="w-10 p-2 print:hidden" />
                  </tr>
                </thead>
                <tbody>
                  {documentos.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-gray-400">Nenhum registro no período</td>
                    </tr>
                  )}
                  {documentos.map((d) => (
                    <tr key={d.id} className="border-b">
                      <td className="p-2">{d.vehicle.placa}</td>
                      <td className="p-2">{d.tipo}</td>
                      <td className="p-2">{d.dataEmissao ? formatDateBR(d.dataEmissao) : "—"}</td>
                      <td className="p-2">{d.dataVencimento ? formatDateBR(d.dataVencimento) : "—"}</td>
                      <td className="p-2 print:hidden">
                        <button
                          type="button"
                          title="Visualizar"
                          onClick={() => setViewing({ tipo: "documento", item: d })}
                          className="rounded-md p-1 text-sky-600 hover:bg-sky-50"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-md sm:max-w-md">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle>Detalhes do registro</DialogTitle>
              </DialogHeader>
              <div className="space-y-2 text-sm">
                {viewing.tipo === "manutencao" && (
                  <>
                    <p><span className="font-medium">Veículo:</span> {viewing.item.vehicle.placa}</p>
                    <p><span className="font-medium">Tipo:</span> {viewing.item.tipo}</p>
                    <p><span className="font-medium">Data:</span> {formatDateBR(viewing.item.data)}</p>
                    <p><span className="font-medium">Oficina:</span> {viewing.item.oficina || "—"}</p>
                    <p><span className="font-medium">KM:</span> {viewing.item.km?.toLocaleString("pt-BR") ?? "—"}</p>
                    <p><span className="font-medium">Valor:</span> {viewing.item.valor ? formatCurrencyBRL(Number(viewing.item.valor)) : "—"}</p>
                    <p><span className="font-medium">Responsável:</span> {viewing.item.responsavelUser?.name ?? "—"}</p>
                    <p><span className="font-medium">Descrição:</span> {viewing.item.descricao || "—"}</p>
                  </>
                )}
                {viewing.tipo === "checklist" && (
                  <>
                    <p><span className="font-medium">Veículo:</span> {viewing.item.vehicle.placa}</p>
                    <p><span className="font-medium">Tipo:</span> {viewing.item.tipo}</p>
                    <p><span className="font-medium">Data:</span> {formatDateBR(viewing.item.data)} {viewing.item.hora || ""}</p>
                    <p><span className="font-medium">KM:</span> {viewing.item.km?.toLocaleString("pt-BR") ?? "—"}</p>
                    <p><span className="font-medium">Por:</span> {viewing.item.user?.name ?? "—"}</p>
                    <p className="flex items-center gap-1.5">
                      <span className="font-medium">Status geral:</span>
                      <span className={`h-2 w-2 rounded-full ${statusDotClasses[viewing.item.statusGeral]}`} />
                      {statusLabels[viewing.item.statusGeral] ?? viewing.item.statusGeral}
                    </p>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {viewing.item.itens.map((i) => {
                        const Icon = checklistItemIcons[i.item as keyof typeof checklistItemIcons];
                        const iconColor = checklistItemIconColors[i.item as keyof typeof checklistItemIconColors];
                        return (
                          <div key={i.id} className="flex items-center gap-2 rounded-md border p-2">
                            {Icon && <Icon className={`h-4 w-4 ${iconColor}`} />}
                            <span className="flex-1 truncate">
                              {checklistItemTipoLabels[i.item as keyof typeof checklistItemTipoLabels] ?? i.item}
                            </span>
                            <span className={`h-2 w-2 rounded-full ${statusDotClasses[i.status]}`} />
                            <span className="text-xs text-muted-foreground">{statusLabels[i.status]}</span>
                          </div>
                        );
                      })}
                    </div>
                    {viewing.item.observacoes && (
                      <p><span className="font-medium">Observações:</span> {viewing.item.observacoes}</p>
                    )}
                  </>
                )}
                {viewing.tipo === "trocaOleo" && (
                  <>
                    <p><span className="font-medium">Veículo:</span> {viewing.item.vehicle.placa}</p>
                    <p><span className="font-medium">Data:</span> {formatDateBR(viewing.item.data)}</p>
                    <p><span className="font-medium">KM:</span> {viewing.item.km.toLocaleString("pt-BR")}</p>
                    <p><span className="font-medium">Tipo de óleo:</span> {viewing.item.tipoOleo || "—"}</p>
                    <p><span className="font-medium">Oficina:</span> {viewing.item.oficina || "—"}</p>
                    <p><span className="font-medium">Próxima troca:</span> {viewing.item.kmProximaTroca?.toLocaleString("pt-BR") ?? "—"}</p>
                    <p><span className="font-medium">Valor:</span> {viewing.item.valor ? formatCurrencyBRL(Number(viewing.item.valor)) : "—"}</p>
                    <p><span className="font-medium">Observações:</span> {viewing.item.observacoes || "—"}</p>
                  </>
                )}
                {viewing.tipo === "abastecimento" && (
                  <>
                    <p><span className="font-medium">Veículo:</span> {viewing.item.vehicle.placa}</p>
                    <p><span className="font-medium">Data:</span> {formatDateBR(viewing.item.data)}</p>
                    <p><span className="font-medium">KM:</span> {viewing.item.km?.toLocaleString("pt-BR") ?? "—"}</p>
                    <p><span className="font-medium">Litros:</span> {Number(viewing.item.litros).toLocaleString("pt-BR")} L</p>
                    <p><span className="font-medium">Valor/litro:</span> {formatCurrencyBRL(Number(viewing.item.valorLitro))}</p>
                    <p><span className="font-medium">Valor total:</span> {formatCurrencyBRL(Number(viewing.item.valorTotal))}</p>
                    <p><span className="font-medium">Posto:</span> {viewing.item.posto || "—"}</p>
                    <p><span className="font-medium">Combustível:</span> {viewing.item.tipoCombustivel}</p>
                  </>
                )}
                {viewing.tipo === "documento" && (
                  <>
                    <p><span className="font-medium">Veículo:</span> {viewing.item.vehicle.placa} — {viewing.item.vehicle.marca} {viewing.item.vehicle.modelo}</p>
                    <p><span className="font-medium">Tipo:</span> {viewing.item.tipo}</p>
                    <p><span className="font-medium">Emissão:</span> {viewing.item.dataEmissao ? formatDateBR(viewing.item.dataEmissao) : "—"}</p>
                    <p><span className="font-medium">Vencimento:</span> {viewing.item.dataVencimento ? formatDateBR(viewing.item.dataVencimento) : "—"}</p>
                    {viewing.item.arquivoUrl && (
                      <a
                        href={viewing.item.arquivoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block text-sky-600 hover:underline"
                      >
                        Ver arquivo
                      </a>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
