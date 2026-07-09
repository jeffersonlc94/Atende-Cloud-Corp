import { Truck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function FrotaPage() {
  return (
    <div className="flex h-[70vh] items-center justify-center">
      <Card className="max-w-md">
        <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
          <Truck className="h-10 w-10 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Gestão de Frota</h2>
          <p className="text-sm text-muted-foreground">
            Este módulo estará disponível em uma próxima fase do Atende Cloud
            Corp.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
