"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useVehicles, useDeleteVehicle, type VehicleRecord } from "@/hooks/use-vehicles";
import { useCompanies } from "@/hooks/use-companies";
import { canDeleteRecords } from "@/lib/permissions";
import { combustivelOptions } from "@/lib/validations";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatCard } from "@/components/shared/stat-card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { VehicleCard } from "@/components/frota/vehicle-card";
import { VehicleTable, type VehicleSortKey } from "@/components/frota/vehicle-table";
import {
  Car,
  Plus,
  CheckCircle2,
  Wrench,
  Ban,
  LayoutGrid,
  List as ListIcon,
  PackageOpen,
} from "lucide-react";

const VIEW_MODE_KEY = "atende:veiculos:viewMode";
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

type ViewMode = "grid" | "list";

function VeiculosPageContent() {
  const { data: session } = useSession();
  const canDelete = canDeleteRecords(session);
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [situacao, setSituacao] = useState<string>("all");
  const [companyId, setCompanyId] = useState<string>("all");
  const [combustivel, setCombustivel] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortKey, setSortKey] = useState<VehicleSortKey | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(VIEW_MODE_KEY);
    if (stored === "grid" || stored === "list") setViewMode(stored);
  }, []);

  function handleViewModeChange(mode: ViewMode) {
    setViewMode(mode);
    window.localStorage.setItem(VIEW_MODE_KEY, mode);
  }

  const { data: vehicles = [], isLoading } = useVehicles({
    q,
    situacao: situacao === "all" ? undefined : situacao,
    companyId: companyId === "all" ? undefined : companyId,
  });
  const { data: companies = [] } = useCompanies();
  const deleteVehicle = useDeleteVehicle();

  const hasActiveFilters =
    !!q || situacao !== "all" || companyId !== "all" || combustivel !== "all";

  const filtered = useMemo(() => {
    if (combustivel === "all") return vehicles;
    return vehicles.filter((v) => v.combustivel === combustivel);
  }, [vehicles, combustivel]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "veiculo":
          return `${a.marca} ${a.modelo}`.localeCompare(`${b.marca} ${b.modelo}`) * dir;
        case "placa":
          return a.placa.localeCompare(b.placa) * dir;
        case "ano":
          return (a.ano - b.ano) * dir;
        case "kmAtual":
          return (a.kmAtual - b.kmAtual) * dir;
        case "situacao":
          return a.situacao.localeCompare(b.situacao) * dir;
        default:
          return 0;
      }
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [sorted, currentPage, pageSize]
  );

  useEffect(() => {
    setPage(1);
  }, [q, situacao, companyId, combustivel, pageSize]);

  function handleSort(key: VehicleSortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteVehicle.mutateAsync(id);
      toast.success("Veículo excluído");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir veículo");
    } finally {
      setPendingDelete(null);
    }
  }

  const stats = useMemo(() => {
    const total = vehicles.length;
    const ativos = vehicles.filter((v) => v.situacao === "Ativo").length;
    const manutencao = vehicles.filter((v) => v.situacao === "Manutencao").length;
    const inativos = vehicles.filter((v) => v.situacao === "Inativo").length;
    return { total, ativos, manutencao, inativos };
  }, [vehicles]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Veículos</h1>
          <p className="text-sm text-muted-foreground">Cadastro e gerenciamento da frota.</p>
        </div>
        <Link href="/frota/veiculos/novo" className={buttonVariants()}>
          <Plus className="mr-2 h-4 w-4" /> Novo Veículo
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total de veículos" value={stats.total} icon={Car} accent="info" />
          <StatCard label="Veículos ativos" value={stats.ativos} icon={CheckCircle2} accent="default" />
          <StatCard label="Em manutenção" value={stats.manutencao} icon={Wrench} accent="warning" />
          <StatCard label="Inativos" value={stats.inativos} icon={Ban} accent="critical" />
        </div>
      )}

      <Card>
        <CardContent className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Buscar por placa, marca ou modelo"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="max-w-xs"
          />
          <Select value={situacao} onValueChange={(v) => setSituacao(v ?? "all")}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Situação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as situações</SelectItem>
              <SelectItem value="Ativo">Ativo</SelectItem>
              <SelectItem value="Manutencao">Manutenção</SelectItem>
              <SelectItem value="Inativo">Inativo</SelectItem>
            </SelectContent>
          </Select>
          <Select value={companyId} onValueChange={(v) => setCompanyId(v ?? "all")}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Empresa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as empresas</SelectItem>
              {companies.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nomeFantasia || c.razaoSocial}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={combustivel} onValueChange={(v) => setCombustivel(v ?? "all")}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Combustível" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os combustíveis</SelectItem>
              {combustivelOptions.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="ml-auto flex items-center gap-1 rounded-lg border p-1">
            <Button
              type="button"
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => handleViewModeChange("grid")}
              title="Visualização em grade"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => handleViewModeChange("list")}
              title="Visualização em lista"
            >
              <ListIcon className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        viewMode === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        ) : (
          <Skeleton className="h-96 w-full" />
        )
      ) : sorted.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <PackageOpen className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              {hasActiveFilters
                ? "Nenhum veículo encontrado com os filtros atuais."
                : "Nenhum veículo cadastrado."}
            </p>
            {!hasActiveFilters && (
              <Link href="/frota/veiculos/novo" className={buttonVariants()}>
                <Plus className="mr-2 h-4 w-4" /> Cadastrar primeiro veículo
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginated.map((v: VehicleRecord) => (
                <VehicleCard
                  key={v.id}
                  vehicle={v}
                  canDelete={canDelete}
                  onDelete={setPendingDelete}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <VehicleTable
                  vehicles={paginated}
                  canDelete={canDelete}
                  onDelete={setPendingDelete}
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
              </CardContent>
            </Card>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Itens por página</span>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => v && setPageSize(Number(v))}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>
                {sorted.length} veículo(s)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <span>
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Próxima
              </Button>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title="Confirma a exclusão deste veículo?"
        description="Todos os registros vinculados (checklists, manutenções, documentos, etc.) serão excluídos."
        variant="destructive"
        confirmLabel="Excluir"
        onConfirm={() => pendingDelete && handleDelete(pendingDelete)}
      />
    </div>
  );
}

export default function VeiculosPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando...</p>}>
      <VeiculosPageContent />
    </Suspense>
  );
}
