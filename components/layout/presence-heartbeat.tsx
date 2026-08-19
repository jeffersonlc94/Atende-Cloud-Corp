"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

export function PresenceHeartbeat() {
  const pathname = usePathname();
  const { status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") return;
    const send = () => {
      if (document.visibilityState !== "visible") return;
      fetch("/api/presence", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: pathname }), keepalive: true }).catch(() => undefined);
    };
    send();
    const interval = window.setInterval(send, 30000);
    const onVisible = () => document.visibilityState === "visible" && send();
    document.addEventListener("visibilitychange", onVisible);
    return () => { window.clearInterval(interval); document.removeEventListener("visibilitychange", onVisible); };
  }, [pathname, status]);

  return null;
}
