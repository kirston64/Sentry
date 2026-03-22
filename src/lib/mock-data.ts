import type { Server, ServerMetrics } from "@/types/server";
import type { TeamMember } from "@/types/team";
import type { Task } from "@/types/task";
import type { Notification } from "@/types/notification";
import type { Deploy } from "@/types/deploy";
import type { Incident } from "@/types/incident";

// ============ SERVERS ============

export const SERVERS: Server[] = [
  {
    id: "srv-1",
    name: "Sentry RP #1",
    ip: "185.71.66.101",
    port: 30120,
    maxPlayers: 128,
    status: "online",
    gameMode: "Roleplay",
    mapName: "Los Santos",
  },
  {
    id: "srv-2",
    name: "Sentry RP #2 Dev",
    ip: "185.71.66.102",
    port: 30120,
    maxPlayers: 32,
    status: "online",
    gameMode: "Development",
    mapName: "Los Santos",
  },
  {
    id: "srv-3",
    name: "Sentry RP #3 Event",
    ip: "185.71.66.103",
    port: 30120,
    maxPlayers: 64,
    status: "offline",
    gameMode: "Event",
    mapName: "Cayo Perico",
  },
];

export const BASE_METRICS: Record<string, ServerMetrics> = {
  "srv-1": { playersOnline: 94, cpuPercent: 67, ramPercent: 72, uptimeSeconds: 259200, tickRate: 64 },
  "srv-2": { playersOnline: 8, cpuPercent: 23, ramPercent: 34, uptimeSeconds: 86400, tickRate: 64 },
  "srv-3": { playersOnline: 0, cpuPercent: 0, ramPercent: 0, uptimeSeconds: 0, tickRate: 0 },
};

// Player count pattern (24h, hourly) — realistic daily curve
export const PLAYER_HISTORY_24H = [
  12, 8, 5, 3, 4, 6, 14, 28, 45, 62, 71, 78,
  82, 76, 68, 72, 80, 91, 105, 118, 124, 112, 87, 54,
];

// ============ TEAM MEMBERS ============

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: "tm-1",
    username: "DarkSide",
    fullName: "Артём Козлов",
    role: "owner",
    isOnline: true,
    lastActiveAt: "2026-03-22T14:30:00Z",
    specialties: ["Архитектура", "DevOps", "Lua"],
    stats: { commits: 342, tasksCompleted: 89, prsReviewed: 156 },
  },
  {
    id: "tm-2",
    username: "NightWolf",
    fullName: "Максим Петров",
    role: "admin",
    isOnline: true,
    lastActiveAt: "2026-03-22T14:15:00Z",
    specialties: ["Vehicle Sync", "Anti-Cheat", "C#"],
    stats: { commits: 278, tasksCompleted: 67, prsReviewed: 98 },
  },
  {
    id: "tm-3",
    username: "PixelCraft",
    fullName: "Анна Смирнова",
    role: "developer",
    isOnline: true,
    lastActiveAt: "2026-03-22T13:50:00Z",
    specialties: ["UI/UX", "React", "NUI"],
    stats: { commits: 195, tasksCompleted: 54, prsReviewed: 42 },
  },
  {
    id: "tm-4",
    username: "CodeViper",
    fullName: "Дмитрий Иванов",
    role: "developer",
    isOnline: false,
    lastActiveAt: "2026-03-22T10:20:00Z",
    specialties: ["Database", "SQL", "Optimization"],
    stats: { commits: 156, tasksCompleted: 41, prsReviewed: 67 },
  },
  {
    id: "tm-5",
    username: "ShadowLua",
    fullName: "Кирилл Волков",
    role: "developer",
    isOnline: true,
    lastActiveAt: "2026-03-22T14:00:00Z",
    specialties: ["Lua", "Game Logic", "NPC AI"],
    stats: { commits: 221, tasksCompleted: 73, prsReviewed: 31 },
  },
  {
    id: "tm-6",
    username: "NetRunner",
    fullName: "Елена Морозова",
    role: "admin",
    isOnline: false,
    lastActiveAt: "2026-03-21T22:10:00Z",
    specialties: ["Networking", "Security", "Linux"],
    stats: { commits: 134, tasksCompleted: 38, prsReviewed: 85 },
  },
  {
    id: "tm-7",
    username: "MapMaker",
    fullName: "Олег Соколов",
    role: "developer",
    isOnline: false,
    lastActiveAt: "2026-03-21T18:45:00Z",
    specialties: ["Map Design", "3D Modeling", "Blender"],
    stats: { commits: 87, tasksCompleted: 29, prsReviewed: 12 },
  },
];

