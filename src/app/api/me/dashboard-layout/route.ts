import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const row = await prisma.dashboardLayout.findUnique({ where: { userId: session.id } });
  if (!row) return NextResponse.json(null);

  try {
    return NextResponse.json(JSON.parse(row.layout));
  } catch {
    return NextResponse.json(null);
  }
}

export async function PUT(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const layout = await req.json();
  if (!Array.isArray(layout)) return NextResponse.json({ error: "Invalid layout" }, { status: 400 });

  await prisma.dashboardLayout.upsert({
    where: { userId: session.id },
    create: { userId: session.id, layout: JSON.stringify(layout) },
    update: { layout: JSON.stringify(layout) },
  });

  return NextResponse.json({ ok: true });
}
