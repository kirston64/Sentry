import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasRole } from "@/lib/rbac";
import fs from "fs";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(session.role, "admin")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const backup = await prisma.backup.findUnique({ where: { id }, select: { path: true } });

  if (backup?.path) {
    try { fs.unlinkSync(backup.path); } catch { /* file may already be gone */ }
  }

  await prisma.backup.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
