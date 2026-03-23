import type { TeamMember } from "@/types/team";
import type { UserRole } from "@/types/database";

// Display-only data for team members that enriches the basic user info from the API.
// Keyed by lowercase username for matching with DB users.
const displayData: Record<string, Omit<TeamMember, "id">> = {
  darkside: {
    username: "DarkSide",
    fullName: "Артём Козлов",
    role: "owner",
    isOnline: true,
    lastActiveAt: "2026-03-22T14:30:00Z",
    specialties: ["Архитектура", "DevOps", "Lua"],
    stats: { commits: 342, tasksCompleted: 89, prsReviewed: 156 },
    bio: "Основатель и лид-разработчик Sentry RP. 5 лет опыта в FiveM разработке. Отвечаю за архитектуру, CI/CD и серверную инфраструктуру. Бывший разработчик в Diamond RP.",
    joinedAt: "2024-06-15",
    timezone: "UTC+3 Москва",
    discord: "DarkSide#0001",
    telegram: "@darkside_dev",
    github: "darkside-dev",
    currentProject: "Миграция на txAdmin v7",
    weeklyHours: 45,
    skills: [
      { name: "Lua", level: 95 },
      { name: "DevOps", level: 90 },
      { name: "C#", level: 75 },
      { name: "JavaScript", level: 85 },
      { name: "Docker", level: 88 },
      { name: "SQL", level: 70 },
    ],
    contributionGraph: [4, 3, 4, 4, 3, 2, 4, 4, 3, 4, 4, 3],
    avatarColor: "bg-error/20 text-error",
  },
  nightwolf: {
    username: "NightWolf",
    fullName: "Максим Петров",
    role: "admin",
    isOnline: true,
    lastActiveAt: "2026-03-22T14:15:00Z",
    specialties: ["Vehicle Sync", "Anti-Cheat", "C#"],
    stats: { commits: 278, tasksCompleted: 67, prsReviewed: 98 },
    bio: "Специализируюсь на синхронизации транспорта и античит-системах. Написал кастомный античит для Sentry RP с нуля. Увлекаюсь reverse engineering.",
    joinedAt: "2024-08-20",
    timezone: "UTC+3 Москва",
    discord: "NightWolf#1337",
    telegram: "@nightwolf_fivem",
    github: "nightwolf-sync",
    currentProject: "Anti-Cheat v3.0 — ML детекция",
    weeklyHours: 38,
    skills: [
      { name: "C#", level: 92 },
      { name: "Lua", level: 80 },
      { name: "Networking", level: 85 },
      { name: "Reverse Engineering", level: 70 },
      { name: "Python", level: 60 },
    ],
    contributionGraph: [3, 4, 3, 2, 3, 4, 3, 4, 4, 3, 2, 4],
    avatarColor: "bg-warning/20 text-warning",
  },
  pixelcraft: {
    username: "PixelCraft",
    fullName: "Анна Смирнова",
    role: "developer",
    isOnline: true,
    lastActiveAt: "2026-03-22T13:50:00Z",
    specialties: ["UI/UX", "React", "NUI"],
    stats: { commits: 195, tasksCompleted: 54, prsReviewed: 42 },
    bio: "UI/UX дизайнер и фронтенд-разработчик. Делаю все NUI интерфейсы для серверов. Выпускница Школы Дизайна ВШЭ. Люблю минималистичный UI.",
    joinedAt: "2024-11-03",
    timezone: "UTC+3 Санкт-Петербург",
    discord: "PixelCraft#4242",
    telegram: "@pixel_craft_ui",
    github: "pixelcraft-nui",
    currentProject: "Редизайн инвентаря v2",
    weeklyHours: 30,
    skills: [
      { name: "React", level: 90 },
      { name: "CSS/Tailwind", level: 95 },
      { name: "Figma", level: 88 },
      { name: "TypeScript", level: 75 },
      { name: "Lua", level: 40 },
    ],
    contributionGraph: [2, 3, 3, 4, 2, 3, 1, 3, 4, 3, 3, 2],
    avatarColor: "bg-primary/20 text-primary",
  },
  codeviper: {
    username: "CodeViper",
    fullName: "Дмитрий Иванов",
    role: "developer",
    isOnline: false,
    lastActiveAt: "2026-03-22T10:20:00Z",
    specialties: ["Database", "SQL", "Optimization"],
    stats: { commits: 156, tasksCompleted: 41, prsReviewed: 67 },
    bio: "DBA и бэкенд-разработчик. Оптимизирую запросы, слежу за производительностью MySQL. Мигрировал базу с 500GB без даунтайма. Бывший DBA в Яндексе.",
    joinedAt: "2025-01-10",
    timezone: "UTC+5 Екатеринбург",
    discord: "CodeViper#7890",
    telegram: "@codeviper_db",
    github: "codeviper-sql",
    currentProject: "Оптимизация property queries",
    weeklyHours: 25,
    skills: [
      { name: "MySQL", level: 95 },
      { name: "PostgreSQL", level: 80 },
      { name: "Lua", level: 55 },
      { name: "Monitoring", level: 75 },
      { name: "Redis", level: 70 },
    ],
    contributionGraph: [2, 1, 3, 2, 1, 2, 3, 2, 1, 3, 2, 2],
    avatarColor: "bg-accent/20 text-accent",
  },
  shadowlua: {
    username: "ShadowLua",
    fullName: "Кирилл Волков",
    role: "developer",
    isOnline: true,
    lastActiveAt: "2026-03-22T14:00:00Z",
    specialties: ["Lua", "Game Logic", "NPC AI"],
    stats: { commits: 221, tasksCompleted: 73, prsReviewed: 31 },
    bio: "Геймплей-программист. Пишу системы NPC, торговли, крафта и квестов. 3 года на FiveM, до этого модил GTA San Andreas. Живу в Lua скриптах.",
    joinedAt: "2024-09-01",
    timezone: "UTC+3 Москва",
    discord: "ShadowLua#5555",
    telegram: "@shadow_lua",
    github: "shadowlua-scripts",
    currentProject: "Система чёрного рынка + NPC дилеры",
    weeklyHours: 35,
    skills: [
      { name: "Lua", level: 98 },
      { name: "Game Design", level: 80 },
      { name: "C#", level: 50 },
      { name: "JavaScript", level: 45 },
      { name: "Python", level: 60 },
    ],
    contributionGraph: [3, 4, 4, 3, 2, 4, 3, 3, 4, 4, 3, 4],
    avatarColor: "bg-success/20 text-success",
  },
  netrunner: {
    username: "NetRunner",
    fullName: "Елена Морозова",
    role: "admin",
    isOnline: false,
    lastActiveAt: "2026-03-21T22:10:00Z",
    specialties: ["Networking", "Security", "Linux"],
    stats: { commits: 134, tasksCompleted: 38, prsReviewed: 85 },
    bio: "Системный администратор и сетевик. Настраиваю сервера, firewall, DDoS-защиту. Сертифицированный Linux админ (RHCE). Слежу чтобы всё не легло.",
    joinedAt: "2024-10-15",
    timezone: "UTC+3 Москва",
    discord: "NetRunner#9999",
    telegram: "@netrunner_ops",
    github: "netrunner-infra",
    currentProject: "DDoS mitigation + Cloudflare Tunnel",
    weeklyHours: 28,
    skills: [
      { name: "Linux", level: 95 },
      { name: "Networking", level: 92 },
      { name: "Docker", level: 85 },
      { name: "Security", level: 88 },
      { name: "Bash", level: 90 },
      { name: "Nginx", level: 80 },
    ],
    contributionGraph: [1, 2, 2, 3, 1, 2, 2, 1, 3, 2, 1, 2],
    avatarColor: "bg-warning/20 text-warning",
  },
  mapmaker: {
    username: "MapMaker",
    fullName: "Олег Соколов",
    role: "developer",
    isOnline: false,
    lastActiveAt: "2026-03-21T18:45:00Z",
    specialties: ["Map Design", "3D Modeling", "Blender"],
    stats: { commits: 87, tasksCompleted: 29, prsReviewed: 12 },
    bio: "3D-художник и маппер. Создаю интерьеры, кастомные здания и объекты для серверов. Работаю в Blender + CodeWalker. Портфолио на ArtStation.",
    joinedAt: "2025-02-20",
    timezone: "UTC+7 Новосибирск",
    discord: "MapMaker#3210",
    telegram: "@mapmaker_3d",
    github: "mapmaker-models",
    currentProject: "Интерьер нового PD + тюрьма",
    weeklyHours: 20,
    skills: [
      { name: "Blender", level: 92 },
      { name: "CodeWalker", level: 88 },
      { name: "3D Modeling", level: 90 },
      { name: "Texturing", level: 75 },
      { name: "Lua", level: 30 },
    ],
    contributionGraph: [1, 2, 1, 3, 2, 1, 0, 2, 3, 1, 2, 1],
    avatarColor: "bg-primary/20 text-primary",
  },
};

