import { createRequire } from "module";
const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const { randomBytes } = require("crypto");
const path = require("path");

const db = new Database(path.join(import.meta.dirname, "dev.db"));

const USERS = [
  { username: "darkside", password: "admin123", fullName: "Артём Козлов", role: "owner" },
  { username: "nightwolf", password: "dev123", fullName: "Максим Петров", role: "admin" },
  { username: "pixelcraft", password: "dev123", fullName: "Анна Смирнова", role: "developer" },
  { username: "codeviper", password: "dev123", fullName: "Дмитрий Иванов", role: "developer" },
  { username: "shadowlua", password: "dev123", fullName: "Кирилл Волков", role: "developer" },
  { username: "netrunner", password: "dev123", fullName: "Елена Морозова", role: "admin" },
  { username: "mapmaker", password: "dev123", fullName: "Олег Соколов", role: "developer" },
];

function cuid() {
  return "c" + randomBytes(12).toString("hex").slice(0, 24);
}

const upsert = db.prepare(`
  INSERT INTO User (id, username, password, fullName, role, createdAt, updatedAt)
  VALUES (@id, @username, @password, @fullName, @role, @now, @now)
  ON CONFLICT(username) DO UPDATE SET
    password = @password,
    fullName = @fullName,
    role = @role,
    updatedAt = @now
`);

console.log("Seeding users...\n");

for (const u of USERS) {
  const hash = bcrypt.hashSync(u.password, 10);
  const now = new Date().toISOString();
  upsert.run({ id: cuid(), username: u.username, password: hash, fullName: u.fullName, role: u.role, now });
  console.log(`  ${u.role.padEnd(10)} ${u.username} / ${u.password}`);
}

console.log("\nDone! Login with any of the above credentials.");
db.close();
