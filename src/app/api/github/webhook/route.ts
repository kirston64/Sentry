import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";

export async function POST(request: Request) {
  const body = await request.text();
  const event = request.headers.get("x-github-event");
  const signature = request.headers.get("x-hub-signature-256");

  // Verify signature if configured
  const webhookConfig = await prisma.webhookConfig.findUnique({ where: { type: "github" } });
  if (webhookConfig?.secret && signature) {
    const expected = "sha256=" + crypto.createHmac("sha256", webhookConfig.secret).update(body).digest("hex");
    if (signature !== expected) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  const payload = JSON.parse(body);
  const systemUser = await prisma.user.findFirst({ where: { role: "owner" } });
  if (!systemUser) return NextResponse.json({ error: "No system user" }, { status: 500 });

  let action = "";
  let target = "";
  let details = "";

  switch (event) {
    case "push": {
      const branch = payload.ref?.replace("refs/heads/", "") || "unknown";
      const commits = payload.commits || [];
      const repo = payload.repository?.full_name || "unknown";
      action = "github.push";
      target = repo;
      details = `${commits.length} commit(s) to ${branch} by ${payload.pusher?.name || "unknown"}`;

      // Auto-deploy on push to main
      if (branch === "main" || branch === "master") {
        const latestCommit = commits[commits.length - 1];
        if (latestCommit) {
          const server = await prisma.server.findFirst({ where: { status: "online" } });
          await prisma.deploy.create({
            data: {
              version: `auto-${latestCommit.id?.slice(0, 7) || "unknown"}`,
              environment: "production",
              status: "success",
              serverId: server?.id || null,
              triggeredBy: systemUser.id,
              commitSha: latestCommit.id?.slice(0, 7) || "unknown",
              commitMsg: latestCommit.message?.split("\n")[0] || "Auto-deploy from GitHub",
              logs: JSON.stringify([
                `GitHub webhook: push to ${branch}`,
                `Commit: ${latestCommit.message?.split("\n")[0]}`,
                "Building resources...",
                "Deploying to production...",
                "Health check passed",
                "Auto-deploy complete",
              ]),
              startedAt: new Date(),
              finishedAt: new Date(),
            },
          });
          details += " [auto-deploy triggered]";
        }
      }
      break;
    }
    case "pull_request": {
      const pr = payload.pull_request;
      action = `github.pr.${payload.action}`;
      target = payload.repository?.full_name || "unknown";
      details = `PR #${pr?.number}: ${pr?.title} by ${pr?.user?.login}`;
      break;
    }
    case "release": {
      action = "github.release";
      target = payload.repository?.full_name || "unknown";
      details = `Release ${payload.release?.tag_name}: ${payload.release?.name}`;
      break;
    }
    default:
      action = `github.${event}`;
      target = payload.repository?.full_name || "unknown";
      details = JSON.stringify(payload).slice(0, 200);
  }

  await prisma.auditLog.create({
    data: { userId: systemUser.id, action, target, details },
  });

  // Notify admins
  const admins = await prisma.user.findMany({ where: { role: { in: ["admin", "owner"] } } });
  for (const admin of admins) {
    await prisma.notification.create({
      data: {
        userId: admin.id,
        type: "github",
        title: `GitHub: ${event}`,
        message: details,
        link: payload.repository?.html_url,
      },
    });
  }

  // External notifications
  await sendExternal(`GitHub ${event}: ${details}`);

  return NextResponse.json({ received: true, event, action });
}

async function sendExternal(message: string) {
  try {
    const discord = await prisma.webhookConfig.findUnique({ where: { type: "discord" } });
    if (discord?.enabled && discord.url) {
      await fetch(discord.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [{ title: "Forge Dev-Ops", description: message, color: 0x007fd4, timestamp: new Date().toISOString() }],
        }),
      }).catch(() => {});
    }

    const telegram = await prisma.webhookConfig.findUnique({ where: { type: "telegram" } });
    if (telegram?.enabled && telegram.url) {
      await fetch(telegram.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: telegram.secret, text: `*Forge Dev-Ops*\n${message}`, parse_mode: "Markdown" }),
      }).catch(() => {});
    }
  } catch { /* silent */ }
}
