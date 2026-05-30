import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendMessage } from "@/lib/telegram";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Client } from "ssh2";
import { decryptPassword } from "@/lib/ssh-collect";

const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

interface TGMessage {
  message_id: number;
  from: { id: number; username?: string; first_name: string };
  chat: { id: number };
  text?: string;
}

interface TGUpdate {
  message?: TGMessage;
}

export async function POST(request: Request) {
  try {
    const update: TGUpdate = await request.json();
    const msg = update.message;
    if (!msg?.text) return NextResponse.json({ ok: true });

    const chatId = msg.chat.id;
    const text = msg.text.trim();
    const parts = text.split(/\s+/);
    const command = parts[0].toLowerCase();

    // /start is handled further down with full command list

    // /me — show linked account
    if (command === "/me") {
      const user = await prisma.user.findFirst({
        where: { telegramChatId: String(chatId) },
        select: { username: true, fullName: true, role: true },
      });
      if (user) {
        await sendMessage(chatId,
          `✅ Аккаунт привязан\n\n👤 ${user.fullName} (<code>${user.username}</code>)\nРоль: ${user.role}`
        );
      } else {
        await sendMessage(chatId, `❌ Telegram не привязан ни к одному аккаунту.\n\nИспользуй: <code>/link username пароль</code>`);
      }
      return NextResponse.json({ ok: true });
    }

    // /link username password — link telegram to account
    if (command === "/link") {
      if (parts.length < 3) {
        await sendMessage(chatId, `❌ Использование: <code>/link username пароль</code>`);
        return NextResponse.json({ ok: true });
      }
      const [, username, password] = parts;
      const user = await prisma.user.findUnique({ where: { username } });
      if (!user) {
        await sendMessage(chatId, `❌ Пользователь не найден.`);
        return NextResponse.json({ ok: true });
      }
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        await sendMessage(chatId, `❌ Неверный пароль.`);
        return NextResponse.json({ ok: true });
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { telegramChatId: String(chatId) },
      });
      await sendMessage(chatId,
        `✅ Telegram привязан к аккаунту <code>${username}</code>!\n\n` +
        `Теперь при входе коды будут приходить сюда.`
      );
      return NextResponse.json({ ok: true });
    }

    // /otp username — generate OTP for user (admin/owner only)
    if (command === "/otp") {
      // Check if requester is admin/owner
      const requester = await prisma.user.findFirst({
        where: { telegramChatId: String(chatId) },
      });
      if (!requester || (requester.role !== "owner" && requester.role !== "admin")) {
        // Also allow if it's the admin chat
        if (String(chatId) !== ADMIN_CHAT_ID) {
          await sendMessage(chatId, `❌ Нет доступа. Только admin и owner могут генерировать коды.`);
          return NextResponse.json({ ok: true });
        }
      }

      if (parts.length < 2) {
        await sendMessage(chatId, `❌ Использование: <code>/otp username</code>`);
        return NextResponse.json({ ok: true });
      }

      const targetUsername = parts[1];
      const targetUser = await prisma.user.findUnique({ where: { username: targetUsername } });
      if (!targetUser) {
        await sendMessage(chatId, `❌ Пользователь <code>${targetUsername}</code> не найден.`);
        return NextResponse.json({ ok: true });
      }

      // Invalidate old OTPs
      await prisma.loginOTP.updateMany({
        where: { userId: targetUser.id, used: false },
        data: { used: true },
      });

      const code = generateOTP();
      await prisma.loginOTP.create({
        data: {
          userId: targetUser.id,
          code,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        },
      });

      await sendMessage(chatId,
        `🔐 <b>Код входа для ${targetUser.fullName}</b>\n\n` +
        `Пользователь: <code>${targetUsername}</code>\n` +
        `Код: <b><code>${code}</code></b>\n\n` +
        `⏱ Действует 5 минут.`
      );

      // If user has their own Telegram, send there too
      if (targetUser.telegramChatId && targetUser.telegramChatId !== String(chatId)) {
        await sendMessage(targetUser.telegramChatId,
          `🔐 <b>Ваш код входа в Forge</b>\n\n` +
          `Код: <b><code>${code}</code></b>\n\n` +
          `⏱ Действует 5 минут. Никому не передавайте.`
        );
      }

      return NextResponse.json({ ok: true });
    }

    // /status — server statuses
    if (command === "/status") {
      const requester = await prisma.user.findFirst({ where: { telegramChatId: String(chatId) } });
      if (!requester) {
        await sendMessage(chatId, `❌ Привяжи аккаунт через /link username пароль`);
        return NextResponse.json({ ok: true });
      }
      const servers = await prisma.server.findMany({
        select: { name: true, status: true },
        orderBy: { name: "asc" },
      });
      const statusEmoji: Record<string, string> = { online: "🟢", offline: "🔴", restarting: "🟡" };
      const lines = servers.map((s) => `${statusEmoji[s.status] || "⚪"} ${s.name} — ${s.status}`);
      await sendMessage(chatId,
        `🖥 <b>Статус серверов</b>\n\n${lines.join("\n") || "Серверы не найдены"}`
      );
      return NextResponse.json({ ok: true });
    }

    // /oncall — who is on call now
    if (command === "/oncall") {
      const requester = await prisma.user.findFirst({ where: { telegramChatId: String(chatId) } });
      if (!requester) {
        await sendMessage(chatId, `❌ Привяжи аккаунт через /link username пароль`);
        return NextResponse.json({ ok: true });
      }
      const now = new Date();
      const current = await prisma.onCallAssignment.findFirst({
        where: { startAt: { lte: now }, endAt: { gte: now } },
        include: { user: { select: { fullName: true, username: true, telegramChatId: true } } },
        orderBy: { startAt: "desc" },
      });
      if (!current) {
        await sendMessage(chatId, `📵 Сейчас никто не дежурит`);
      } else {
        const u = current.user;
        const tg = u.telegramChatId ? `@tg:${u.telegramChatId}` : "Telegram не привязан";
        const until = current.endAt.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
        await sendMessage(chatId,
          `📞 <b>Сейчас дежурит</b>\n\n` +
          `👤 ${u.fullName || u.username}\n` +
          `🔚 До: ${until}\n` +
          `${current.note ? `📝 ${current.note}` : ""}`
        );
      }
      return NextResponse.json({ ok: true });
    }

    // /incident list — open incidents
    if (command === "/incident" && parts[1] === "list") {
      const requester = await prisma.user.findFirst({ where: { telegramChatId: String(chatId) } });
      if (!requester) {
        await sendMessage(chatId, `❌ Привяжи аккаунт через /link username пароль`);
        return NextResponse.json({ ok: true });
      }
      const open = await prisma.incident.findMany({
        where: { status: { not: "resolved" } },
        select: { title: true, severity: true, status: true, createdAt: true },
        orderBy: [{ severity: "asc" }, { createdAt: "desc" }],
        take: 10,
      });
      if (open.length === 0) {
        await sendMessage(chatId, `✅ Открытых инцидентов нет`);
      } else {
        const sevEmoji: Record<string, string> = { P1: "🔴", P2: "🟠", P3: "🟡", P4: "🔵" };
        const lines = open.map((i) =>
          `${sevEmoji[i.severity] || "⚪"} <b>${i.severity}</b> — ${i.title} <i>(${i.status})</i>`
        );
        await sendMessage(chatId,
          `🚨 <b>Открытые инциденты (${open.length})</b>\n\n${lines.join("\n")}`
        );
      }
      return NextResponse.json({ ok: true });
    }

    // /restart <server-name> — SSH restart via systemctl (admin/owner only)
    if (command === "/restart") {
      const requester = await prisma.user.findFirst({ where: { telegramChatId: String(chatId) } });
      if (!requester || (requester.role !== "owner" && requester.role !== "admin")) {
        await sendMessage(chatId, `❌ Нет доступа. Только admin и owner могут перезапускать серверы.`);
        return NextResponse.json({ ok: true });
      }
      if (parts.length < 2) {
        const servers = await prisma.server.findMany({ select: { name: true }, orderBy: { name: "asc" } });
        const names = servers.map((s) => `• <code>/restart ${s.name}</code>`).join("\n");
        await sendMessage(chatId, `❌ Укажи имя сервера:\n${names || "Серверов нет"}`);
        return NextResponse.json({ ok: true });
      }
      const serverName = parts.slice(1).join(" ");
      const server = await prisma.server.findFirst({
        where: { name: { contains: serverName } },
        select: { id: true, name: true, ip: true, port: true, sshUser: true, sshPassword: true, type: true },
      });
      if (!server) {
        await sendMessage(chatId, `❌ Сервер «${serverName}» не найден.`);
        return NextResponse.json({ ok: true });
      }
      if (!server.sshUser || !server.sshPassword) {
        await sendMessage(chatId, `❌ SSH не настроен для сервера «${server.name}».`);
        return NextResponse.json({ ok: true });
      }
      await sendMessage(chatId, `🔄 Перезапускаю <b>${server.name}</b>...`);
      try {
        await sshExecRestart(server.ip, server.port, server.sshUser, server.sshPassword, server.type);
        await prisma.server.update({ where: { id: server.id }, data: { status: "restarting" } });
        await prisma.auditLog.create({
          data: { userId: requester.id, action: "server.restart", target: server.name, details: "via Telegram" },
        });
        await sendMessage(chatId, `✅ Сервер <b>${server.name}</b> перезапускается.\nОбычно занимает 30–60 секунд.`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "SSH ошибка";
        await sendMessage(chatId, `❌ Ошибка перезапуска: ${msg}`);
      }
      return NextResponse.json({ ok: true });
    }

    // /alert list — configured alert thresholds
    if (command === "/alert" && parts[1] === "list") {
      const requester = await prisma.user.findFirst({ where: { telegramChatId: String(chatId) } });
      if (!requester) {
        await sendMessage(chatId, `❌ Привяжи аккаунт через /link username пароль`);
        return NextResponse.json({ ok: true });
      }
      const thresholds = await prisma.alertThreshold.findMany({
        include: { server: { select: { name: true } } },
      });
      if (thresholds.length === 0) {
        await sendMessage(chatId, `ℹ️ Пороги алертов не настроены. Настрой в Settings → Alert Thresholds.`);
      } else {
        const lines = thresholds.map((t) => {
          const parts: string[] = [];
          if (t.cpuPercent !== null) parts.push(`CPU>${t.cpuPercent}%`);
          if (t.ramPercent !== null) parts.push(`RAM>${t.ramPercent}%`);
          if (t.diskPercent !== null) parts.push(`Disk>${t.diskPercent}%`);
          if (t.playersOnline !== null) parts.push(`Players>${t.playersOnline}`);
          return `🖥 <b>${t.server.name}</b>: ${parts.join(", ")} (кулдаун ${t.cooldownMin}мин)`;
        });
        await sendMessage(chatId, `⚠️ <b>Пороги алертов</b>\n\n${lines.join("\n")}`);
      }
      return NextResponse.json({ ok: true });
    }

    // /incident create <P1|P2|P3|P4> <title...> — create incident
    if (command === "/incident" && parts[1] === "create") {
      const requester = await prisma.user.findFirst({ where: { telegramChatId: String(chatId) } });
      if (!requester) {
        await sendMessage(chatId, `❌ Привяжи аккаунт через /link username пароль`);
        return NextResponse.json({ ok: true });
      }
      const severity = (parts[2] || "").toUpperCase();
      if (!["P1", "P2", "P3", "P4"].includes(severity)) {
        await sendMessage(chatId, `❌ Использование: <code>/incident create P1|P2|P3|P4 описание</code>`);
        return NextResponse.json({ ok: true });
      }
      const title = parts.slice(3).join(" ").trim();
      if (!title) {
        await sendMessage(chatId, `❌ Укажи описание инцидента после серьёзности.`);
        return NextResponse.json({ ok: true });
      }
      await prisma.incident.create({
        data: {
          title,
          severity,
          status: "investigating",
          creatorId: requester.id,
          timeline: { create: { message: `Инцидент создан через Telegram`, authorId: requester.id } },
        },
      });
      await prisma.auditLog.create({
        data: { userId: requester.id, action: "incident.create", target: title, details: severity },
      });
      const sevEmoji: Record<string, string> = { P1: "🔴", P2: "🟠", P3: "🟡", P4: "🔵" };
      await sendMessage(chatId, `${sevEmoji[severity]} Инцидент <b>${severity}</b> создан:\n<b>${title}</b>`);
      return NextResponse.json({ ok: true });
    }

    // Update /start help
    if (command === "/start") {
      await sendMessage(chatId,
        `👋 <b>Forge DevOps Bot</b>\n\n` +
        `Команды:\n` +
        `• <code>/link username пароль</code> — привязать аккаунт\n` +
        `• <code>/me</code> — показать привязанный аккаунт\n` +
        `• <code>/status</code> — статус серверов\n` +
        `• <code>/oncall</code> — кто сейчас дежурит\n` +
        `• <code>/incident list</code> — открытые инциденты\n` +
        `• <code>/incident create P1 описание</code> — создать инцидент\n` +
        `• <code>/restart имя-сервера</code> — перезапустить сервер (admin/owner)\n` +
        `• <code>/alert list</code> — пороги алертов\n` +
        `• <code>/otp username</code> — создать код входа (admin/owner)`
      );
      return NextResponse.json({ ok: true });
    }

    // Unknown command
    await sendMessage(chatId, `❓ Неизвестная команда. Отправь /start для помощи.`);
    return NextResponse.json({ ok: true });

  } catch (e) {
    console.error("Telegram webhook error:", e);
    return NextResponse.json({ ok: true });
  }
}

function sshExecRestart(ip: string, port: number, sshUser: string, sshPasswordEncrypted: string, serverType: string): Promise<void> {
  const password = decryptPassword(sshPasswordEncrypted);
  const cmd = serverType === "game"
    ? "systemctl restart fivem 2>/dev/null || systemctl restart fxserver 2>/dev/null || service fivem restart 2>/dev/null || true"
    : "reboot";

  return new Promise((resolve, reject) => {
    const client = new Client();
    const timeout = setTimeout(() => { client.destroy(); reject(new Error("SSH timeout")); }, 10000);

    client.on("ready", () => {
      client.exec(cmd, (err, stream) => {
        if (err) { clearTimeout(timeout); client.end(); reject(err); return; }
        stream.on("close", () => { clearTimeout(timeout); client.end(); resolve(); });
        stream.stderr.on("data", () => {});
      });
    });

    client.on("error", (e) => { clearTimeout(timeout); reject(e); });
    client.connect({ host: ip, port, username: sshUser, password, readyTimeout: 8000 });
  });
}
