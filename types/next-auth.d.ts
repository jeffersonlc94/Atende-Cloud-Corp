import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      cargo?: string | null;
      canAccessOrcamentos: boolean;
      canAccessFrota: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
    cargo?: string | null;
    canAccessOrcamentos?: boolean;
    canAccessFrota?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    cargo?: string | null;
    canAccessOrcamentos?: boolean;
    canAccessFrota?: boolean;
  }
}
