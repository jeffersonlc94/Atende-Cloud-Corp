import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { computeFleetAlerts } from "@/lib/frota-alerts";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const alerts = await computeFleetAlerts();
  return NextResponse.json(alerts);
}
