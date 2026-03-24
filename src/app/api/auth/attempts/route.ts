import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || (session.role !== "owner" && session.role !== "admin")) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // last 24h

  const attempts = await prisma.failedLogin.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(attempts);
}

export async function DELETE() {
  const session = await getSession();
  if (!session || session.role !== "owner") {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  await prisma.failedLogin.deleteMany({});
  return NextResponse.json({ ok: true });
}