// ============ TASKS (seed data) ============

export const SEED_TASKS: Task[] = [
  {
    id: "task-1",
    title: "Fix vehicle desync на 64+ игроках",
    description: "При >64 игроках на сервере машины начинают телепортироваться. Нужно оптимизировать sync rate.",
    assigneeId: "tm-2",
    priority: "critical",
    status: "in_progress",
    tags: ["bug", "sync", "performance"],
    createdAt: "2026-03-20T10:00:00Z",
    updatedAt: "2026-03-22T09:00:00Z",
  },
  {
    id: "task-2",
    title: "Новый UI инвентаря",
    description: "Переделать инвентарь на drag-and-drop с весовой системой. Макет в Figma.",
    assigneeId: "tm-3",
    priority: "high",
    status: "in_progress",
    tags: ["feature", "ui", "nui"],
    createdAt: "2026-03-18T14:00:00Z",
    updatedAt: "2026-03-22T11:00:00Z",
  },
  {
    id: "task-3",
    title: "AI для наркодилера NPC",
    description: "NPC должен патрулировать маршрут, реагировать на полицию, иметь систему торговли.",
    assigneeId: "tm-5",
    priority: "medium",
    status: "todo",
    tags: ["feature", "npc", "lua"],
    createdAt: "2026-03-19T09:00:00Z",
    updatedAt: "2026-03-19T09:00:00Z",
  },
  {
    id: "task-4",
    title: "Миграция БД для системы недвижимости",
    description: "Создать таблицы properties, property_owners, property_furniture. Написать миграции.",
    assigneeId: "tm-4",
    priority: "high",
    status: "todo",
    tags: ["database", "migration"],
    createdAt: "2026-03-21T08:00:00Z",
    updatedAt: "2026-03-21T08:00:00Z",
  },
  {
    id: "task-5",
    title: "Anti-cheat модуль v2",
    description: "Обновить античит: детект speedhack, teleport, weapon mod. Логирование в Discord.",
    assigneeId: "tm-2",
    priority: "critical",
    status: "todo",
    tags: ["security", "anti-cheat"],
    createdAt: "2026-03-17T12:00:00Z",
    updatedAt: "2026-03-17T12:00:00Z",
  },
  {
    id: "task-6",
    title: "Настроить CI/CD для FiveM ресурсов",
    description: "GitHub Actions: lint Lua, build NUI, deploy на dev сервер при push в dev ветку.",
    assigneeId: "tm-1",
    priority: "medium",
    status: "done",
    tags: ["devops", "ci"],
    createdAt: "2026-03-15T10:00:00Z",
    updatedAt: "2026-03-20T16:00:00Z",
  },
  {
    id: "task-7",
    title: "Система погоды с синхронизацией",
    description: "Динамическая погода, синхронизированная для всех игроков. Админ может менять вручную.",
    assigneeId: "tm-5",
    priority: "low",
    status: "todo",
    tags: ["feature", "sync"],
    createdAt: "2026-03-22T08:00:00Z",
    updatedAt: "2026-03-22T08:00:00Z",
  },
  {
    id: "task-8",
    title: "Оптимизация рендера маркеров на карте",
    description: "При >200 маркеров FPS падает. Реализовать LOD и кластеризацию.",
    assigneeId: "tm-3",
    priority: "medium",
    status: "done",
    tags: ["performance", "ui"],
    createdAt: "2026-03-14T11:00:00Z",
    updatedAt: "2026-03-19T14:00:00Z",
  },
  {
    id: "task-9",
    title: "Интерьеры для новых зданий",
    description: "Создать интерьеры для 5 новых зданий на карте: банк, госпиталь, автосалон, бар, склад.",
    assigneeId: "tm-7",
    priority: "medium",
    status: "in_progress",
    tags: ["map", "3d"],
    createdAt: "2026-03-16T09:00:00Z",
    updatedAt: "2026-03-22T12:00:00Z",
  },
  {
    id: "task-10",
    title: "Логирование действий игроков",
    description: "Записывать ключевые действия (убийства, транзакции, телепорты) в БД для модерации.",
    assigneeId: "tm-4",
    priority: "high",
    status: "todo",
    tags: ["feature", "database", "moderation"],
    createdAt: "2026-03-22T07:00:00Z",
    updatedAt: "2026-03-22T07:00:00Z",
  },
];

