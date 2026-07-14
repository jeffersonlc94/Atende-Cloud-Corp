// Agendador interno de notificações da Frota.
// Roda no processo do servidor Next.js (produção e dev) e verifica a cada
// minuto se algum canal (e-mail/Telegram) está no dia+horário configurado
// no painel. O anti-reenvio diário por canal evita duplicidade mesmo se o
// processo reiniciar.
export async function register() {
  // O import fica dentro do if para o bundle edge não tentar resolver
  // dependências exclusivas de Node (nodemailer usa require("stream")).
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { runScheduledNotifications } = await import("@/lib/notifications-runner");

    setInterval(async () => {
      try {
        const summary = await runScheduledNotifications();
        if (summary && (summary.sent > 0 || summary.sentTelegram > 0)) {
          console.log(
            `[notificacoes] disparo agendado: ${summary.sent} e-mail(s), ${summary.sentTelegram} telegram`
          );
        }
      } catch (err) {
        console.error("[notificacoes] erro no agendador:", err);
      }
    }, 60_000);
  }
}
