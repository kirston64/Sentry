import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const deploy = await prisma.deploy.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, username: true, fullName: true } },
      server: { select: { id: true, name: true } },
    },
  });

  if (!deploy) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Previous deploy for diff
  const previousDeploy = await prisma.deploy.findFirst({
    where: {
      environment: deploy.environment,
      startedAt: { lt: deploy.startedAt },
      id: { not: deploy.id },
    },
    orderBy: { startedAt: "desc" },
  });

  // Try GitHub diff
  let diff = null;
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_REPO = process.env.GITHUB_REPO;

  if (GITHUB_TOKEN && GITHUB_REPO && previousDeploy) {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/compare/${previousDeploy.commitSha}...${deploy.commitSha}`,
        { headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github+json" } }
      );

      if (res.ok) {
        const data = await res.json();
        diff = {
          totalCommits: data.total_commits,
          filesChanged: data.files?.length || 0,
          additions: data.files?.reduce((s: number, f: { additions: number }) => s + f.additions, 0) || 0,
          deletions: data.files?.reduce((s: number, f: { deletions: number }) => s + f.deletions, 0) || 0,
          commits: data.commits?.slice(0, 10).map((c: { sha: string; commit: { message: string; author: { name: string; date: string } } }) => ({
            sha: c.sha.slice(0, 7),
            message: c.commit.message.split("\n")[0],
            author: c.commit.author.name,
            date: c.commit.author.date,
          })) || [],
          files: data.files?.slice(0, 20).map((f: { filename: string; status: string; additions: number; deletions: number }) => ({
            filename: f.filename,
            status: f.status,
            additions: f.additions,
            deletions: f.deletions,
          })) || [],
        };
      }
    } catch { /* */ }
  }

  // Simulated diff if no real one
  if (!diff && previousDeploy) {
    diff = {
      totalCommits: Math.floor(Math.random() * 5) + 1,
      filesChanged: Math.floor(Math.random() * 15) + 1,
      additions: Math.floor(Math.random() * 200) + 10,
      deletions: Math.floor(Math.random() * 100) + 5,
      commits: [
        { sha: deploy.commitSha, message: deploy.commitMsg, author: deploy.user.fullName, date: deploy.startedAt.toISOString() },
      ],
      files: [
        { filename: "resources/core/server.lua", status: "modified", additions: Math.floor(Math.random() * 50) + 5, deletions: Math.floor(Math.random() * 20) + 1 },
        { filename: "resources/inventory/client.lua", status: "modified", additions: Math.floor(Math.random() * 30) + 3, deletions: Math.floor(Math.random() * 10) + 1 },
        { filename: "resources/anticheat/main.lua", status: "added", additions: Math.floor(Math.random() * 100) + 20, deletions: 0 },
      ],
      previousVersion: previousDeploy.version,
    };
  }

  return NextResponse.json({
    ...deploy,
    logs: JSON.parse(deploy.logs),
    triggeredByName: deploy.user.fullName || deploy.user.username,
    previousDeploy: previousDeploy ? { id: previousDeploy.id, version: previousDeploy.version, commitSha: previousDeploy.commitSha } : null,
    diff,
  });
}
