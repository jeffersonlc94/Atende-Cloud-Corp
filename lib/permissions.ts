export type UserRole = "ADMIN" | "USER";

type SessionLike =
  | {
      user?: {
        role?: string | null;
      } | null;
    }
  | null
  | undefined;

function isAdmin(session: SessionLike): boolean {
  return session?.user?.role === "ADMIN";
}

/** Apenas Admin pode gerenciar usuários (CRUD na tela de Usuários). */
export function canManageUsers(session: SessionLike): boolean {
  return isAdmin(session);
}

/** Apenas Admin pode excluir empresas, orçamentos e veículos. */
export function canDeleteRecords(session: SessionLike): boolean {
  return isAdmin(session);
}

/** Apenas Admin pode acessar a tela/relatório de auditoria. */
export function canViewAuditLog(session: SessionLike): boolean {
  return isAdmin(session);
}
