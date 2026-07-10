"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "./theme-toggle";
import { MobileNav } from "./mobile-nav";
import { useFleetAlerts } from "@/hooks/use-fleet";
import { LogOut, Bell, Search, HelpCircle, AlertTriangle } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function Header() {
  const router = useRouter();
  const { data: session } = useSession();
  const { data: alerts = [] } = useFleetAlerts();
  const name = session?.user?.name ?? "";
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const alertCount = alerts.length;

  function handleSearchSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const query = new FormData(e.currentTarget).get("q");
    if (typeof query === "string" && query.trim()) {
      router.push(`/orcamentos?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-header px-4 backdrop-blur supports-[backdrop-filter]:bg-header/95 md:px-6">
      <MobileNav />

      <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="q"
          type="search"
          placeholder="Buscar orçamentos..."
          className="rounded-full border-transparent bg-muted pr-4 pl-9 shadow-none focus-visible:border-input"
        />
      </form>

      <div className="ml-auto flex items-center gap-1">
        <Link
          href="/sobre"
          aria-label="Ajuda"
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <HelpCircle className="h-5 w-5" />
        </Link>

        <Popover>
          <PopoverTrigger
            render={
              <Button variant="ghost" size="icon" className="relative" aria-label="Notificações">
                <Bell className="h-5 w-5" />
                {alertCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
                    {alertCount > 99 ? "99+" : alertCount}
                  </span>
                )}
              </Button>
            }
          />
          <PopoverContent align="end" className="w-80">
            <p className="px-1 pb-1 text-sm font-semibold">Notificações</p>
            <div className="max-h-80 space-y-1 overflow-y-auto">
              {alertCount === 0 && (
                <p className="px-1 py-2 text-sm text-muted-foreground">
                  Nenhuma notificação no momento.
                </p>
              )}
              {alerts.slice(0, 8).map((a) => (
                <div key={a.id} className="flex items-start gap-2 rounded-md px-1 py-1.5 text-sm hover:bg-muted">
                  <AlertTriangle
                    className={`mt-0.5 h-4 w-4 shrink-0 ${
                      a.severidade === "critico" ? "text-red-600" : "text-amber-600"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{a.titulo}</p>
                    <p className="truncate text-xs text-muted-foreground">{a.descricao}</p>
                  </div>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <ThemeToggle />
        <div className="flex items-center gap-2 pl-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initials || "U"}</AvatarFallback>
          </Avatar>
          <div className="hidden text-sm sm:block">
            <p className="font-medium leading-tight">{name}</p>
            <p className="text-xs leading-tight text-muted-foreground">
              {session?.user?.role === "ADMIN" ? "Administrador" : "Usuário"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => signOut({ callbackUrl: "/login" })}
            aria-label="Sair"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
