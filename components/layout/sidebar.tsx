"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { navItems, orcamentosNavItems, frotaNavItems, type NavItem } from "./nav-items";
import { useSystemSettings } from "@/hooks/use-settings";
import { ChevronDown, Leaf, FileText, Truck, Boxes, GraduationCap, PanelLeftClose, PanelLeftOpen, type LucideIcon } from "lucide-react";

const DEFAULT_SYSTEM_NAME = "Atende Cloud Corp";

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem("sidebar-collapsed") === "true");
  }, []);

  function toggleSidebar() {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  }

  function expandSidebar() {
    window.localStorage.setItem("sidebar-collapsed", "false");
    setCollapsed(false);
  }

  return (
    <aside className={cn("hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex", collapsed ? "w-[72px]" : "w-64")}>
      <SidebarNav collapsed={collapsed} onToggle={toggleSidebar} onExpand={expandSidebar} />
    </aside>
  );
}

export function SidebarNav({ onNavigate, collapsed = false, onToggle, onExpand }: { onNavigate?: () => void; collapsed?: boolean; onToggle?: () => void; onExpand?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const canOrcamentos = isAdmin || session?.user?.canAccessOrcamentos !== false;
  const canFrota = isAdmin || session?.user?.canAccessFrota !== false;
  const canEstoque = isAdmin || session?.user?.canAccessEstoque !== false;
  const canTreinamentos = isAdmin || session?.user?.canAccessTreinamentos !== false;

  const usuariosItem = navItems.find((i) => i.href === "/usuarios");
  const auditoriaItem = navItems.find((i) => i.href === "/auditoria");
  const configuracoesItem = navItems.find((i) => i.href === "/configuracoes");
  const sobreItem = navItems.find((i) => i.href === "/sobre");

  return (
    <>
      <SidebarBrand collapsed={collapsed} onToggle={onToggle} />
      <nav className={cn("scrollbar-none flex-1 space-y-1 overflow-y-auto pb-4", collapsed ? "px-2" : "px-3")}>
        {canOrcamentos && (
          <NavLink
            href="/orcamentos/dashboard"
            label="Dashboard"
            Icon={navItems[0].icon}
            active={pathname === "/orcamentos/dashboard"}
            onNavigate={onNavigate}
            collapsed={collapsed}
          />
        )}

        {canOrcamentos && (
          <NavGroup
            label="Orçamentos"
            Icon={FileText}
            items={orcamentosNavItems}
            onNavigate={onNavigate}
            collapsed={collapsed}
            onExpand={onExpand}
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
            collapsed={collapsed}
            onExpand={onExpand}
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
            collapsed={collapsed}
          />
        )}

        {canTreinamentos && <NavLink
          href="/treinamentos"
          label="Treinamentos"
          Icon={GraduationCap}
          active={pathname.startsWith("/treinamentos")}
          onNavigate={onNavigate}
          collapsed={collapsed}
        />}

        {isAdmin && usuariosItem && (
          <NavLink
            href={usuariosItem.href}
            label={usuariosItem.label}
            Icon={usuariosItem.icon}
            active={pathname.startsWith("/usuarios")}
            onNavigate={onNavigate}
            collapsed={collapsed}
          />
        )}

        {isAdmin && auditoriaItem && (
          <NavLink
            href={auditoriaItem.href}
            label={auditoriaItem.label}
            Icon={auditoriaItem.icon}
            active={pathname.startsWith("/auditoria")}
            onNavigate={onNavigate}
            collapsed={collapsed}
          />
        )}

        {isAdmin && configuracoesItem && (
          <NavLink
            href={configuracoesItem.href}
            label={configuracoesItem.label}
            Icon={configuracoesItem.icon}
            active={pathname === "/configuracoes"}
            onNavigate={onNavigate}
            collapsed={collapsed}
          />
        )}

        {sobreItem && (
          <NavLink
            href={sobreItem.href}
            label={sobreItem.label}
            Icon={sobreItem.icon}
            active={pathname === "/sobre"}
            onNavigate={onNavigate}
            collapsed={collapsed}
          />
        )}
      </nav>
    </>
  );
}

function SidebarBrand({ collapsed, onToggle }: { collapsed: boolean; onToggle?: () => void }) {
  const { data: settings } = useSystemSettings();
  const systemName = settings?.systemName || DEFAULT_SYSTEM_NAME;

  return (
    <div className={cn("flex items-center py-5", collapsed ? "flex-col gap-3 px-2" : "gap-2.5 px-5")}>
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
      <div className={cn("min-w-0 flex-1", collapsed && "hidden")}>
        <p className="truncate text-[15px] font-semibold">{systemName}</p>
        <p className="truncate text-xs text-sidebar-foreground/55">Orçamentos e Frota</p>
      </div>
      {onToggle && <button type="button" onClick={onToggle} title={collapsed ? "Abrir barra lateral" : "Recolher barra lateral"} aria-label={collapsed ? "Abrir barra lateral" : "Recolher barra lateral"} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-white/10 hover:text-sidebar-foreground">{collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}</button>}
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
  collapsed = false,
}: {
  href: string;
  label: string;
  Icon: LucideIcon;
  active: boolean;
  indent?: boolean;
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  return (
    <Link href={href} onClick={onNavigate} title={collapsed ? label : undefined} aria-label={collapsed ? label : undefined}>
      <span
        className={cn(
          "flex items-center rounded-lg py-2.5 text-sm font-medium transition-colors",
          collapsed ? "justify-center px-2" : "gap-3 px-3",
          indent && "truncate",
          active
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-sidebar-foreground/75 hover:bg-white/5 hover:text-sidebar-foreground"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {!collapsed && <span className="truncate">{label}</span>}
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
  collapsed = false,
  onExpand,
}: {
  label: string;
  Icon: LucideIcon;
  items: NavItem[];
  isActive: (item: NavItem) => boolean;
  onNavigate?: () => void;
  collapsed?: boolean;
  onExpand?: () => void;
}) {
  const hasActiveChild = items.some((item) => isActive(item));
  const [open, setOpen] = useState(hasActiveChild);

  return (
    <div>
      <button
        type="button"
        onClick={() => collapsed ? onExpand?.() : setOpen((o) => !o)}
        title={collapsed ? label : undefined}
        aria-label={collapsed ? label : undefined}
        className={cn(
          "flex w-full items-center rounded-lg py-2.5 text-sm font-medium transition-colors",
          collapsed ? "justify-center px-2" : "gap-3 px-3",
          hasActiveChild
            ? "text-sidebar-foreground"
            : "text-sidebar-foreground/75 hover:bg-white/5 hover:text-sidebar-foreground"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {!collapsed && <span className="flex-1 truncate text-left">{label}</span>}
        {!collapsed && <ChevronDown
          className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")}
        />}
      </button>
      {open && !collapsed && (
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
