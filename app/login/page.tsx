import { Suspense } from "react";
import { LoginForm } from "@/components/layout/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Atende Cloud Corp</h1>
          <p className="text-sm text-muted-foreground">
            Entre com suas credenciais para continuar
          </p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
