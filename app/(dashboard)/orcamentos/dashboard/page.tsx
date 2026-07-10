"use client";

import Link from "next/link";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { useQuotesDashboard } from "@/hooks/use-quotes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard, type StatCardAccent } from "@/components/shared/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCurrencyBRL, formatDateBR } from "@/lib/format";
import { FileText, DollarSign, CalendarDays, TrendingUp } from "lucide-react";

const chartConfig = {
  total: {
    label: "Valor total (R$)",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export default function OrcamentosDashboardPage() {
  const { data, isLoading } = useQuotesDashboard();

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  const stats: { label: string; value: string; icon: typeof FileText; accent: StatCardAccent }[] = [
    {
      label: "Total de orçamentos",
      value: data.totalOrcamentos.toLocaleString("pt-BR"),
      icon: FileText,
      accent: "default",
    },
    {
      label: "Valor total emitido",
      value: formatCurrencyBRL(data.valorTotal),
      icon: DollarSign,
      accent: "info",
    },
    {
      label: "Total no mês",
      value: formatCurrencyBRL(data.totalMes),
      icon: CalendarDays,
      accent: "teal",
    },
    {
      label: "Total no ano",
      value: formatCurrencyBRL(data.totalAno),
      icon: TrendingUp,
      accent: "purple",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard de Orçamentos</h1>
        <p className="text-sm text-muted-foreground">
          Visão geral do módulo de orçamentos
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} accent={s.accent} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Emissão mensal (últimos 12 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-72 w-full">
              <BarChart data={data.serieMensal}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="mes" tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="total" fill="var(--color-total)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Empresas que mais emitiram</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.topEmpresas.length === 0 && (
              <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
            )}
            {data.topEmpresas.map((e) => (
              <div key={e.companyId} className="flex items-center justify-between text-sm">
                <span className="truncate">{e.nome}</span>
                <span className="font-medium">{e.total}</span>
              </div>
            ))}
            <div className="border-t pt-3 text-sm text-muted-foreground">
              Valor médio por orçamento: {" "}
              <span className="font-medium text-foreground">
                {formatCurrencyBRL(data.valorMedio)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimos orçamentos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.ultimosOrcamentos.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum orçamento emitido ainda.</p>
          )}
          {data.ultimosOrcamentos.map((q) => (
            <Link
              key={q.id}
              href={`/orcamentos/${q.id}`}
              className="flex items-center justify-between rounded-md border p-3 text-sm hover:bg-accent"
            >
              <div>
                <p className="font-medium">
                  Nº {q.numero} — {q.client.nome}
                </p>
                <p className="text-muted-foreground">
                  {q.company.nomeFantasia || q.company.razaoSocial} •{" "}
                  {formatDateBR(q.dataEmissao)}
                </p>
              </div>
              <span className="font-semibold">{formatCurrencyBRL(Number(q.total))}</span>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
