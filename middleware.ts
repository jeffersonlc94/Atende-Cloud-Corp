import { NextResponse } from "next/server";
import { auth } from "@/auth";

const PUBLIC_PATHS = ["/login"];

export default auth((req) => {
  const { nextUrl } = req;
  const isPublic =
    PUBLIC_PATHS.some((p) => nextUrl.pathname.startsWith(p)) ||
    nextUrl.pathname.startsWith("/api/auth");

  if (isPublic) return NextResponse.next();

  if (!req.auth) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const user = req.auth.user;
  const isAdmin = user?.role === "ADMIN";

  if (!isAdmin && nextUrl.pathname.startsWith("/orcamentos") && user?.canAccessOrcamentos === false) {
    return NextResponse.redirect(new URL("/acesso-negado", nextUrl.origin));
  }

  if (!isAdmin && nextUrl.pathname.startsWith("/frota") && user?.canAccessFrota === false) {
    return NextResponse.redirect(new URL("/acesso-negado", nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads).*)"],
};
