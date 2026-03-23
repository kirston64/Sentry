import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hasRole } from "@/lib/rbac";

export async function GET() {
  const session = await getSession();
  if (!session || !hasRole(session.role, "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const configs = await prisma.webhookConfig.findMany();
  return NextResponse.json(
    configs.map((c) => ({
      ...c,
      secret: c.secret ? "***" : null,
      events: JSON.parse(c.events),
    }))
  );
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !hasRole(session.role, "owner")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { type, url, secret, enabled, events } = await request.json();

  const config = await prisma.webhookConfig.upsert({
    where: { type },
    create: { type, url, secret, enabled: enabled ?? true, events: JSON.stringify(events || []) },
    update: { url, secret, enabled: enabled ?? true, events: JSON.stringify(events || []) },
  });

  await prisma.auditLog.create({
    data: { userId: session.id, action: "settings.webhook", target: type, details: `Webhook ${type} configured` },
  });

  return NextResponse.json(config);
}
