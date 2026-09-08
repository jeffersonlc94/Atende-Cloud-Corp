CREATE TABLE "read_fleet_alerts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "read_fleet_alerts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "read_fleet_alerts_userId_alertId_key" ON "read_fleet_alerts"("userId", "alertId");
CREATE INDEX "read_fleet_alerts_userId_idx" ON "read_fleet_alerts"("userId");

ALTER TABLE "read_fleet_alerts" ADD CONSTRAINT "read_fleet_alerts_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
