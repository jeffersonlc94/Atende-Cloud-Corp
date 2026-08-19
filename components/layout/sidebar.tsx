"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { navItems, orcamentosNavItems, frotaNavItems, type NavItem } from "./nav-items";
import { useSystemSettings } from "@/hooks/use-settings";
import { ChevronDown, Leaf, FileText, Truck, Boxes, GraduationCap, type LucideIcon } from "lucide-react";

const DEFAULT_SYSTEM_NAME = "Atende Cloud Corp";

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
      <SidebarNav />
    </aside>
  );
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const canOrcamentos = isAdmin || session?.user?.canAccessOrcamentos !== false;
  const canFrota = isAdmin || session?.user?.canAccessFrota !== false;
  const canEstoque = isAdmin || session?.user?.canAccessEstoque !== false;

  const usuariosItem = navItems.find((i) => i.href === "/usuarios");
  const auditoriaItem = navItems.find((i) => i.href === "/auditoria");
  const configuracoesItem = navItems.find((i) => i.href === "/configuracoes");
  const sobreItem = navItems.find((i) => i.href === "/sobre");

  return (
    <>
      <SidebarBrand />
      <nav className="scrollbar-none flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {canOrcamentos && (
          <NavLink
            href="/orcamentos/dashboard"
            label="Dashboard"
            Icon={navItems[0].icon}
            active={pathname === "/orcamentos/dashboard"}
            onNavigate={onNavigate}
          />
        )}

        {canOrcamentos && (
          <NavGroup
            label="Orçamentos"
            Icon={FileText}
            items={orcamentosNavItems}
            onNavigate={onNavigate}
            isActive={(item) =>
              item.href === "/orcamentos"
                ? pathname === "/orcamentos" ||
                  (/^\/orcamentos\/[^/]+$/.test(pathname) &&
                    pathname !== "/orcamentos/novo" &&
                    pathname !== "/orcamentos/dashboard")
                : pathname === item.href
            }
          />
        )}

        {canFrota && (
          <NavGroup
            label="Gestão de Frota"
            Icon={Truck}
            items={frotaNavItems}
            onNavigate={onNavigate}
            isActive={(item) => pathname === item.href}
          />
        )}

        {canEstoque && (
          <NavLink
            href="/estoque"
            label="Controle de Estoque"
            Icon={Boxes}
            active={pathname === "/estoque"}
            onNavigate={onNavigate}
          />
        )}

        <NavLink
          href="/treinamentos"
          label="Treinamentos"
          Icon={GraduationCap}
          active={pathname.startsWith("/treinamentos")}
          onNavigate={onNavigate}
        />

        {isAdmin && usuariosItem && (
          <NavLink
            href={usuariosItem.href}
            label={usuariosItem.label}
            Icon={usuariosItem.icon}
            active={pathname.startsWith("/usuarios")}
            onNavigate={onNavigate}
          />
        )}

        {isAdmin && auditoriaItem && (
          <NavLink
            href={auditoriaItem.href}
            label={auditoriaItem.label}
            Icon={auditoriaItem.icon}
            active={pathname.startsWith("/auditoria")}
            onNavigate={onNavigate}
          />
        )}

        {isAdmin && configuracoesItem && (
          <NavLink
            href={configuracoesItem.href}
            label={configuracoesItem.label}
            Icon={configuracoesItem.icon}
            active={pathname === "/configuracoes"}
            onNavigate={onNavigate}
          />
        )}

        {sobreItem && (
          <NavLink
            href={sobreItem.href}
            label={sobreItem.label}
            Icon={sobreItem.icon}
            active={pathname === "/sobre"}
            onNavigate={onNavigate}
          />
        )}
      </nav>
    </>
  );
}

function SidebarBrand() {
  const { data: settings } = useSystemSettings();
  const systemName = settings?.systemName || DEFAULT_SYSTEM_NAME;

  return (
    <div className="flex items-center gap-2.5 px-5 py-5">
      {settings?.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={settings.logoUrl}
          alt={systemName}
          className="h-9 w-9 rounded-xl object-cover"
        />
      ) : (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Leaf className="h-5 w-5" />
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-[15px] font-semibold">{systemName}</p>
        <p className="truncate text-xs text-sidebar-foreground/55">Orçamentos e Frota</p>
      </div>
    </div>
  );
}

function NavLink({
  href,
  label,
  Icon,
  active,
  indent,
  onNavigate,
}: {
  href: string;
  label: string;
  Icon: LucideIcon;
  active: boolean;
  indent?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link href={href} onClick={onNavigate}>
      <span
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          indent && "truncate",
          active
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-sidebar-foreground/75 hover:bg-white/5 hover:text-sidebar-foreground"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="truncate">{label}</span>
      </span>
    </Link>
  );
}

function NavGroup({
  label,
  Icon,
  items,
  isActive,
  onNavigate,
}: {
  label: string;
  Icon: LucideIcon;
  items: NavItem[];
  isActive: (item: NavItem) => boolean;
  onNavigate?: () => void;
}) {
  const hasActiveChild = items.some((item) => isActive(item));
  const [open, setOpen] = useState(hasActiveChild);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          hasActiveChild
            ? "text-sidebar-foreground"
            : "text-sidebar-foreground/75 hover:bg-white/5 hover:text-sidebar-foreground"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate text-left">{label}</span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <div className="mt-1 space-y-1 border-l border-sidebar-border pl-4">
          {items.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              Icon={item.icon}
              active={isActive(item)}
              indent
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
