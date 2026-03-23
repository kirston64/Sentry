import type { UserRole } from "./database";

export interface TeamMember {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  isOnline: boolean;
  lastActiveAt: string;
  specialties: string[];
  stats: {
    commits: number;
    tasksCompleted: number;
    prsReviewed: number;
  };
  // Extended profile
  bio: string;
  joinedAt: string;
  timezone: string;
  discord: string;
  telegram: string;
  github: string;
  currentProject: string;
  weeklyHours: number;
  skills: { name: string; level: number }[]; // level 0-100
  contributionGraph: number[]; // 12 weeks of activity (0-4 intensity)
  avatarColor: string; // tailwind color class
}
