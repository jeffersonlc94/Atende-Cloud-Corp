import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export default function AcessoNegadoPage() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 p-10 text-center text-muted-foreground">
        <ShieldAlert className="h-10 w-10" />
        <div>
          <p className="text-lg font-semibold text-foreground">Acesso negado</p>
          <p className="text-sm">Você não tem permissão para acessar este módulo.</p>
        </div>
        <Link href="/configuracoes" className={buttonVariants()}>
          Voltar
        </Link>
      </CardContent>
    </Card>
  );
}
