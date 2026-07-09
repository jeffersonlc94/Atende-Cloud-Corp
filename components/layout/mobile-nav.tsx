"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Menu, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { navItems } from "./nav-items";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const [open, setOpen] = useState(false);
  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        }
      />
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="border-b h-14 flex-row items-center px-4">
          <Building className="h-5 w-5 text-primary" />
          <SheetTitle>Atende Cloud Corp</SheetTitle>
        </SheetHeader>
        <nav className="space-y-1 p-2">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            const content = (
              <span
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                  item.disabled
                    ? "cursor-not-allowed opacity-50"
                    : active
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex flex-1 items-center justify-between">
                  {item.label}
                  {item.badge && (
                    <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground">
                      {item.badge}
                    </span>
                  )}
                </span>
              </span>
            );
            return item.disabled ? (
              <div key={item.href}>{content}</div>
            ) : (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                {content}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
