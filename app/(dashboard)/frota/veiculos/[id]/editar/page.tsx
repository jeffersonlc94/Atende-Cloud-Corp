"use client";

import { use } from "react";
import { useVehicle } from "@/hooks/use-vehicles";
import { VehicleForm } from "@/components/frota/vehicle-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditarVeiculoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: vehicle, isLoading } = useVehicle(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!vehicle) {
    return <p className="text-muted-foreground">Veículo não encontrado.</p>;
  }

  return <VehicleForm initialData={vehicle} />;
}
