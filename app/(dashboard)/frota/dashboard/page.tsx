"use client";

import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
} from "recharts";
import { useFleetDashboard } from "@/hooks/use-fleet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Truck,
  CheckCircle2,
  Wrench,
  ClipboardList,
  FileWarning,
  Droplet,
  AlertTriangle,
} from "lucide-react";

const kmChartConfig = {
  km: { label: "KM acumulado", color: "var(--chart-1)" },
} satisfies ChartConfig;

const manutencaoChartConfig = {
  valor: { label: "Custo (R$)", color: "var(--chart-2)" },
} satisfies ChartConfig;

const donutColors = ["var(--chart-1)", "var(--chart-3)", "var(--chart-5)"];
const donutChartConfig = {
  quantidade: { label: "Itens" },
} satisfies ChartConfig;

export default function FrotaDashboardPage() {
  const { data, isLoading } = useFleetDashboard();

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: "Total de veículos",
      value: data.totalVeiculos,
      icon: Truck,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Veículos ativos",
      value: data.veiculosAtivos,
      icon: CheckCircle2,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Checklists pendentes",
      value: data.checklistsPendentes,
      icon: ClipboardList,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: "Manutenções pendentes",
      value: data.manutencoesPendentes,
      icon: Wrench,
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-500/10",
    },
    {
      label: "Documentos vencendo",
      value: data.documentosVencendo,
      icon: FileWarning,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-500/10",
    },
    {
      label: "Próximas trocas de óleo",
      value: data.trocasOleoProximas,
      icon: Droplet,
      color: "text-cyan-600 dark:text-cyan-400",
      bg: "bg-cyan-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard da Frota</h1>
        <p className="text-sm text-muted-foreground">Visão geral da gestão de frota</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className="mt-1 text-2xl font-bold">{c.value}</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${c.bg}`}>
                <c.icon className={`h-5 w-5 ${c.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Evolução de quilometragem (últimos 12 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={kmChartConfig} className="h-72 w-full">
              <LineChart data={data.evolucaoKm}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="mes" tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="km" stroke="var(--color-km)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Checklists da semana</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={donutChartConfig} className="mx-auto h-64 w-full max-w-64">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                  data={data.checklistDonut}
                  dataKey="quantidade"
                  nameKey="status"
                  innerRadius={50}
                  outerRadius={80}
                  strokeWidth={2}
                >
                  {data.checklistDonut.map((_, i) => (
                    <Cell key={i} fill={donutColors[i % donutColors.length]} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="status" />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manutenções por mês</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={manutencaoChartConfig} className="h-72 w-full">
            <BarChart data={data.manutencoesPorMes}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="mes" tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="valor" fill="var(--color-valor)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Veículos da Frota</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-2">Placa</th>
                  <th className="p-2">Veículo</th>
                  <th className="p-2">Empresa</th>
                  <th className="p-2">Situação</th>
                  <th className="p-2">KM atual</th>
                  <th className="p-2">Checklist</th>
                  <th className="p-2">Documentos</th>
                </tr>
              </thead>
              <tbody>
                {data.veiculos.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-muted-foreground">
                      Nenhum veículo cadastrado
                    </td>
                  </tr>
                )}
                {data.veiculos.map((v) => (
                  <tr key={v.id} className="border-b last:border-0">
                    <td className="p-2 font-medium">
                      <Link href={`/frota/veiculos/${v.id}`} className="hover:underline">
                        {v.placa}
                      </Link>
                    </td>
                    <td className="p-2">
                      {v.marca} {v.modelo}
                    </td>
                    <td className="p-2">{v.empresa}</td>
                    <td className="p-2">
                      <Badge
                        variant={
                          v.situacao === "Ativo"
                            ? "default"
                            : v.situacao === "Manutencao"
                            ? "outline"
                            : "secondary"
                        }
                      >
                        {v.situacao === "Manutencao" ? "Manutenção" : v.situacao}
                      </Badge>
                    </td>
                    <td className="p-2">{v.kmAtual.toLocaleString("pt-BR")} km</td>
                    <td className="p-2">
                      {v.ultimoChecklist ? (
                        new Date(v.ultimoChecklist).toLocaleDateString("pt-BR")
                      ) : (
                        <span className="text-amber-600">Pendente</span>
                      )}
                    </td>
                    <td className="p-2">
                      {v.documentoAlerta ? (
                        <Badge variant="destructive">Atenção</Badge>
                      ) : (
                        <Badge variant="secondary">OK</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alertas recentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.alertas.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum alerta no momento.</p>
            )}
            {data.alertas.map((a) => (
              <div key={a.id} className="flex items-start gap-2 rounded-md border p-2 text-sm">
                <AlertTriangle
                  className={`mt-0.5 h-4 w-4 shrink-0 ${
                    a.severidade === "critico" ? "text-red-600" : "text-amber-600"
                  }`}
                />
                <div>
                  <p className="font-medium">{a.titulo}</p>
                  <p className="text-xs text-muted-foreground">{a.descricao}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* TODO: envio de alertas por e-mail (SMTP) fica para uma fase futura */}
    </div>
  );
}
