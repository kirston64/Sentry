import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasRole } from "@/lib/rbac";

function calcWorkedMin(session: {
  startedAt: Date; endedAt: Date | null;
  breaks: { startedAt: Date; endedAt: Date | null }[];
}): number {
  const end = session.endedAt ?? new Date();
  const totalMs = end.getTime() - session.startedAt.getTime();
  const breakMs = session.breaks.reduce((acc, b) => {
    const bEnd = b.endedAt ?? new Date();
    return acc + (bEnd.getTime() - b.startedAt.getTime());
  }, 0);
  return Math.max(0, Math.round((totalMs - breakMs) / 60000));
}

function calcBreakMin(session: {
  breaks: { startedAt: Date; endedAt: Date | null }[];
}): number {
  return Math.round(session.breaks.reduce((acc, b) => {
    const bEnd = b.endedAt ?? new Date();
    return acc + (bEnd.getTime() - b.startedAt.getTime());
  }, 0) / 60000);
}

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const days = Math.min(parseInt(searchParams.get("days") ?? "14"), 90);
  const targetUserId = searchParams.get("userId"); // admin can query specific user

  const from = new Date();
  from.setDate(from.getDate() - days + 1);
  from.setHours(0, 0, 0, 0);
  const fromDate = from.toISOString().slice(0, 10);

  const isAdmin = hasRole(session.role, "admin");

  // Determine which users to fetch
  const userFilter = isAdmin
    ? (targetUserId ? { userId: targetUserId } : {})
    : { userId: session.id };

  const rawSessions = await prisma.workSession.findMany({
    where: { ...userFilter, date: { gte: fromDate } },
    include: {
      breaks: { orderBy: { startedAt: "asc" } },
      user: { select: { id: true, username: true, fullName: true, avatar: true, role: true } },
    },
    orderBy: { startedAt: "desc" },
  });

  // Enrich sessions with calculated minutes
  const enriched = rawSessions.map(s => ({
    ...s,
    workedMin: calcWorkedMin(s),
    breakMin: calcBreakMin(s),
  }));

  // Build date range array
  const dateRange: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(from);
    d.setDate(from.getDate() + i);
    dateRange.push(d.toISOString().slice(0, 10));
  }

  // Group by user with per-day breakdown
  const byUser: Record<string, {
    user: typeof rawSessions[0]["user"];
    totalMin: number;
    breakMin: number;
    daysWorked: number;
    avgDailyMin: number;
    byDay: Record<string, { workedMin: number; breakMin: number; sessions: typeof enriched }>;
    sessions: typeof enriched;
    activeSession: typeof enriched[0] | null;
  }> = {};

  for (const s of enriched) {
    if (!byUser[s.userId]) {
      byUser[s.userId] = {
        user: s.user,
        totalMin: 0,
        breakMin: 0,
        daysWorked: 0,
        avgDailyMin: 0,
        byDay: {},
        sessions: [],
        activeSession: null,
      };
    }
    const u = byUser[s.userId];
    u.totalMin += s.workedMin;
    u.breakMin += s.breakMin;
    u.sessions.push(s);

    if (!u.byDay[s.date]) {
      u.byDay[s.date] = { workedMin: 0, breakMin: 0, sessions: [] };
      u.daysWorked++;
    }
    u.byDay[s.date].workedMin += s.workedMin;
    u.byDay[s.date].breakMin  += s.breakMin;
    u.byDay[s.date].sessions.push(s);

    if (s.status !== "ended") u.activeSession = s;
  }

  // Calculate averages
  for (const u of Object.values(byUser)) {
    u.avgDailyMin = u.daysWorked > 0 ? Math.round(u.totalMin / u.daysWorked) : 0;
  }

  return NextResponse.json({
    users: Object.values(byUser),
    sessions: enriched,
    dateRange,
    days,
  });
}
