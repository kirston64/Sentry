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
}
