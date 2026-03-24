import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendMessage } from "@/lib/telegram";
import bcrypt from "bcryptjs";
import crypto from "crypto";

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

    // /start — show help
    if (command === "/start") {
      await sendMessage(chatId,
        `👋 <b>Sentry DevOps Bot</b>\n\n` +
        `Команды:\n` +
        `• <code>/link username пароль</code> — привязать Telegram к аккаунту\n` +
        `• <code>/otp username</code> — создать код входа (только для admin/owner)\n` +
        `• <code>/me</code> — показать привязанный аккаунт`
      );
      return NextResponse.json({ ok: true });
    }

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
          `🔐 <b>Ваш код входа в Sentry</b>\n\n` +
          `Код: <b><code>${code}</code></b>\n\n` +
          `⏱ Действует 5 минут. Никому не передавайте.`
        );
      }

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