// ============ NOTIFICATIONS (seed data) ============

export const SEED_NOTIFICATIONS: Notification[] = [
  {
    id: "notif-1",
    type: "pr_merged",
    title: "PR объединён",
    message: "PR #42 'Fix vehicle desync' влит в main",
    isRead: false,
    createdAt: "2026-03-22T14:20:00Z",
    actorName: "NightWolf",
  },
  {
    id: "notif-2",
    type: "server_restart",
    title: "Сервер перезапущен",
    message: "Sentry RP #1 перезапущен после обновления",
    isRead: false,
    createdAt: "2026-03-22T13:00:00Z",
  },
  {
    id: "notif-3",
    type: "deploy",
    title: "Деплой завершён",
    message: "Ресурсы обновлены на dev сервере",
    isRead: false,
    createdAt: "2026-03-22T12:30:00Z",
    actorName: "DarkSide",
  },
  {
    id: "notif-4",
    type: "task_update",
    title: "Задача обновлена",
    message: "'Новый UI инвентаря' переведена в In Progress",
    isRead: true,
    createdAt: "2026-03-22T11:00:00Z",
    actorName: "PixelCraft",
  },
  {
    id: "notif-5",
    type: "issue_created",
    title: "Новый Issue",
    message: "Issue #15: 'Crash при входе в интерьер банка'",
    isRead: true,
    createdAt: "2026-03-22T09:15:00Z",
    actorName: "MapMaker",
  },
  {
    id: "notif-6",
    type: "member_joined",
    title: "Новый участник",
    message: "MapMaker присоединился к команде",
    isRead: true,
    createdAt: "2026-03-21T16:00:00Z",
  },
];

// ============ COMMITS (for dashboard chart) ============

export const COMMIT_ACTIVITY_7D = [
  { label: "Пн", value: 12 },
  { label: "Вт", value: 8 },
  { label: "Ср", value: 15 },
  { label: "Чт", value: 11 },
  { label: "Пт", value: 18 },
  { label: "Сб", value: 6 },
  { label: "Вс", value: 3 },
];

export const UPTIME_PERCENT = 99.7;

// ============ DEPLOYS ============

