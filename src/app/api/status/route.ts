import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Public endpoint — no auth required
export async function GET() {
  try {
    const ninety = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const [servers, incidents] = await Promise.all([
      prisma.server.findMany({
        include: {
          metrics: { orderBy: { createdAt: "desc" }, take: 1 },
          uptimeChecks: { where: { createdAt: { gte: ninety } } },
        },
      }),
      prisma.incident.findMany({
        where: { status: { not: "resolved" } },
        orderBy: { createdAt: "desc" },
        include: {
          timeline: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      }),
    ]);

    const serverStatus = servers.map((s) => {
      const latest = s.metrics[0];
      const totalChecks = s.uptimeChecks.length;
      const upChecks = s.uptimeChecks.filter((c) => c.status === "up").length;
      const uptimePercent = totalChecks > 0 ? Math.round((upChecks / totalChecks) * 10000) / 100 : 100;

      return {
        name: s.name,
        status: s.status as "online" | "offline" | "restarting",
        uptimeSeconds: latest?.uptimeSeconds ?? 0,
        players: latest?.playersOnline ?? 0,
        maxPlayers: s.maxPlayers,
        uptimePercent,
      };
    });

    const activeIncidents = incidents.map((inc) => ({
      id: inc.id,
      title: inc.title,
      severity: inc.severity,
      status: inc.status,
      createdAt: inc.createdAt.toISOString(),
      lastUpdate: inc.timeline[0]?.message ?? null,
    }));

    return NextResponse.json({
      servers: serverStatus,
      incidents: activeIncidents,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
