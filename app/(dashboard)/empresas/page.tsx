import { redirect } from "next/navigation";

// A tela de Empresas Emissoras foi movida para dentro de Configurações
// (aba "Empresas Emissoras"). Mantemos esta rota como redirect para não
// quebrar links/favoritos antigos apontando para /empresas.
export default function EmpresasRedirectPage() {
  redirect("/configuracoes?tab=empresas");
}
