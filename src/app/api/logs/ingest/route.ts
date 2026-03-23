import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const apiKey = request.headers.get("x-api-key");
  const expectedKey = process.env.LOG_INGEST_KEY || "log-dev-key";
  if (apiKey !== expectedKey) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const entries = Array.isArray(body) ? body : [body];
    const created = [];

    for (const entry of entries) {
      const { serverId, level, source, message } = entry;
      if (!serverId || !message) continue;

      const log = await prisma.logEntry.create({
        data: {
          serverId,
          level: level || "info",
          source: source || "external",
          message,
        },
      });
      created.push(log);

      // Auto-incident on error spike (5+ in 5 min)
      if (level === "error") {
        const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
        const recentErrors = await prisma.logEntry.count({
          where: {
            serverId,
            level: "error",
            source: source || "external",
            createdAt: { gte: fiveMinAgo },
          },
        });

        if (recentErrors >= 5) {
          const existing = await prisma.incident.findFirst({
            where: {
              title: { contains: source || "external" },
              status: { not: "resolved" },
              createdAt: { gte: fiveMinAgo },
            },
          });

          if (!existing) {
            const owner = await prisma.user.findFirst({ where: { role: "owner" } });
            if (owner) {
              const server = await prisma.server.findUnique({ where: { id: serverId } });
              await prisma.incident.create({
                data: {
                  title: `Error spike: ${source || "external"} on ${server?.name || serverId}`,
                  severity: "P3",
                  status: "investigating",
                  creatorId: owner.id,
                  timeline: {
                    create: {
                      message: `Auto-detected: ${recentErrors} errors in 5min from ${source}. Latest: ${message}`,
                      authorId: owner.id,
                    },
                  },
                },
              });
            }
          }
        }
      }
    }

    return NextResponse.json({ ingested: created.length });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
