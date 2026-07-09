import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  FileText,
  Building2,
  Truck,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
  badge?: string;
};

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
    href: "/empresas",
    icon: Building2,
  },
  {
    label: "Gestão de Frota",
    href: "/frota",
    icon: Truck,
  },
];

export const frotaNavItems: { label: string; href: string }[] = [
  { label: "Dashboard", href: "/frota/dashboard" },
  { label: "Veículos", href: "/frota/veiculos" },
  { label: "Checklists", href: "/frota/checklists" },
  { label: "Manutenções", href: "/frota/manutencoes" },
  { label: "Troca de Óleo", href: "/frota/troca-oleo" },
  { label: "Documentos", href: "/frota/documentos" },
  { label: "Abastecimentos", href: "/frota/abastecimentos" },
  { label: "Agenda", href: "/frota/agenda" },
  { label: "Relatórios", href: "/frota/relatorios" },
];
