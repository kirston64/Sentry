import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasRole } from "@/lib/rbac";
import fs from "fs";
import path from "path";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const backups = await prisma.backup.findMany({
    include: {
      server: { select: { id: true, name: true } },
      creator: { select: { id: true, username: true, fullName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(backups);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(session.role, "admin")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { serverId, name, notes } = body;

  if (!name) return NextResponse.json({ error: "name обязателен" }, { status: 400 });

  const backup = await prisma.backup.create({
    data: {
      serverId: serverId ?? null,
      name,
      notes: notes ?? null,
      status: "pending",
      createdBy: session.id,
    },
    include: {
      server: { select: { id: true, name: true } },
      creator: { select: { id: true, username: true, fullName: true } },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.id,
      action: "CREATE_BACKUP",
      target: name,
      details: serverId ? `server: ${backup.server?.name}` : "manual",
    },
  });

  // Async: copy the SQLite file as a real backup
  setImmediate(async () => {
    try {
      const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
      const dbFile = dbUrl.replace(/^file:/, "");
      const dbPath = path.isAbsolute(dbFile)
        ? dbFile
        : path.resolve(process.cwd(), dbFile.startsWith("./") ? dbFile.slice(2) : dbFile);

      if (!dbPath.endsWith(".db") || !fs.existsSync(dbPath)) throw new Error("DB file not found");

      const backupsDir = path.join(process.cwd(), "backups");
      fs.mkdirSync(backupsDir, { recursive: true });

      const filename = `backup-${backup.id}.db`;
      const destPath = path.join(backupsDir, filename);
      fs.copyFileSync(dbPath, destPath);

      const stat = fs.statSync(destPath);
      await prisma.backup.update({
        where: { id: backup.id },
        data: { status: "success", size: stat.size, path: destPath, finishedAt: new Date() },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown error";
      await prisma.backup.update({
        where: { id: backup.id },
        data: { status: "failed", finishedAt: new Date(), notes: `Error: ${msg}` },
      }).catch(() => {});
    }
  });

  return NextResponse.json(backup);
}
