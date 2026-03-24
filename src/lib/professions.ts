export interface Profession {
  key: string;
  label: string;
  color: string; // tailwind bg/text classes
}

export const PROFESSIONS: Profession[] = [
  { key: "lua",        label: "Lua разработчик",      color: "bg-primary/15 text-primary" },
  { key: "backend",    label: "Backend разработчик",   color: "bg-accent/15 text-accent" },
  { key: "frontend",   label: "Frontend разработчик",  color: "bg-[#38bdf8]/15 text-[#38bdf8]" },
  { key: "devops",     label: "DevOps",                color: "bg-warning/15 text-warning" },
  { key: "sysadmin",   label: "Системный администратор", color: "bg-warning/15 text-warning" },
  { key: "dba",        label: "DBA / Базы данных",     color: "bg-success/15 text-success" },
  { key: "mapper",     label: "3D Маппер",             color: "bg-[#a78bfa]/15 text-[#a78bfa]" },
  { key: "designer",   label: "UI/UX Дизайнер",        color: "bg-[#f472b6]/15 text-[#f472b6]" },
  { key: "anticheat",  label: "Анти-чит / Безопасность", color: "bg-error/15 text-error" },
  { key: "network",    label: "Сетевой администратор", color: "bg-warning/15 text-warning" },
  { key: "qa",         label: "QA / Тестировщик",      color: "bg-success/15 text-success" },
  { key: "gamedesign", label: "Game Designer",          color: "bg-[#fb923c]/15 text-[#fb923c]" },
  { key: "moderator",  label: "Модератор",             color: "bg-accent/15 text-accent" },
  { key: "video",      label: "Видеограф / Стример",   color: "bg-[#f43f5e]/15 text-[#f43f5e]" },
  { key: "manager",    label: "Менеджер проекта",      color: "bg-primary/15 text-primary" },
];

export function getProfession(key: string): Profession | undefined {
  return PROFESSIONS.find((p) => p.key === key);
}

export function parseSpecialties(json: string): string[] {
  try { return JSON.parse(json); } catch { return []; }
}
