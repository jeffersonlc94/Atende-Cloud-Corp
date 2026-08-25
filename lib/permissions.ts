export type UserRole = "ADMIN" | "USER";
export type ModuleName = "orcamentos" | "cotacoes" | "frota" | "estoque" | "treinamentos";

type SessionLike =
  | {
      user?: {
        role?: string | null;
        canAccessOrcamentos?: boolean | null;
        canAccessFrota?: boolean | null;
        canAccessEstoque?: boolean | null;
        canAccessTreinamentos?: boolean | null;
        canAccessCotacoes?: boolean | null;
      } | null;
    }
  | null
  | undefined;

function isAdmin(session: SessionLike): boolean {
  return session?.user?.role === "ADMIN";
}

/**
 * Admin sempre tem acesso a todos os módulos. Para os demais usuários,
 * respeita os campos canAccessOrcamentos/canAccessFrota da sessão.
 */
export function canAccessModule(session: SessionLike, module: ModuleName): boolean {
  if (isAdmin(session)) return true;
  if (module === "orcamentos") return session?.user?.canAccessOrcamentos !== false;
  if (module === "frota") return session?.user?.canAccessFrota !== false;
  if (module === "estoque") return session?.user?.canAccessEstoque !== false;
  if (module === "treinamentos") return session?.user?.canAccessTreinamentos !== false;
  if (module === "cotacoes") return session?.user?.canAccessCotacoes !== false;
  return false;
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
