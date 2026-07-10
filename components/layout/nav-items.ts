import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  FileText,
  FilePlus2,
  ListChecks,
  Building2,
  Truck,
  Car,
  ClipboardList,
  Wrench,
  Droplet,
  FileStack,
  Fuel,
  CalendarDays,
  BarChart3,
  Users,
  ShieldCheck,
  Settings,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
  badge?: string;
  adminOnly?: boolean;
};

// Itens exibidos dentro do grupo expansível "Orçamentos" da sidebar do módulo de Orçamentos.
export const orcamentosNavItems: NavItem[] = [
  { label: "Novo Orçamento", href: "/orcamentos/novo", icon: FilePlus2 },
  { label: "Listar Orçamentos", href: "/orcamentos", icon: ListChecks },
];

export const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/orcamentos/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Orçamentos",
    href: "/orcamentos",
    icon: FileText,
  },
  {
    label: "Empresas Emissoras",
    href: "/configuracoes?tab=empresas",
    icon: Building2,
  },
  {
    label: "Gestão de Frota",
    href: "/frota",
    icon: Truck,
  },
  {
    label: "Usuários",
    href: "/usuarios",
    icon: Users,
    adminOnly: true,
  },
  {
    label: "Auditoria",
    href: "/auditoria",
    icon: ShieldCheck,
    adminOnly: true,
  },
  {
    label: "Configurações",
    href: "/configuracoes",
    icon: Settings,
  },
];

export const frotaNavItems: (NavItem & { label: string; href: string })[] = [
  { label: "Dashboard", href: "/frota/dashboard", icon: LayoutDashboard },
  { label: "Veículos", href: "/frota/veiculos", icon: Car },
  { label: "Checklists", href: "/frota/checklists", icon: ClipboardList },
  { label: "Manutenções", href: "/frota/manutencoes", icon: Wrench },
  { label: "Troca de Óleo", href: "/frota/troca-oleo", icon: Droplet },
  { label: "Documentos", href: "/frota/documentos", icon: FileStack },
  { label: "Abastecimentos", href: "/frota/abastecimentos", icon: Fuel },
  { label: "Agenda", href: "/frota/agenda", icon: CalendarDays },
  { label: "Relatórios", href: "/frota/relatorios", icon: BarChart3 },
];