const defaultDisplay: Omit<TeamMember, "id" | "username" | "fullName" | "role"> = {
  isOnline: false,
  lastActiveAt: new Date().toISOString(),
  specialties: [],
  stats: { commits: 0, tasksCompleted: 0, prsReviewed: 0 },
  bio: "",
  joinedAt: new Date().toISOString(),
  timezone: "UTC+3",
  discord: "",
  telegram: "",
  github: "",
  currentProject: "",
  weeklyHours: 0,
  skills: [],
  contributionGraph: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  avatarColor: "bg-primary/20 text-primary",
};

export interface ApiUser {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  bio?: string;
}

export function enrichUsers(apiUsers: ApiUser[]): TeamMember[] {
  return apiUsers.map((u) => {
    const display = displayData[u.username.toLowerCase()];
    if (display) {
      return { ...display, id: u.id, bio: u.bio || display.bio };
    }
    return {
      id: u.id,
      username: u.username,
      fullName: u.fullName,
      role: u.role,
      ...defaultDisplay,
      bio: u.bio || "",
    };
  });
}

export function getTeamMemberById(id: string, apiUsers: ApiUser[]): TeamMember | undefined {
  const user = apiUsers.find((u) => u.id === id);
  if (!user) return undefined;
  return enrichUsers([user])[0];
}
