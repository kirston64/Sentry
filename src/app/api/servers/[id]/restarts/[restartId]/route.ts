import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hasRole } from "@/lib/rbac";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; restartId: string }> }
) {
  const session = await getSession();
  if (!session || !hasRole(session.role, "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { restartId } = await params;
  const body = await request.json();

  const restart = await prisma.scheduledRestart.update({
    where: { id: restartId },
    data: {
      ...(body.cronExpr !== undefined && { cronExpr: body.cronExpr }),
      ...(body.label !== undefined && { label: body.label }),
      ...(body.enabled !== undefined && { enabled: body.enabled }),
    },
  });

  return NextResponse.json(restart);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; restartId: string }> }
) {
  const session = await getSession();
  if (!session || !hasRole(session.role, "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { restartId } = await params;
  await prisma.scheduledRestart.delete({ where: { id: restartId } });
  return NextResponse.json({ deleted: true });
}
