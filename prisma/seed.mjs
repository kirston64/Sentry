import { createRequire } from "module";
const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const { randomBytes } = require("crypto");
const path = require("path");

const db = new Database(path.join(import.meta.dirname, "dev.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

function cuid() {
  return "c" + randomBytes(12).toString("hex").slice(0, 24);
}

const now = new Date().toISOString();
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

// ============ USERS ============

const USERS = [
  { id: "user-darkside",  username: "darkside",  password: "admin123", fullName: "Артём Козлов",   role: "owner",     bio: "Основатель и лид-разработчик Sentry RP. 5 лет опыта в FiveM разработке.", timezone: "UTC+3 Москва",          discord: "DarkSide#0001",  telegram: "@darkside_dev",    github: "darkside-dev" },
  { id: "user-nightwolf", username: "nightwolf", password: "dev123",   fullName: "Максим Петров",   role: "admin",     bio: "Специализируюсь на синхронизации транспорта и античит-системах.",          timezone: "UTC+3 Москва",          discord: "NightWolf#1337", telegram: "@nightwolf_fivem", github: "nightwolf-sync" },
  { id: "user-pixelcraft", username: "pixelcraft", password: "dev123",  fullName: "Анна Смирнова",   role: "developer", bio: "UI/UX дизайнер и фронтенд-разработчик. Делаю все NUI интерфейсы.",        timezone: "UTC+3 Санкт-Петербург", discord: "PixelCraft#4242", telegram: "@pixel_craft_ui",  github: "pixelcraft-nui" },
  { id: "user-codeviper", username: "codeviper", password: "dev123",   fullName: "Дмитрий Иванов",  role: "developer", bio: "DBA и бэкенд-разработчик. Оптимизирую запросы MySQL.",                    timezone: "UTC+5 Екатеринбург",    discord: "CodeViper#7890", telegram: "@codeviper_db",    github: "codeviper-sql" },
  { id: "user-shadowlua", username: "shadowlua", password: "dev123",   fullName: "Кирилл Волков",   role: "developer", bio: "Геймплей-программист. Пишу системы NPC, торговли, крафта и квестов.",      timezone: "UTC+3 Москва",          discord: "ShadowLua#5555", telegram: "@shadow_lua",      github: "shadowlua-scripts" },
  { id: "user-netrunner", username: "netrunner", password: "dev123",   fullName: "Елена Морозова",  role: "admin",     bio: "Системный администратор и сетевик. Настраиваю сервера и DDoS-защиту.",   timezone: "UTC+3 Москва",          discord: "NetRunner#9999", telegram: "@netrunner_ops",   github: "netrunner-infra" },
  { id: "user-mapmaker",  username: "mapmaker",  password: "dev123",   fullName: "Олег Соколов",    role: "developer", bio: "3D-художник и маппер. Создаю интерьеры и кастомные здания.",              timezone: "UTC+7 Новосибирск",     discord: "MapMaker#3210",  telegram: "@mapmaker_3d",     github: "mapmaker-models" },
];

const upsertUser = db.prepare(`
  INSERT INTO User (id, username, password, fullName, role, bio, timezone, discord, telegram, github, passwordChangedAt, createdAt, updatedAt)
  VALUES (@id, @username, @password, @fullName, @role, @bio, @timezone, @discord, @telegram, @github, @passwordChangedAt, @now, @now)
  ON CONFLICT(username) DO UPDATE SET
    password = @password, fullName = @fullName, role = @role, bio = @bio, timezone = @timezone,
    discord = @discord, telegram = @telegram, github = @github, passwordChangedAt = @passwordChangedAt, updatedAt = @now
`);

console.log("Seeding users...");
for (const u of USERS) {
  const hash = bcrypt.hashSync(u.password, 10);
  upsertUser.run({ ...u, password: hash, passwordChangedAt: now, now });
  console.log(`  ${u.role.padEnd(10)} ${u.username} / ${u.password}`);
}

// ============ SERVERS ============

const SERVERS = [
  { id: "srv-1", name: "Sentry RP #1",       ip: "185.71.66.101", port: 30120, maxPlayers: 128, status: "online",  gameMode: "Roleplay",    mapName: "Los Santos" },
  { id: "srv-2", name: "Sentry RP #2 Dev",   ip: "185.71.66.102", port: 30120, maxPlayers: 32,  status: "online",  gameMode: "Development", mapName: "Los Santos" },
  { id: "srv-3", name: "Sentry RP #3 Event", ip: "185.71.66.103", port: 30120, maxPlayers: 64,  status: "offline", gameMode: "Event",       mapName: "Cayo Perico" },
];

const insertServer = db.prepare(`
  INSERT OR REPLACE INTO Server (id, name, ip, port, maxPlayers, status, gameMode, mapName, createdAt, updatedAt)
  VALUES (@id, @name, @ip, @port, @maxPlayers, @status, @gameMode, @mapName, @now, @now)
`);

console.log("\nSeeding servers...");
for (const s of SERVERS) {
  insertServer.run({ ...s, now });
  console.log(`  ${s.status.padEnd(10)} ${s.name}`);
}

// ============ SERVER METRICS ============

const insertMetrics = db.prepare(`
  INSERT INTO ServerMetrics (id, serverId, playersOnline, cpuPercent, ramPercent, uptimeSeconds, tickRate, createdAt)
  VALUES (@id, @serverId, @playersOnline, @cpuPercent, @ramPercent, @uptimeSeconds, @tickRate, @createdAt)
`);

console.log("\nSeeding metrics (24h history)...");
const METRICS_BASE = {
  "srv-1": { players: [12,8,5,3,4,6,14,28,45,62,71,78,82,76,68,72,80,91,105,118,124,112,87,54], cpu: 67, ram: 72, uptime: 259200, tick: 64 },
  "srv-2": { players: [2,1,1,0,0,1,2,4,6,8,7,6,5,4,3,5,7,8,6,5,4,3,2,1], cpu: 23, ram: 34, uptime: 86400, tick: 64 },
  "srv-3": { players: Array(24).fill(0), cpu: 0, ram: 0, uptime: 0, tick: 0 },
};

for (const [serverId, base] of Object.entries(METRICS_BASE)) {
  for (let h = 0; h < 24; h++) {
    const ts = new Date(Date.now() - (23 - h) * 3600_000).toISOString();
    const p = base.players[h];
    const cpuJitter = base.cpu > 0 ? base.cpu + Math.floor(Math.random() * 10 - 5) : 0;
    const ramJitter = base.ram > 0 ? base.ram + Math.floor(Math.random() * 6 - 3) : 0;
    insertMetrics.run({
      id: cuid(), serverId,
      playersOnline: p,
      cpuPercent: Math.max(0, Math.min(100, cpuJitter)),
      ramPercent: Math.max(0, Math.min(100, ramJitter)),
      uptimeSeconds: base.uptime + h * 3600,
      tickRate: base.tick,
      createdAt: ts,
    });
  }
}

// ============ INCIDENTS ============

const insertIncident = db.prepare(`
  INSERT OR REPLACE INTO Incident (id, title, severity, status, assigneeId, creatorId, resolvedAt, createdAt, updatedAt)
  VALUES (@id, @title, @severity, @status, @assigneeId, @creatorId, @resolvedAt, @createdAt, @now)
`);

const insertIncidentEvent = db.prepare(`
  INSERT INTO IncidentEvent (id, incidentId, message, authorId, createdAt)
  VALUES (@id, @incidentId, @message, @authorId, @createdAt)
`);

const insertPostmortem = db.prepare(`
  INSERT OR REPLACE INTO Postmortem (id, incidentId, whatBroke, rootCause, fix, prevention, authorId, createdAt, updatedAt)
  VALUES (@id, @incidentId, @whatBroke, @rootCause, @fix, @prevention, @authorId, @now, @now)
`);

console.log("\nSeeding incidents...");

const INCIDENTS = [
  {
    id: "inc-1", title: "Массовый desync на сервере #1", severity: "P1", status: "resolved",
    assigneeId: "user-nightwolf", creatorId: "user-darkside",
    resolvedAt: "2026-03-21T01:30:00Z", createdAt: "2026-03-20T22:00:00Z",
    events: [
      { message: "Получены массовые жалобы на desync от игроков", authorId: "user-darkside", createdAt: "2026-03-20T22:00:00Z" },
      { message: "Подтверждено: sync rate упал до 12 tick/s при 100+ игроках", authorId: "user-nightwolf", createdAt: "2026-03-20T22:15:00Z" },
      { message: "Найдена причина: утечка памяти в vehicle sync после v2.12.0", authorId: "user-nightwolf", createdAt: "2026-03-20T23:00:00Z" },
      { message: "Хотфикс задеплоен, tick rate восстановлен до 64", authorId: "user-nightwolf", createdAt: "2026-03-21T00:30:00Z" },
      { message: "Мониторинг стабилен 1 час, инцидент закрыт", authorId: "user-darkside", createdAt: "2026-03-21T01:30:00Z" },
    ],
    postmortem: {
      whatBroke: "Синхронизация транспорта на сервере #1 при 100+ игроках. Tick rate упал с 64 до 12.",
      rootCause: "Утечка памяти в модуле vehicle sync, введённая в v2.12.0.",
      fix: "Хотфикс: добавлен корректный dispose для sync буферов. Развёрнут как v2.12.1.",
      prevention: "Добавлен нагрузочный тест на 128 игроков в CI pipeline.",
      authorId: "user-nightwolf",
    },
  },
  {
    id: "inc-2", title: "Дюп предметов через trade window", severity: "P1", status: "resolved",
    assigneeId: "user-nightwolf", creatorId: "user-netrunner",
    resolvedAt: "2026-03-19T18:00:00Z", createdAt: "2026-03-19T16:00:00Z",
    events: [
      { message: "Модератор обнаружил дюп через быстрый trade cancel", authorId: "user-netrunner", createdAt: "2026-03-19T16:00:00Z" },
      { message: "Trade система временно отключена", authorId: "user-darkside", createdAt: "2026-03-19T16:30:00Z" },
      { message: "Фикс: добавлена серверная валидация trade-lock", authorId: "user-nightwolf", createdAt: "2026-03-19T17:30:00Z" },
      { message: "Trade система включена, дюп невозможен", authorId: "user-darkside", createdAt: "2026-03-19T18:00:00Z" },
    ],
    postmortem: {
      whatBroke: "Система обмена предметами позволяла дюпать через быстрый cancel trade.",
      rootCause: "Race condition: клиент мог отменить trade после серверного подтверждения.",
      fix: "Добавлен серверный trade-lock с mutex. Операции обмена теперь атомарные.",
      prevention: "Все экономические операции обёрнуты в серверные транзакции с lock.",
      authorId: "user-nightwolf",
    },
  },
  {
    id: "inc-3", title: "Сервер #3 не запускается после обновления", severity: "P2", status: "monitoring",
    assigneeId: "user-darkside", creatorId: "user-darkside",
    resolvedAt: null, createdAt: "2026-03-22T08:00:00Z",
    events: [
      { message: "Event сервер не стартует, ошибка в ox_inventory", authorId: "user-darkside", createdAt: "2026-03-22T08:00:00Z" },
      { message: "Причина: несовместимость версии ox_lib", authorId: "user-shadowlua", createdAt: "2026-03-22T09:00:00Z" },
      { message: "Откат ox_lib до v3.2.0, сервер запущен", authorId: "user-darkside", createdAt: "2026-03-22T10:00:00Z" },
    ],
  },
  {
    id: "inc-4", title: "Высокая задержка БД (>500ms)", severity: "P3", status: "resolved",
    assigneeId: "user-codeviper", creatorId: "user-codeviper",
    resolvedAt: "2026-03-18T16:00:00Z", createdAt: "2026-03-18T14:00:00Z",
    events: [
      { message: "Мониторинг показывает query time >500ms", authorId: "user-codeviper", createdAt: "2026-03-18T14:00:00Z" },
      { message: "Найден missing index на таблице player_inventory", authorId: "user-codeviper", createdAt: "2026-03-18T15:00:00Z" },
      { message: "Index добавлен, query time <10ms", authorId: "user-codeviper", createdAt: "2026-03-18T16:00:00Z" },
    ],
  },
  {
    id: "inc-5", title: "Discord webhook не отправляет логи", severity: "P4", status: "resolved",
    assigneeId: "user-netrunner", creatorId: "user-netrunner",
    resolvedAt: "2026-03-17T11:00:00Z", createdAt: "2026-03-17T10:00:00Z",
    events: [
      { message: "Discord логи перестали приходить", authorId: "user-netrunner", createdAt: "2026-03-17T10:00:00Z" },
      { message: "Rate limit от Discord API, webhook URL обновлён", authorId: "user-netrunner", createdAt: "2026-03-17T10:30:00Z" },
      { message: "Логи восстановлены", authorId: "user-netrunner", createdAt: "2026-03-17T11:00:00Z" },
    ],
  },
];

for (const inc of INCIDENTS) {
  const { events, postmortem, ...incData } = inc;
  insertIncident.run({ ...incData, now });
  console.log(`  ${inc.severity} ${inc.title}`);
  for (const ev of events) {
    insertIncidentEvent.run({ id: cuid(), incidentId: inc.id, ...ev });
  }
  if (postmortem) {
    insertPostmortem.run({ id: cuid(), incidentId: inc.id, ...postmortem, now });
  }
}

// ============ DEPLOYS ============

const insertDeploy = db.prepare(`
  INSERT OR REPLACE INTO Deploy (id, version, environment, status, serverId, triggeredBy, commitSha, commitMsg, logs, startedAt, finishedAt)
  VALUES (@id, @version, @environment, @status, @serverId, @triggeredBy, @commitSha, @commitMsg, @logs, @startedAt, @finishedAt)
`);

const DEPLOYS = [
  { id: "dep-1", version: "v2.14.0", environment: "production", status: "success", serverId: "srv-1", triggeredBy: "user-darkside", commitSha: "a1b2c3d", commitMsg: "fix: vehicle desync on 64+ players", logs: '["Building resources...","Uploading to server-01...","Restarting FiveM...","Health check passed","Deploy complete"]', startedAt: "2026-03-22T14:00:00Z", finishedAt: "2026-03-22T14:03:22Z" },
  { id: "dep-2", version: "v2.13.2", environment: "development", status: "success", serverId: "srv-2", triggeredBy: "user-nightwolf", commitSha: "e4f5g6h", commitMsg: "feat: new drug dealer NPC logic", logs: '["Building resources...","Uploading to dev-server...","Restart complete","Deploy complete"]', startedAt: "2026-03-22T12:30:00Z", finishedAt: "2026-03-22T12:31:45Z" },
  { id: "dep-3", version: "v2.13.1", environment: "production", status: "failed", serverId: "srv-1", triggeredBy: "user-darkside", commitSha: "i7j8k9l", commitMsg: "chore: update dependencies", logs: '["Building resources...","Uploading to server-01...","ERROR: Resource ox_inventory failed to start","Rollback initiated","Rolled back to v2.13.0"]', startedAt: "2026-03-22T10:00:00Z", finishedAt: "2026-03-22T10:02:15Z" },
  { id: "dep-4", version: "v2.13.0", environment: "production", status: "success", serverId: "srv-1", triggeredBy: "user-pixelcraft", commitSha: "m1n2o3p", commitMsg: "feat: new inventory UI with drag-and-drop", logs: '["Building NUI...","Compiling Lua...","Uploading...","Restarting...","Health check passed","Deploy complete"]', startedAt: "2026-03-21T18:00:00Z", finishedAt: "2026-03-21T18:04:10Z" },
  { id: "dep-5", version: "v2.12.5", environment: "staging", status: "success", serverId: null, triggeredBy: "user-shadowlua", commitSha: "q4r5s6t", commitMsg: "fix: NPC pathfinding stuck on stairs", logs: '["Building resources...","Uploading to staging...","Deploy complete"]', startedAt: "2026-03-21T15:00:00Z", finishedAt: "2026-03-21T15:02:30Z" },
  { id: "dep-6", version: "v2.12.4", environment: "development", status: "success", serverId: "srv-2", triggeredBy: "user-codeviper", commitSha: "u7v8w9x", commitMsg: "feat: property system database migration", logs: '["Running migrations...","Building resources...","Deploy complete"]', startedAt: "2026-03-21T11:00:00Z", finishedAt: "2026-03-21T11:01:50Z" },
  { id: "dep-7", version: "v2.12.3", environment: "production", status: "success", serverId: "srv-1", triggeredBy: "user-darkside", commitSha: "y1z2a3b", commitMsg: "fix: crash on large inventory stacks", logs: '["Building resources...","Uploading...","Restarting...","Health check passed","Deploy complete"]', startedAt: "2026-03-20T20:00:00Z", finishedAt: "2026-03-20T20:05:00Z" },
  { id: "dep-8", version: "v2.12.2", environment: "production", status: "success", serverId: "srv-1", triggeredBy: "user-netrunner", commitSha: "c3d4e5f", commitMsg: "security: patch anti-cheat bypass", logs: '["Building resources...","Uploading...","Restarting...","Deploy complete"]', startedAt: "2026-03-20T14:00:00Z", finishedAt: "2026-03-20T14:03:00Z" },
];

console.log("\nSeeding deploys...");
for (const d of DEPLOYS) {
  insertDeploy.run(d);
  console.log(`  ${d.status.padEnd(8)} ${d.version} → ${d.environment}`);
}

// ============ TASKS ============

const insertTask = db.prepare(`
  INSERT OR REPLACE INTO Task (id, title, description, assigneeId, creatorId, priority, status, tags, incidentId, createdAt, updatedAt)
  VALUES (@id, @title, @description, @assigneeId, @creatorId, @priority, @status, @tags, @incidentId, @createdAt, @now)
`);

const TASKS = [
  { id: "task-1", title: "Fix vehicle desync на 64+ игроках", description: "При >64 игроках на сервере машины начинают телепортироваться. Нужно оптимизировать sync rate.", assigneeId: "user-nightwolf", creatorId: "user-darkside", priority: "critical", status: "in_progress", tags: '["bug","sync","performance"]', incidentId: "inc-1", createdAt: "2026-03-20T10:00:00Z" },
  { id: "task-2", title: "Новый UI инвентаря", description: "Переделать инвентарь на drag-and-drop с весовой системой. Макет в Figma.", assigneeId: "user-pixelcraft", creatorId: "user-darkside", priority: "high", status: "in_progress", tags: '["feature","ui","nui"]', incidentId: null, createdAt: "2026-03-18T14:00:00Z" },
  { id: "task-3", title: "AI для наркодилера NPC", description: "NPC должен патрулировать маршрут, реагировать на полицию, иметь систему торговли.", assigneeId: "user-shadowlua", creatorId: "user-darkside", priority: "medium", status: "todo", tags: '["feature","npc","lua"]', incidentId: null, createdAt: "2026-03-19T09:00:00Z" },
  { id: "task-4", title: "Миграция БД для системы недвижимости", description: "Создать таблицы properties, property_owners, property_furniture.", assigneeId: "user-codeviper", creatorId: "user-darkside", priority: "high", status: "todo", tags: '["database","migration"]', incidentId: null, createdAt: "2026-03-21T08:00:00Z" },
  { id: "task-5", title: "Anti-cheat модуль v2", description: "Обновить античит: детект speedhack, teleport, weapon mod. Логирование в Discord.", assigneeId: "user-nightwolf", creatorId: "user-darkside", priority: "critical", status: "todo", tags: '["security","anti-cheat"]', incidentId: null, createdAt: "2026-03-17T12:00:00Z" },
  { id: "task-6", title: "Настроить CI/CD для FiveM ресурсов", description: "GitHub Actions: lint Lua, build NUI, deploy на dev сервер при push в dev ветку.", assigneeId: "user-darkside", creatorId: "user-darkside", priority: "medium", status: "done", tags: '["devops","ci"]', incidentId: null, createdAt: "2026-03-15T10:00:00Z" },
  { id: "task-7", title: "Система погоды с синхронизацией", description: "Динамическая погода, синхронизированная для всех игроков.", assigneeId: "user-shadowlua", creatorId: "user-darkside", priority: "low", status: "todo", tags: '["feature","sync"]', incidentId: null, createdAt: "2026-03-22T08:00:00Z" },
  { id: "task-8", title: "Оптимизация рендера маркеров на карте", description: "При >200 маркеров FPS падает. Реализовать LOD и кластеризацию.", assigneeId: "user-pixelcraft", creatorId: "user-darkside", priority: "medium", status: "done", tags: '["performance","ui"]', incidentId: null, createdAt: "2026-03-14T11:00:00Z" },
  { id: "task-9", title: "Интерьеры для новых зданий", description: "Создать интерьеры для 5 новых зданий: банк, госпиталь, автосалон, бар, склад.", assigneeId: "user-mapmaker", creatorId: "user-darkside", priority: "medium", status: "in_progress", tags: '["map","3d"]', incidentId: null, createdAt: "2026-03-16T09:00:00Z" },
  { id: "task-10", title: "Логирование действий игроков", description: "Записывать ключевые действия в БД для модерации.", assigneeId: "user-codeviper", creatorId: "user-darkside", priority: "high", status: "todo", tags: '["feature","database","moderation"]', incidentId: null, createdAt: "2026-03-22T07:00:00Z" },
];

console.log("\nSeeding tasks...");
for (const t of TASKS) {
  insertTask.run({ ...t, now });
  console.log(`  ${t.priority.padEnd(8)} ${t.title.substring(0, 50)}`);
}

// ============ NOTIFICATIONS ============

const insertNotification = db.prepare(`
  INSERT INTO Notification (id, userId, type, title, message, isRead, createdAt)
  VALUES (@id, @userId, @type, @title, @message, @isRead, @createdAt)
`);

console.log("\nSeeding notifications...");
// Create notifications for all users
for (const user of USERS) {
  const notifs = [
    { type: "deploy", title: "Деплой завершён", message: "v2.14.0 успешно развёрнут на production", isRead: 0, createdAt: "2026-03-22T14:03:00Z" },
    { type: "issue_created", title: "Новый инцидент", message: "P2: Сервер #3 не запускается после обновления", isRead: 0, createdAt: "2026-03-22T08:00:00Z" },
    { type: "task_update", title: "Задача обновлена", message: "'Новый UI инвентаря' переведена в In Progress", isRead: 1, createdAt: "2026-03-22T11:00:00Z" },
    { type: "pr_merged", title: "PR объединён", message: "PR #42 'Fix vehicle desync' влит в main", isRead: 1, createdAt: "2026-03-22T14:20:00Z" },
  ];
  for (const n of notifs) {
    insertNotification.run({ id: cuid(), userId: user.id, ...n });
  }
}

// ============ AUDIT LOG ============

const insertAudit = db.prepare(`
  INSERT INTO AuditLog (id, userId, action, target, details, createdAt)
  VALUES (@id, @userId, @action, @target, @details, @createdAt)
`);

const AUDIT_ENTRIES = [
  { userId: "user-darkside",  action: "deploy.trigger",   target: "v2.14.0 → production",          details: null, createdAt: "2026-03-22T14:00:00Z" },
  { userId: "user-nightwolf", action: "deploy.trigger",   target: "v2.13.2 → development",          details: null, createdAt: "2026-03-22T12:30:00Z" },
  { userId: "user-darkside",  action: "incident.create",  target: "Сервер #3 не запускается",       details: "P2", createdAt: "2026-03-22T08:00:00Z" },
  { userId: "user-pixelcraft", action: "task.move",       target: "Новый UI инвентаря → in_progress", details: null, createdAt: "2026-03-22T11:00:00Z" },
  { userId: "user-darkside",  action: "settings.update",  target: "server-config",                   details: null, createdAt: "2026-03-22T14:30:00Z" },
  { userId: "user-nightwolf", action: "task.move",        target: "Fix vehicle desync → in_progress", details: null, createdAt: "2026-03-22T09:00:00Z" },
  { userId: "user-codeviper", action: "deploy.trigger",   target: "v2.12.4 → development",           details: null, createdAt: "2026-03-21T11:00:00Z" },
  { userId: "user-netrunner", action: "incident.resolve", target: "Discord webhook не отправляет логи", details: null, createdAt: "2026-03-17T11:00:00Z" },
];

console.log("\nSeeding audit log...");
for (const a of AUDIT_ENTRIES) {
  insertAudit.run({ id: cuid(), ...a });
}

// ============ LOG ENTRIES ============

const insertLog = db.prepare(`
  INSERT INTO LogEntry (id, serverId, level, source, message, createdAt)
  VALUES (@id, @serverId, @level, @source, @message, @createdAt)
`);

const sources = ["fivem-core", "ox_inventory", "esx_identity", "pma-voice", "sentry_anticheat", "sentry_admin", "mysql-async", "server"];
const players = ["DarkSide", "NightWolf", "Player_42", "xXx_Pro_xXx", "CopMain", "MedicRyan"];
const logTemplates = {
  info: [
    `Player ${players[2]} connected (ID: 142)`,
    "Resource ox_inventory started successfully",
    "Auto-save completed in 234ms",
    "Voice channel created for 12 players",
    `Player ${players[3]} spawned at Legion Square`,
    `Transaction: ${players[4]} bought Bandage for $50`,
  ],
  warn: [
    "High memory usage: 3200MB / 4096MB",
    "Slow query detected: 450ms on player_inventory",
    `Player ${players[5]} connection timeout, retrying...`,
    "Rate limit approaching for Discord webhook",
    "Resource pma-voice using excessive CPU: 15%",
    "Tick rate dropped to 58 (target: 64)",
  ],
  error: [
    `Failed to save player data: ${players[2]} - timeout`,
    "Resource esx_identity threw an error: nil value",
    "Database connection lost, reconnecting...",
    `Anti-cheat: suspicious speed detected for ${players[3]}`,
  ],
  debug: [
    "Sync packet: 1024 bytes to 94 clients",
    "Cache hit ratio: 87%",
    "GC pause: 12ms",
    "Entity pool: 1456/2048 active",
  ],
};

console.log("\nSeeding log entries...");
let logCount = 0;
for (let i = 0; i < 100; i++) {
  const levels = ["info", "info", "info", "info", "warn", "warn", "error", "debug"];
  const level = levels[Math.floor(Math.random() * levels.length)];
  const templates = logTemplates[level];
  const message = templates[Math.floor(Math.random() * templates.length)];
  const source = sources[Math.floor(Math.random() * sources.length)];
  const serverId = Math.random() > 0.3 ? "srv-1" : "srv-2";
  const ts = new Date(Date.now() - Math.floor(Math.random() * 24 * 3600_000)).toISOString();

  insertLog.run({ id: cuid(), serverId, level, source, message, createdAt: ts });
  logCount++;
}
console.log(`  ${logCount} log entries created`);

console.log("\nDone! Login with any of the above credentials.");
db.close();