export const DEPLOYS: Deploy[] = [
  {
    id: "dep-1", version: "v2.14.0", environment: "production", status: "success",
    triggeredBy: "DarkSide", startedAt: "2026-03-22T14:00:00Z", finishedAt: "2026-03-22T14:03:22Z",
    commitSha: "a1b2c3d", commitMsg: "fix: vehicle desync on 64+ players",
    logs: ["Building resources...", "Uploading to server-01...", "Restarting FiveM...", "Health check passed", "Deploy complete"],
  },
  {
    id: "dep-2", version: "v2.13.2", environment: "development", status: "success",
    triggeredBy: "NightWolf", startedAt: "2026-03-22T12:30:00Z", finishedAt: "2026-03-22T12:31:45Z",
    commitSha: "e4f5g6h", commitMsg: "feat: new drug dealer NPC logic",
    logs: ["Building resources...", "Uploading to dev-server...", "Restart complete", "Deploy complete"],
  },
  {
    id: "dep-3", version: "v2.13.1", environment: "production", status: "failed",
    triggeredBy: "DarkSide", startedAt: "2026-03-22T10:00:00Z", finishedAt: "2026-03-22T10:02:15Z",
    commitSha: "i7j8k9l", commitMsg: "chore: update dependencies",
    logs: ["Building resources...", "Uploading to server-01...", "ERROR: Resource 'ox_inventory' failed to start", "Rollback initiated", "Rolled back to v2.13.0"],
  },
  {
    id: "dep-4", version: "v2.13.0", environment: "production", status: "success",
    triggeredBy: "PixelCraft", startedAt: "2026-03-21T18:00:00Z", finishedAt: "2026-03-21T18:04:10Z",
    commitSha: "m1n2o3p", commitMsg: "feat: new inventory UI with drag-and-drop",
    logs: ["Building NUI...", "Compiling Lua...", "Uploading...", "Restarting...", "Health check passed", "Deploy complete"],
  },
  {
    id: "dep-5", version: "v2.12.5", environment: "staging", status: "success",
    triggeredBy: "ShadowLua", startedAt: "2026-03-21T15:00:00Z", finishedAt: "2026-03-21T15:02:30Z",
    commitSha: "q4r5s6t", commitMsg: "fix: NPC pathfinding stuck on stairs",
    logs: ["Building resources...", "Uploading to staging...", "Deploy complete"],
  },
  {
    id: "dep-6", version: "v2.12.4", environment: "development", status: "success",
    triggeredBy: "CodeViper", startedAt: "2026-03-21T11:00:00Z", finishedAt: "2026-03-21T11:01:50Z",
    commitSha: "u7v8w9x", commitMsg: "feat: property system database migration",
    logs: ["Running migrations...", "Building resources...", "Deploy complete"],
  },
  {
    id: "dep-7", version: "v2.12.3", environment: "production", status: "success",
    triggeredBy: "DarkSide", startedAt: "2026-03-20T20:00:00Z", finishedAt: "2026-03-20T20:05:00Z",
    commitSha: "y1z2a3b", commitMsg: "fix: crash on large inventory stacks",
    logs: ["Building resources...", "Uploading...", "Restarting...", "Health check passed", "Deploy complete"],
  },
  {
    id: "dep-8", version: "v2.12.2", environment: "production", status: "success",
    triggeredBy: "NetRunner", startedAt: "2026-03-20T14:00:00Z", finishedAt: "2026-03-20T14:03:00Z",
    commitSha: "c3d4e5f", commitMsg: "security: patch anti-cheat bypass",
    logs: ["Building resources...", "Uploading...", "Restarting...", "Deploy complete"],
  },
];

// ============ INCIDENTS ============

