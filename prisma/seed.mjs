import { createRequire } from "module";
const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const { randomBytes } = require("crypto");
const path = require("path");

const dbPath = process.env.DATABASE_URL
  ? process.env.DATABASE_URL.replace("file:", "")
  : path.join(import.meta.dirname, "dev.db");

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

function cuid() {
  return "c" + randomBytes(12).toString("hex").slice(0, 24);
}

const now = new Date().toISOString();

// ============ INITIAL OWNER ACCOUNT ============
// Change the password after first login via Settings > Profile

const OWNER_USERNAME = process.env.SEED_OWNER_USERNAME || "admin";
const OWNER_PASSWORD = process.env.SEED_OWNER_PASSWORD || "changeme123";
const OWNER_FULLNAME = process.env.SEED_OWNER_FULLNAME || "Administrator";

const upsertUser = db.prepare(`
  INSERT INTO User (id, username, password, fullName, role, passwordChangedAt, createdAt, updatedAt)
  VALUES (@id, @username, @password, @fullName, @role, @now, @now, @now)
  ON CONFLICT(username) DO NOTHING
`);

const existingOwner = db.prepare("SELECT id FROM User WHERE role = 'owner' LIMIT 1").get();

if (existingOwner) {
  console.log("Owner account already exists — skipping seed.");
} else {
  const hash = bcrypt.hashSync(OWNER_PASSWORD, 10);
  upsertUser.run({
    id: cuid(),
    username: OWNER_USERNAME,
    password: hash,
    fullName: OWNER_FULLNAME,
    role: "owner",
    now,
  });
  console.log(`Created owner account: ${OWNER_USERNAME} / ${OWNER_PASSWORD}`);
  console.log("IMPORTANT: Change this password immediately after first login!");
}

db.close();
