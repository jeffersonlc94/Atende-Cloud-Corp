"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { navItems } from "./nav-items";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Building } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden md:flex h-screen sticky top-0 flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-200",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <Building className="h-5 w-5 shrink-0 text-primary" />
        {!collapsed && (
          <span className="truncate font-semibold">Atende Cloud Corp</span>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href) && item.href !== "#";
          const content = (
            <span
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                item.disabled
                  ? "cursor-not-allowed opacity-50"
                  : active
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && (
                <span className="flex flex-1 items-center justify-between">
                  {item.label}
                  {item.badge && (
                    <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground">
                      {item.badge}
                    </span>
                  )}
                </span>
              )}
            </span>
          );

          const inner = item.disabled ? (
            <div key={item.href}>{content}</div>
          ) : (
            <Link key={item.href} href={item.href}>
              {content}
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger render={inner} />
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          }

          return inner;
        })}
      </nav>

      <div className="border-t p-2">
        <Button
          variant="ghost"
          size="icon"
          className="w-full"
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
