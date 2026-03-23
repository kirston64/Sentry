-- AlterTable
ALTER TABLE "Session" ADD COLUMN "ip" TEXT;
ALTER TABLE "Session" ADD COLUMN "userAgent" TEXT;

-- CreateTable
CREATE TABLE "TrustedDevice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "label" TEXT,
    "lastUsedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TrustedDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DeviceLoginCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "deviceLabel" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approvedBy" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeviceLoginCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Server" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "port" INTEGER NOT NULL DEFAULT 30120,
    "maxPlayers" INTEGER NOT NULL DEFAULT 128,
    "status" TEXT NOT NULL DEFAULT 'offline',
    "gameMode" TEXT NOT NULL DEFAULT 'Roleplay',
    "mapName" TEXT NOT NULL DEFAULT 'Los Santos',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ServerMetrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serverId" TEXT NOT NULL,
    "playersOnline" INTEGER NOT NULL DEFAULT 0,
    "cpuPercent" REAL NOT NULL DEFAULT 0,
    "ramPercent" REAL NOT NULL DEFAULT 0,
    "uptimeSeconds" INTEGER NOT NULL DEFAULT 0,
    "tickRate" INTEGER NOT NULL DEFAULT 64,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ServerMetrics_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'investigating',
    "assigneeId" TEXT,
    "creatorId" TEXT NOT NULL,
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Incident_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Incident_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IncidentEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "incidentId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IncidentEvent_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "IncidentEvent_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Postmortem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "incidentId" TEXT NOT NULL,
    "whatBroke" TEXT NOT NULL,
    "rootCause" TEXT NOT NULL,
    "fix" TEXT NOT NULL,
    "prevention" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Postmortem_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Deploy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "version" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "serverId" TEXT,
    "triggeredBy" TEXT NOT NULL,
    "commitSha" TEXT NOT NULL,
    "commitMsg" TEXT NOT NULL,
    "logs" TEXT NOT NULL DEFAULT '[]',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME,
    CONSTRAINT "Deploy_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Deploy_triggeredBy_fkey" FOREIGN KEY ("triggeredBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "assigneeId" TEXT,
    "creatorId" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'todo',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "incidentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Task_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LogEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "serverId" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'info',
    "source" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LogEntry_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'developer',
    "avatar" TEXT,
    "bio" TEXT,
    "timezone" TEXT,
    "discord" TEXT,
    "telegram" TEXT,
    "github" TEXT,
    "passwordChangedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("avatar", "createdAt", "fullName", "id", "password", "role", "updatedAt", "username") SELECT "avatar", "createdAt", "fullName", "id", "password", "role", "updatedAt", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "TrustedDevice_userId_fingerprint_key" ON "TrustedDevice"("userId", "fingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "Postmortem_incidentId_key" ON "Postmortem"("incidentId");
