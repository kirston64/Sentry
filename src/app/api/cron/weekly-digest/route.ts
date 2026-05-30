import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendMessage } from "@/lib/telegram";

const CRON_SECRET = process.env.CRON_SECRET;
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

export async function POST(request: Request) {
  // Verify cron secret
  const auth = request.headers.get("authorization");
  if (CRON_SECRET && auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  if (!ADMIN_CHAT_ID) {
    return NextResponse.json({ error: "TELEGRAM_ADMIN_CHAT_ID не настроен" }, { status: 500 });
  }

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [incidents, deploys, servers, tasks] = await Promise.all([
    prisma.incident.findMany({
      where: { createdAt: { gte: weekAgo } },
      select: { severity: true, status: true, createdAt: true, resolvedAt: true },
    }),
    prisma.deploy.findMany({
      where: { startedAt: { gte: weekAgo } },
      select: { status: true, environment: true },
    }),
    prisma.server.findMany({ select: { name: true, status: true } }),
    prisma.task.findMany({
      where: { updatedAt: { gte: weekAgo } },
      select: { status: true },
    }),
  ]);

  const p1 = incidents.filter((i) => i.severity === "P1").length;
  const p2 = incidents.filter((i) => i.severity === "P2").length;
  const resolved = incidents.filter((i) => i.status === "resolved").length;
  const open = incidents.filter((i) => i.status !== "resolved").length;

  const successDeploys = deploys.filter((d) => d.status === "success").length;
  const failedDeploys = deploys.filter((d) => d.status === "failed").length;
  const prodDeploys = deploys.filter((d) => d.environment === "production").length;

  const onlineServers = servers.filter((s) => s.status === "online").length;
  const offlineServers = servers.filter((s) => s.status === "offline").length;

  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;

  // MTTR for resolved
  const resolvedWithTime = incidents.filter((i) => i.resolvedAt);
  let mttrText = "—";
  if (resolvedWithTime.length > 0) {
    const avgMs = resolvedWithTime.reduce(
      (sum, i) => sum + (i.resolvedAt!.getTime() - i.createdAt.getTime()), 0
    ) / resolvedWithTime.length;
    const avgMin = Math.round(avgMs / 60000);
    mttrText = avgMin < 60 ? `${avgMin} мин` : `${Math.round(avgMin / 60)} ч`;
  }

  const dateStr = now.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });

  const text =
    `📊 <b>Недельный дайджест Forge</b>\n` +
    `<i>за 7 дней до ${dateStr}</i>\n\n` +
    `🔥 <b>Инциденты</b>\n` +
    `• Всего: ${incidents.length} (P1: ${p1}, P2: ${p2})\n` +
    `• Закрыто: ${resolved} | Открыто: ${open}\n` +
    `• Среднее время устранения: ${mttrText}\n\n` +
    `🚀 <b>Деплои</b>\n` +
    `• Успешно: ${successDeploys} | Провалено: ${failedDeploys}\n` +
    `• В прод: ${prodDeploys}\n\n` +
    `🖥 <b>Серверы</b>\n` +
    `• Online: ${onlineServers} | Offline: ${offlineServers}\n\n` +
    `✅ <b>Задачи</b>\n` +
    `• Выполнено: ${doneTasks} | В работе: ${inProgressTasks}`;

  await sendMessage(ADMIN_CHAT_ID, text);

  return NextResponse.json({ ok: true, sentAt: now.toISOString() });
}
