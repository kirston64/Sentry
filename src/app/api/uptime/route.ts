import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = Math.min(parseInt(searchParams.get("days") || "90"), 90);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const servers = await prisma.server.findMany();

  const result = await Promise.all(
    servers.map(async (server) => {
      const checks = await prisma.uptimeCheck.findMany({
        where: { serverId: server.id, createdAt: { gte: since } },
        orderBy: { createdAt: "asc" },
      });

      const total = checks.length;
      const up = checks.filter((c) => c.status === "up").length;
      const uptimePercent = total > 0 ? Math.round((up / total) * 10000) / 100 : 100;

      // Group by day
      const dailyMap = new Map<string, { up: number; total: number }>();
      for (const check of checks) {
        const day = check.createdAt.toISOString().slice(0, 10);
        const entry = dailyMap.get(day) || { up: 0, total: 0 };
        entry.total++;
        if (check.status === "up") entry.up++;
        dailyMap.set(day, entry);
      }

      const daily = Array.from(dailyMap.entries()).map(([date, { up: u, total: t }]) => ({
        date,
        uptimePercent: Math.round((u / t) * 10000) / 100,
      }));

      const withResponse = checks.filter((c) => c.responseMs != null);
      const avgResponseMs = withResponse.length > 0
        ? Math.round(withResponse.reduce((sum, c) => sum + (c.responseMs || 0), 0) / withResponse.length)
        : null;

      return {
        serverId: server.id,
        serverName: server.name,
        status: server.status,
        uptimePercent,
        avgResponseMs,
        totalChecks: total,
        daily,
      };
    })
  );

  return NextResponse.json(result);
}
