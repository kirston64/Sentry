import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const serverId = searchParams.get("serverId");
  const level = searchParams.get("level");
  const search = searchParams.get("search");
  const format = searchParams.get("format") || "log"; // log | csv | json

  const where: Record<string, unknown> = {};
  if (serverId) where.serverId = serverId;
  if (level) where.level = level;
  if (search) where.message = { contains: search };

  const logs = await prisma.logEntry.findMany({
    where,
    orderBy: { createdAt: "asc" },
    include: { server: { select: { name: true } } },
  });

  const date = new Date().toISOString().slice(0, 10);

  if (format === "json") {
    const body = JSON.stringify(logs, null, 2);
    return new Response(body, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="server-logs-${date}.json"`,
      },
    });
  }

  if (format === "csv") {
    const header = "id,createdAt,level,source,server,message\n";
    const rows = logs.map((l) => {
      const msg = l.message.replace(/"/g, '""');
      return `${l.id},${l.createdAt.toISOString()},${l.level},${l.source},${l.server?.name ?? ""},"${msg}"`;
    });
    return new Response(header + rows.join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="server-logs-${date}.csv"`,
      },
    });
  }

  // Plain .log format
  const lines = logs.map((l) => {
    const ts = new Date(l.createdAt).toISOString();
    const server = l.server?.name ?? "unknown";
    return `[${ts}] [${l.level.toUpperCase().padEnd(5)}] [${server}] [${l.source}] ${l.message}`;
  });

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain",
      "Content-Disposition": `attachment; filename="server-logs-${date}.log"`,
    },
  });
}
