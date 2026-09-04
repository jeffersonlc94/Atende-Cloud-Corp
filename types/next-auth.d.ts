import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      cargo?: string | null;
      canAccessOrcamentos: boolean;
      canAccessFrota: boolean;
      canAccessEstoque: boolean;
      canAccessTreinamentos: boolean;
      canAccessCotacoes: boolean;
      canAccessArquivosTecnicos: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
    cargo?: string | null;
    canAccessOrcamentos?: boolean;
    canAccessFrota?: boolean;
    canAccessEstoque?: boolean;
    canAccessTreinamentos?: boolean;
    canAccessCotacoes?: boolean;
    canAccessArquivosTecnicos?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    cargo?: string | null;
    canAccessOrcamentos?: boolean;
    canAccessFrota?: boolean;
    canAccessEstoque?: boolean;
    canAccessTreinamentos?: boolean;
    canAccessCotacoes?: boolean;
    canAccessArquivosTecnicos?: boolean;
  }
}
