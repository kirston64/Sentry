import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  await prisma.user.update({
    where: { id: session.id },
    data: { lastActiveAt: new Date() },
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
