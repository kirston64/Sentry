-- AlterTable: add apiKey, lastSeenAt, type to Server
ALTER TABLE "Server" ADD COLUMN "apiKey" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Server" ADD COLUMN "lastSeenAt" DATETIME;
ALTER TABLE "Server" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'game';

-- Create unique index on apiKey
CREATE UNIQUE INDEX "Server_apiKey_key" ON "Server"("apiKey");
