"use client";

import { use } from "react";
import { useUser } from "@/hooks/use-users";
import { UserForm } from "@/components/users/user-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditarUsuarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: user, isLoading } = useUser(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!user) {
    return <p className="text-muted-foreground">Usuário não encontrado.</p>;
  }

  return <UserForm initialData={user} />;
}
