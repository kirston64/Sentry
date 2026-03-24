const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

export function isTelegramConfigured() {
  return !!(BOT_TOKEN && ADMIN_CHAT_ID);
}

async function tgFetch(method: string, body: object) {
  if (!BOT_TOKEN) return null;
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function sendMessage(chatId: string | number, text: string) {
  return tgFetch("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
  });
}

export async function sendOTPToUser(
  username: string,
  code: string,
  userChatId?: string | null
) {
  const text =
    `🔐 <b>Код входа в Sentry</b>\n\n` +
    `Пользователь: <code>${username}</code>\n` +
    `Код: <b><code>${code}</code></b>\n\n` +
    `⏱ Действует 5 минут. Никому не передавайте.`;

  const promises: Promise<unknown>[] = [];

  // Send to user's own Telegram if linked
  if (userChatId) {
    promises.push(sendMessage(userChatId, text));
  }

  // Always notify admin chat
  if (ADMIN_CHAT_ID) {
    const adminText = userChatId
      ? `ℹ️ OTP отправлен пользователю <code>${username}</code>`
      : `🔐 <b>OTP для ${username}</b>\n\nКод: <b><code>${code}</code></b>\n\n⏱ Действует 5 минут.\n<i>У пользователя не привязан Telegram — передайте код лично.</i>`;
    promises.push(sendMessage(ADMIN_CHAT_ID, adminText));
  }

  await Promise.allSettled(promises);
}

export async function setWebhook(url: string) {
  return tgFetch("setWebhook", { url, drop_pending_updates: true });
}

export async function deleteWebhook() {
  return tgFetch("deleteWebhook", {});
}
