import { prisma } from "@/lib/prisma";

const SETTINGS_ID = "default";

// Leitura server-side das configurações de personalização, usada em
// app/layout.tsx para renderizar título, favicon e cores já corretos no HTML
// inicial (SSR) — evita o "flash" de volta ao padrão e o favicon não
// aplicar corretamente, que acontecem quando essa leitura só existe no
// client via fetch (JS rodando depois do primeiro paint).
export async function getSystemSettingsForSSR() {
  try {
    return await prisma.systemSettings.findUnique({ where: { id: SETTINGS_ID } });
  } catch {
    // Banco indisponível no momento do build/SSR (ex: build sem DB) — cai
    // para os valores padrão, o client (SettingsProvider) ainda cobre isso
    // assim que o banco estiver acessível.
    return null;
  }
}
