import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.avatarUrl,
          role: user.role,
          cargo: user.cargo,
          canAccessOrcamentos: user.canAccessOrcamentos,
          canAccessFrota: user.canAccessFrota,
          canAccessEstoque: user.canAccessEstoque,
          canAccessTreinamentos: user.canAccessTreinamentos,
          canAccessCotacoes: user.canAccessCotacoes,
          canAccessArquivosTecnicos: user.canAccessArquivosTecnicos,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      // Disparado por `update()` no client (ex: após editar o próprio perfil
      // em /perfil) — recarrega os dados atuais do usuário no token.
      if (trigger === "update" && token.id) {
        const fresh = await prisma.user.findUnique({ where: { id: token.id as string } });
        if (fresh) {
          token.role = fresh.role;
          token.cargo = fresh.cargo ?? null;
          token.canAccessOrcamentos = fresh.canAccessOrcamentos;
          token.canAccessFrota = fresh.canAccessFrota;
          token.canAccessEstoque = fresh.canAccessEstoque;
          token.canAccessTreinamentos = fresh.canAccessTreinamentos;
          token.canAccessCotacoes = fresh.canAccessCotacoes;
          token.canAccessArquivosTecnicos = fresh.canAccessArquivosTecnicos;
          token.picture = fresh.avatarUrl ?? null;
          token.name = fresh.name;
          token.email = fresh.email;
        }
        return token;
      }

      if (user) {
        const u = user as {
          role?: string;
          cargo?: string | null;
          canAccessOrcamentos?: boolean;
          canAccessFrota?: boolean;
          canAccessEstoque?: boolean;
          canAccessTreinamentos?: boolean;
          canAccessCotacoes?: boolean;
          canAccessArquivosTecnicos?: boolean;
        };
        token.role = u.role;
        token.cargo = u.cargo ?? null;
        token.canAccessOrcamentos = u.canAccessOrcamentos ?? true;
        token.canAccessFrota = u.canAccessFrota ?? true;
        token.canAccessEstoque = u.canAccessEstoque ?? true;
        token.canAccessTreinamentos = u.canAccessTreinamentos ?? true;
        token.canAccessCotacoes = u.canAccessCotacoes ?? true;
        token.canAccessArquivosTecnicos = u.canAccessArquivosTecnicos ?? true;
        token.id = user.id;
        token.picture = user.image ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.cargo = (token.cargo as string | null | undefined) ?? null;
        session.user.canAccessOrcamentos = (token.canAccessOrcamentos as boolean | undefined) ?? true;
        session.user.canAccessFrota = (token.canAccessFrota as boolean | undefined) ?? true;
        session.user.canAccessEstoque = (token.canAccessEstoque as boolean | undefined) ?? true;
        session.user.canAccessTreinamentos = (token.canAccessTreinamentos as boolean | undefined) ?? true;
        session.user.canAccessCotacoes = (token.canAccessCotacoes as boolean | undefined) ?? true;
        session.user.canAccessArquivosTecnicos = (token.canAccessArquivosTecnicos as boolean | undefined) ?? true;
        session.user.image = (token.picture as string | null) ?? null;
      }
      return session;
    },
  },
});
