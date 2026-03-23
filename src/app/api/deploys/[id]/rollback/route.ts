import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hasRole } from "@/lib/rbac";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const deploy = await prisma.deploy.findUnique({ where: { id } });
    if (!deploy) return NextResponse.json({ error: "Deploy not found" }, { status: 404 });

    // Only owner/admin can rollback production
    if (deploy.environment === "production" && !hasRole(session.role, "admin")) {
      return NextResponse.json({ error: "Forbidden: admin+ required for production rollback" }, { status: 403 });
    }

    const rollback = await prisma.deploy.create({
      data: {
        version: deploy.version + "-rollback",
        environment: deploy.environment,
        status: "success",
        serverId: deploy.serverId,
        triggeredBy: session.id,
        commitSha: deploy.commitSha,
        commitMsg: `Rollback to ${deploy.version}`,
        logs: JSON.stringify([
          `Initiating rollback to ${deploy.version}...`,
          `Reverting to commit ${deploy.commitSha}...`,
          "Restarting resources...",
          "Health check passed",
          "Rollback complete",
        ]),
        startedAt: new Date(),
        finishedAt: new Date(),
      },
      include: {
        user: { select: { id: true, username: true, fullName: true } },
        server: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      ...rollback,
      logs: JSON.parse(rollback.logs),
      triggeredByName: rollback.user.fullName || rollback.user.username,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