export const SEED_INCIDENTS: Incident[] = [
  {
    id: "inc-1", title: "Массовый desync на сервере #1", severity: "P1", status: "resolved",
    assigneeId: "tm-2", createdAt: "2026-03-20T22:00:00Z", resolvedAt: "2026-03-21T01:30:00Z",
    timeline: [
      { timestamp: "2026-03-20T22:00:00Z", message: "Получены массовые жалобы на desync от игроков", author: "DarkSide" },
      { timestamp: "2026-03-20T22:15:00Z", message: "Подтверждено: sync rate упал до 12 tick/s при 100+ игроках", author: "NightWolf" },
      { timestamp: "2026-03-20T23:00:00Z", message: "Найдена причина: утечка памяти в vehicle sync после v2.12.0", author: "NightWolf" },
      { timestamp: "2026-03-21T00:30:00Z", message: "Хотфикс задеплоен, tick rate восстановлен до 64", author: "NightWolf" },
      { timestamp: "2026-03-21T01:30:00Z", message: "Мониторинг стабилен 1 час, инцидент закрыт", author: "DarkSide" },
    ],
  },
  {
    id: "inc-2", title: "Дюп предметов через trade window", severity: "P1", status: "resolved",
    assigneeId: "tm-2", createdAt: "2026-03-19T16:00:00Z", resolvedAt: "2026-03-19T18:00:00Z",
    timeline: [
      { timestamp: "2026-03-19T16:00:00Z", message: "Модератор обнаружил дюп через быстрый trade cancel", author: "NetRunner" },
      { timestamp: "2026-03-19T16:30:00Z", message: "Trade система временно отключена", author: "DarkSide" },
      { timestamp: "2026-03-19T17:30:00Z", message: "Фикс: добавлена серверная валидация trade-lock", author: "NightWolf" },
      { timestamp: "2026-03-19T18:00:00Z", message: "Trade система включена, дюп невозможен", author: "DarkSide" },
    ],
  },
  {
    id: "inc-3", title: "Сервер #3 не запускается после обновления", severity: "P2", status: "monitoring",
    assigneeId: "tm-1", createdAt: "2026-03-22T08:00:00Z", resolvedAt: null,
    timeline: [
      { timestamp: "2026-03-22T08:00:00Z", message: "Event сервер не стартует, ошибка в ox_inventory", author: "DarkSide" },
      { timestamp: "2026-03-22T09:00:00Z", message: "Причина: несовместимость версии ox_lib", author: "ShadowLua" },
      { timestamp: "2026-03-22T10:00:00Z", message: "Откат ox_lib до v3.2.0, сервер запущен", author: "DarkSide" },
    ],
  },
  {
    id: "inc-4", title: "Высокая задержка БД (>500ms)", severity: "P3", status: "resolved",
    assigneeId: "tm-4", createdAt: "2026-03-18T14:00:00Z", resolvedAt: "2026-03-18T16:00:00Z",
    timeline: [
      { timestamp: "2026-03-18T14:00:00Z", message: "Мониторинг показывает query time >500ms", author: "CodeViper" },
      { timestamp: "2026-03-18T15:00:00Z", message: "Найден missing index на таблице player_inventory", author: "CodeViper" },
      { timestamp: "2026-03-18T16:00:00Z", message: "Index добавлен, query time <10ms", author: "CodeViper" },
    ],
  },
  {
    id: "inc-5", title: "Discord webhook не отправляет логи", severity: "P4", status: "resolved",
    assigneeId: "tm-6", createdAt: "2026-03-17T10:00:00Z", resolvedAt: "2026-03-17T11:00:00Z",
    timeline: [
      { timestamp: "2026-03-17T10:00:00Z", message: "Discord логи перестали приходить", author: "NetRunner" },
      { timestamp: "2026-03-17T10:30:00Z", message: "Rate limit от Discord API, webhook URL обновлён", author: "NetRunner" },
      { timestamp: "2026-03-17T11:00:00Z", message: "Логи восстановлены", author: "NetRunner" },
    ],
  },
];

// ============ LOG TEMPLATES (for live generation) ============

export const LOG_TEMPLATES = {
  sources: ["fivem-core", "ox_inventory", "esx_identity", "pma-voice", "sentry_anticheat", "sentry_admin", "mysql-async", "server"],
  info: [
    "Player {player} connected (ID: {id})",
    "Resource {resource} started successfully",
    "Auto-save completed in {ms}ms",
    "Voice channel created for {count} players",
    "Player {player} spawned at {location}",
    "Transaction: {player} bought {item} for ${price}",
    "Job changed: {player} -> {job}",
    "Vehicle spawned: {vehicle} for {player}",
  ],
  warn: [
    "High memory usage: {mb}MB / 4096MB",
    "Slow query detected: {ms}ms on {table}",
    "Player {player} connection timeout, retrying...",
    "Rate limit approaching for Discord webhook",
    "Resource {resource} using excessive CPU: {percent}%",
    "Tick rate dropped to {tick} (target: 64)",
  ],
  error: [
    "Failed to save player data: {player} - timeout",
    "Resource {resource} threw an error: {error}",
    "Database connection lost, reconnecting...",
    "Anti-cheat: suspicious speed detected for {player}",
    "Failed to load vehicle model: {model}",
    "Crash recovery: resource {resource} restarting",
  ],
  debug: [
    "Sync packet: {bytes} bytes to {count} clients",
    "Cache hit ratio: {percent}%",
    "GC pause: {ms}ms",
    "Entity pool: {count}/2048 active",
    "Network buffer: {kb}KB queued",
  ],
};
