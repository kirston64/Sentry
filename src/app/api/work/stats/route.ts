import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasRole } from "@/lib/rbac";

// Returns work stats for all users (admin/owner) or just self (developer)
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const days = Math.min(parseInt(searchParams.get("days") ?? "7"), 30);

  const from = new Date();
  from.setDate(from.getDate() - days + 1);
  from.setHours(0, 0, 0, 0);
  const fromDate = from.toISOString().slice(0, 10);

  const isAdmin = hasRole(session.role, "admin");

  const sessions = await prisma.workSession.findMany({
    where: {
      ...(isAdmin ? {} : { userId: session.id }),
      date: { gte: fromDate },
    },
    include: {
      breaks: true,
      user: { select: { id: true, username: true, fullName: true, avatar: true, role: true } },
    },
    orderBy: { startedAt: "desc" },
  });

  // Compute minutes worked per session
  const enriched = sessions.map(s => {
    const end = s.endedAt ?? new Date();
    const totalMs = end.getTime() - s.startedAt.getTime();
    const breakMs = s.breaks.reduce((acc, b) => {
      if (!b.endedAt) return acc + (new Date().getTime() - b.startedAt.getTime());
      return acc + (b.endedAt.getTime() - b.startedAt.getTime());
    }, 0);
    const workedMin = Math.max(0, Math.round((totalMs - breakMs) / 60000));
    const breakMin  = Math.round(breakMs / 60000);
    return { ...s, workedMin, breakMin };
  });

  // Group by user for summary
  const byUser: Record<string, { user: typeof sessions[0]["user"]; totalMin: number; breakMin: number; days: number; sessions: typeof enriched }> = {};
  for (const s of enriched) {
    if (!byUser[s.userId]) {
      byUser[s.userId] = { user: s.user, totalMin: 0, breakMin: 0, days: 0, sessions: [] };
    }
    byUser[s.userId].totalMin += s.workedMin;
    byUser[s.userId].breakMin += s.breakMin;
    byUser[s.userId].days += 1;
    byUser[s.userId].sessions.push(s);
  }

  return NextResponse.json({ users: Object.values(byUser), sessions: enriched, days });
}
