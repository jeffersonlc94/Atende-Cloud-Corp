"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  navItems,
  orcamentosNavItems,
  frotaNavItems,
  frotaCommonNavItems,
} from "./nav-items";
import { useCompanies } from "@/hooks/use-companies";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronsUpDown,
  Leaf,
  Car,
  type LucideIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const [collapsed, setCollapsed] = useState(false);
  const isFrota = pathname.startsWith("/frota");

  return (
    <aside
      className={cn(
        "hidden md:flex h-screen sticky top-0 flex-col border-r transition-all duration-200",
        collapsed ? "w-16" : "w-[210px]",
        isFrota
          ? "border-slate-800 bg-[#0f1b2d] text-slate-300"
          : "bg-white text-slate-700"
      )}
    >
      {isFrota ? (
        <FrotaBrand collapsed={collapsed} />
      ) : (
        <OrcamentosBrand collapsed={collapsed} />
      )}

      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {isFrota ? (
          <FrotaNav pathname={pathname} collapsed={collapsed} isAdmin={isAdmin} />
        ) : (
          <OrcamentosNav pathname={pathname} collapsed={collapsed} isAdmin={isAdmin} />
        )}
      </nav>

      <div
        className={cn(
          "border-t p-2",
          isFrota ? "border-slate-800" : "border-slate-200"
        )}
      >
        {!collapsed &&
          (isFrota ? <FrotaFooter /> : <OrcamentosFooter session={session} />)}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "mt-1 w-full",
            isFrota && "text-slate-300 hover:bg-slate-800 hover:text-white"
          )}
          onClick={() => setCollapsed((c) => !c)}
          aria-label="Recolher menu"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
    </aside>
  );
}

function OrcamentosBrand({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
        <Leaf className="h-5 w-5" />
      </span>
      {!collapsed && (
        <div className="min-w-0">
          <p className="truncate font-bold leading-tight text-slate-900">Orçamentos</p>
          <p className="truncate text-xs leading-tight text-slate-500">
            Sistema de Orçamentos
          </p>
        </div>
      )}
    </div>
  );
}

function FrotaBrand({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex h-16 items-center gap-2 border-b border-slate-800 px-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
        <Car className="h-5 w-5" />
      </span>
      {!collapsed && (
        <div className="min-w-0">
          <p className="truncate font-bold leading-tight text-white">Frota</p>
          <p className="truncate text-xs leading-tight text-slate-400">
            Controle de Veículos
          </p>
        </div>
      )}
    </div>
  );
}

function NavLink({
  href,
  label,
  Icon,
  active,
  collapsed,
  dark,
  indent,
  badge,
}: {
  href: string;
  label: string;
  Icon: LucideIcon;
  active: boolean;
  collapsed: boolean;
  dark?: boolean;
  indent?: boolean;
  badge?: string;
}) {
  const content = (
    <span
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        indent && !collapsed && "ml-3",
        active
          ? "bg-emerald-600 text-white"
          : dark
          ? "text-slate-300 hover:bg-slate-800 hover:text-white"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && (
        <span className="flex flex-1 items-center justify-between">
          {label}
          {badge && (
            <span className="ml-2 rounded bg-black/10 px-1.5 py-0.5 text-[10px] font-normal">
              {badge}
            </span>
          )}
        </span>
      )}
    </span>
  );

  const link = (
    <Link key={href} href={href}>
      {content}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip key={href}>
        <TooltipTrigger render={link} />
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

function OrcamentosNav({
  pathname,
  collapsed,
  isAdmin,
}: {
  pathname: string;
  collapsed: boolean;
  isAdmin: boolean;
}) {
  const isOrcamentosSection = pathname.startsWith("/orcamentos") && pathname !== "/orcamentos/dashboard";
  const [open, setOpen] = useState(true);
  const DashboardIcon = navItems[0].icon;
  const OrcamentosIcon = navItems[1].icon;

  return (
    <>
      <NavLink
        href="/orcamentos/dashboard"
        label="Dashboard"
        Icon={DashboardIcon}
        active={pathname === "/orcamentos/dashboard"}
        collapsed={collapsed}
      />

      <div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900",
            isOrcamentosSection && !open && "text-slate-900"
          )}
        >
          <OrcamentosIcon className="h-4 w-4 shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">Orçamentos</span>
              <ChevronDown
                className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
              />
            </>
          )}
        </button>
        {open && !collapsed && (
          <div className="mt-1 space-y-1">
            {orcamentosNavItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                Icon={item.icon}
                active={
                  item.href === "/orcamentos"
                    ? pathname === "/orcamentos" || /^\/orcamentos\/[^/]+$/.test(pathname)
                    : pathname === item.href
                }
                collapsed={collapsed}
                indent
              />
            ))}
          </div>
        )}
      </div>

      {navItems.slice(2).map((item) => {
        if (item.adminOnly && !isAdmin) return null;
        return (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            Icon={item.icon}
            active={pathname.startsWith(item.href) && item.href !== "#"}
            collapsed={collapsed}
          />
        );
      })}
    </>
  );
}

function FrotaNav({
  pathname,
  collapsed,
  isAdmin,
}: {
  pathname: string;
  collapsed: boolean;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(true);

  return (
    <>
      <div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
        >
          <Car className="h-4 w-4 shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">Veículos</span>
              <ChevronDown
                className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
              />
            </>
          )}
        </button>
        {open && !collapsed && (
          <div className="mt-1 space-y-1">
            {frotaNavItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                Icon={item.icon}
                active={pathname === item.href}
                collapsed={collapsed}
                dark
                indent
              />
            ))}
          </div>
        )}
      </div>

      {frotaCommonNavItems.map((item) => {
        if (item.adminOnly && !isAdmin) return null;
        return (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            Icon={item.icon}
            active={pathname.startsWith(item.href)}
            collapsed={collapsed}
            dark
          />
        );
      })}
    </>
  );
}

function OrcamentosFooter({
  session,
}: {
  session: ReturnType<typeof useSession>["data"];
}) {
  const name = session?.user?.name ?? "Usuário";
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <button
      type="button"
      className="flex w-full items-center gap-2 rounded-md px-1.5 py-1.5 text-left hover:bg-slate-100"
    >
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="bg-slate-200 text-slate-600">
          {initials || "U"}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
        <p className="truncate text-xs text-slate-500">
          {session?.user?.role === "ADMIN" ? "Administrador" : "Usuário"}
        </p>
      </div>
      <ChevronsUpDown className="h-4 w-4 shrink-0 text-slate-400" />
    </button>
  );
}

function FrotaFooter() {
  const { data: companies = [] } = useCompanies();
  const current = companies[0];
  const nome = current?.nomeFantasia || current?.razaoSocial;

  return (
    <div className="rounded-md px-1.5 py-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        Empresa atual
      </p>
      <p className="truncate text-sm font-bold text-white">
        {nome || "Nenhuma empresa"}
      </p>
      <Link
        href="/empresas"
        className="text-xs font-medium text-emerald-500 hover:text-emerald-400 hover:underline"
      >
        Trocar empresa
      </Link>
    </div>
  );
}
