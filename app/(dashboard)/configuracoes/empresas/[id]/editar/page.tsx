"use client";

import { use } from "react";
import { useCompany } from "@/hooks/use-companies";
import { CompanyForm } from "@/components/companies/company-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditarEmpresaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: company, isLoading } = useCompany(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!company) {
    return <p className="text-muted-foreground">Empresa não encontrada.</p>;
  }

  return <CompanyForm initialData={company} />;
}
