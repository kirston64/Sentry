import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Users can change their own password; owner/admin can change anyone's
  const canEdit = session.id === id || session.role === "owner" || session.role === "admin";
  if (!canEdit) return NextResponse.json({ error: "Недостаточно прав" }, { status: 403 });

  try {
    const body = await req.json();
    const updates: Record<string, unknown> = {};

    if (body.fullName) updates.fullName = body.fullName.trim();
    if (body.role && session.role === "owner") updates.role = body.role;

    if (body.password) {
      if (body.password.length < 6) {
        return NextResponse.json({ error: "Пароль минимум 6 символов" }, { status: 400 });
      }
      updates.password = await bcrypt.hash(body.password, 12);
      updates.passwordChangedAt = new Date();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Нечего обновлять" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: updates,
      select: { id: true, username: true, fullName: true, role: true },
    });

    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
