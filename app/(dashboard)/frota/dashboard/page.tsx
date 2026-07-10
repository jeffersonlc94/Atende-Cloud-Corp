"use client";

import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Area,
  AreaChart,
  Pie,
  PieChart,
  Cell,
  LabelList,
} from "recharts";
import { useState, type ReactNode } from "react";
import type { DateRange } from "react-day-picker";
import { useFleetDashboard } from "@/hooks/use-fleet";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard, type StatCardAccent } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
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
  Info,
  Car,
  Eye,
  MoreVertical,
  Plus,
} from "lucide-react";

const kmChartConfig = {
  km: { label: "KM acumulado", color: "var(--chart-1)" },
} satisfies ChartConfig;

const manutencaoChartConfig = {
  valor: { label: "Custo (R$)", color: "var(--chart-2)" },
} satisfies ChartConfig;

const donutChartConfig = {
  quantidade: { label: "Veículos" },
} satisfies ChartConfig;

const donutColors: Record<string, string> = {
  Realizados: "#16a34a",
  "Realizados com alerta": "#f59e0b",
  Pendentes: "#dc2626",
};

function formatPercent(value: number, total: number) {
  if (total <= 0) return "0,0%";
  return `${(Math.round((value / total) * 1000) / 10).toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

function formatCurrencyShort(value: number) {
  return `R$ ${Math.round(value).toLocaleString("pt-BR")}`;
}

function progressColor(percentual: number) {
  if (percentual >= 100) return "bg-red-600";
  if (percentual >= 80) return "bg-amber-500";
  return "bg-emerald-600";
}

export default function FrotaDashboardPage() {
  const { data, isLoading } = useFleetDashboard();
  const [range, setRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 8)),
    to: new Date(),
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-9 w-48" />
        </div>
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const cards: { label: string; value: number; sub: string; icon: typeof Truck; accent: StatCardAccent }[] = [
    {
      label: "Total de Veículos",
      value: data.totalVeiculos,
      sub: "veículos cadastrados",
      icon: Truck,
      accent: "info",
    },
    {
      label: "Veículos em Dia",
      value: data.veiculosEmDia,
      sub: `${formatPercent(data.veiculosEmDia, data.totalVeiculos)} da frota`,
      icon: CheckCircle2,
      accent: "default",
    },
    {
      label: "Manutenções Pendentes",
      value: data.manutencoesPendentes,
      sub: `${formatPercent(data.manutencoesPendentes, data.totalVeiculos)} da frota`,
      icon: Wrench,
      accent: "warning",
    },
    {
      label: "Documentos Vencidos",
      value: data.documentosVencidos,
      sub: `${formatPercent(data.documentosVencidos, data.totalVeiculos)} da frota`,
      icon: FileWarning,
      accent: "critical",
    },
    {
      label: "Checklists Pendentes",
      value: data.checklistsPendentes,
      sub: "esta semana",
      icon: ClipboardList,
      accent: "purple",
    },
    {
      label: "Próxima Troca de Óleo",
      value: data.trocasOleoAteMilKm,
      sub: "até 1.000 km",
      icon: Droplet,
      accent: "teal",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Visão geral da frota de veículos
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DateRangePicker value={range} onChange={setRange} />
          <Link href="/frota/veiculos/novo" className={buttonVariants()}>
            <Plus className="mr-2 h-4 w-4" /> Novo Veículo
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => (
          <StatCard
            key={c.label}
            label={c.label}
            value={c.value}
            hint={c.sub}
            icon={c.icon}
            accent={c.accent}
          />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Próximas Trocas de Óleo</CardTitle>
            <CardAction>
              <Link href="/frota/troca-oleo" className="text-xs font-medium text-primary hover:underline">
                Ver todas
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.proximasTrocasOleo.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma troca de óleo registrada.</p>
            )}
            {data.proximasTrocasOleo.map((item) => (
              <div key={item.id} className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium leading-tight">{item.veiculo}</p>
                      <p className="text-xs leading-tight text-muted-foreground">{item.placa}</p>
                    </div>
                  </div>
                  <p className="whitespace-nowrap text-right text-xs text-muted-foreground">
                    Próxima troca: {item.kmProximaTroca.toLocaleString("pt-BR")} km
                  </p>
                </div>
                <Progress
                  value={Math.min(100, item.percentual)}
                  indicatorClassName={progressColor(item.percentual)}
                />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{item.percentual}%</span>
                  {item.kmFalta <= 0 ? (
                    <span className="font-medium text-red-600">
                      Vencida {Math.abs(item.kmFalta).toLocaleString("pt-BR")} km
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      {item.kmAtual.toLocaleString("pt-BR")} km atual
                    </span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Evolução da Quilometragem (Km)</CardTitle>
            <CardAction>
              <Link href="/frota/veiculos" className="text-xs font-medium text-primary hover:underline">
                Ver todos
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            <ChartContainer config={kmChartConfig} className="h-64 w-full">
              <AreaChart data={data.evolucaoKm}>
                <defs>
                  <linearGradient id="fillKm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-km)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--color-km)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="mes" tickLine={false} axisLine={false} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="km"
                  stroke="var(--color-km)"
                  fill="url(#fillKm)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alertas Recentes</CardTitle>
            <CardAction>
              <Link href="/frota/veiculos" className="text-xs font-medium text-primary hover:underline">
                Ver todos
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-1">
            {data.alertas.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum alerta no momento.</p>
            )}
            {data.alertas.slice(0, 6).map((a) => {
              const critico = a.severidade === "critico";
              return (
                <div key={a.id} className="flex items-start gap-3 rounded-md p-2 text-sm">
                  <span
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                      critico ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
                    }`}
                  >
                    {critico ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : (
                      <Info className="h-4 w-4" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{a.titulo}</p>
                    <p className="truncate text-xs text-muted-foreground">{a.descricao}</p>
                  </div>
                  <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
                    {a.tipo === "checklist" ? "Esta semana" : critico ? "Vencido" : "Atenção"}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Documentos a Vencer</CardTitle>
            <CardAction>
              <Link href="/frota/documentos" className="text-xs font-medium text-primary hover:underline">
                Ver todos
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.documentosAVencer.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum documento a vencer.</p>
            )}
            {data.documentosAVencer.map((d) => (
              <div key={d.id} className="flex items-start justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {d.tipo} — {d.veiculo}
                  </p>
                  <p className="text-xs text-muted-foreground">{d.placa}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm">{new Date(d.dataVencimento).toLocaleDateString("pt-BR")}</p>
                  <p className="text-xs text-muted-foreground">Em {d.diasRestantes} dias</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Checklists da Semana</CardTitle>
            <CardAction>
              <Link href="/frota/checklists" className="text-xs font-medium text-primary hover:underline">
                Ver todos
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="relative mx-auto h-40 w-40 shrink-0">
                <ChartContainer config={donutChartConfig} className="h-40 w-40">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={data.checklistDonut}
                      dataKey="quantidade"
                      nameKey="status"
                      innerRadius={45}
                      outerRadius={70}
                      strokeWidth={2}
                    >
                      {data.checklistDonut.map((entry) => (
                        <Cell key={entry.status} fill={donutColors[entry.status]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold">{data.totalVeiculos}</span>
                  <span className="text-xs text-muted-foreground">veículos</span>
                </div>
              </div>
              <div className="min-w-0 flex-1 space-y-2 text-sm">
                {data.checklistDonut.map((entry) => (
                  <div key={entry.status} className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: donutColors[entry.status] }}
                    />
                    <span className="min-w-0 flex-1 truncate">{entry.status}</span>
                    <span className="shrink-0 font-medium">{entry.quantidade}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatPercent(entry.quantidade, data.totalVeiculos)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manutenções por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={manutencaoChartConfig} className="h-64 w-full">
              <BarChart data={data.manutencoesPorMes} margin={{ top: 24 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="mes" tickLine={false} axisLine={false} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={56}
                  tickFormatter={(v: number) => formatCurrencyShort(v)}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="valor" fill="var(--color-valor)" radius={4}>
                  <LabelList
                    dataKey="valor"
                    position="top"
                    formatter={(v: ReactNode) =>
                      typeof v === "number" && v > 0 ? formatCurrencyShort(v) : ""
                    }
                    className="fill-foreground text-[10px]"
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Veículos da Frota</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Placa</TableHead>
                <TableHead>Veículo</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Ano</TableHead>
                <TableHead>Km atual</TableHead>
                <TableHead>Próx. troca óleo</TableHead>
                <TableHead>Checklist</TableHead>
                <TableHead>Documentos</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.veiculos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground">
                    Nenhum veículo cadastrado
                  </TableCell>
                </TableRow>
              )}
              {data.veiculos.map((v) => {
                const falta = v.kmProximaTroca ? v.kmProximaTroca - v.kmAtual : null;
                return (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">
                      <Link href={`/frota/veiculos/${v.id}`} className="hover:underline">
                        {v.placa}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        {v.marca} {v.modelo}
                      </div>
                    </TableCell>
                    <TableCell>{v.modelo}</TableCell>
                    <TableCell>{v.ano}</TableCell>
                    <TableCell>{v.kmAtual.toLocaleString("pt-BR")} km</TableCell>
                    <TableCell>
                      {falta === null ? (
                        "—"
                      ) : falta <= 0 ? (
                        <span className="font-medium text-red-600">
                          Venceu {Math.abs(falta).toLocaleString("pt-BR")} km
                        </span>
                      ) : falta <= 1000 ? (
                        <span className="font-medium text-amber-600">
                          Falta {falta.toLocaleString("pt-BR")} km
                        </span>
                      ) : (
                        <span className="text-emerald-700">
                          Falta {falta.toLocaleString("pt-BR")} km
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {v.checklistRealizadoSemana ? (
                        <StatusBadge tone="success">Realizado</StatusBadge>
                      ) : (
                        <StatusBadge tone="warning">Pendente</StatusBadge>
                      )}
                    </TableCell>
                    <TableCell>
                      {v.documentoStatus === "Em dia" && (
                        <StatusBadge tone="success">Em dia</StatusBadge>
                      )}
                      {v.documentoStatus === "Vencendo" && (
                        <StatusBadge tone="warning">Vencendo</StatusBadge>
                      )}
                      {v.documentoStatus === "Vencido" && (
                        <StatusBadge tone="critical">Vencido</StatusBadge>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        tone={
                          v.situacao === "Ativo"
                            ? "success"
                            : v.situacao === "Manutencao"
                            ? "warning"
                            : "neutral"
                        }
                      >
                        {v.situacao === "Manutencao" ? "Manutenção" : v.situacao}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/frota/veiculos/${v.id}`}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                          aria-label="Ver veículo"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                          aria-label="Mais ações"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
