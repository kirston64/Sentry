import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { banned: true, banReason: true },
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (user.banned) {
    return NextResponse.json({ banned: true, reason: user.banReason }, { status: 403 });
  }

  return NextResponse.json({ banned: false });
}
