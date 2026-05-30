import { NextResponse } from "next/server";
import { generateSecret, generate, verify, generateURI } from "otplib";
import QRCode from "qrcode";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

const APP_NAME = "Forge Dashboard";

// GET — generate setup (secret + QR)
export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    const secret = generateSecret();
    const label = session.github_username ?? session.id;
    const otpauth = generateURI({ issuer: APP_NAME, label, secret });
    const qrDataUrl = await QRCode.toDataURL(otpauth);

    return NextResponse.json({ secret, qrDataUrl, otpauth });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

// POST — verify token & enable TOTP
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    const { secret, token } = await request.json();
    if (!secret || !token) return NextResponse.json({ error: "secret и token обязательны" }, { status: 400 });

    const result = await verify({ token: token.trim(), secret });
    if (!result || (typeof result === "object" && !result.valid)) {
      return NextResponse.json({ error: "Неверный код" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: session.id },
      data: { totpSecret: secret, totpEnabled: true },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

// DELETE — disable TOTP (requires current token)
export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

    const { token } = await request.json();

    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (!user?.totpEnabled || !user.totpSecret) {
      return NextResponse.json({ error: "TOTP не включён" }, { status: 400 });
    }

    if (token) {
      const result = await verify({ token: token.trim(), secret: user.totpSecret });
      const valid = result && (typeof result === "boolean" ? result : result.valid);
      if (!valid) return NextResponse.json({ error: "Неверный код" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: session.id },
      data: { totpSecret: null, totpEnabled: false },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
