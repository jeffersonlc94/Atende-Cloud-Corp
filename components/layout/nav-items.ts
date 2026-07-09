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
    disabled: true,
    badge: "Em breve",
  },
];
