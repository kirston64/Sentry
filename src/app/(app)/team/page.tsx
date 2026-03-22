import { Users } from "lucide-react";
import { MemberCard } from "@/components/team/member-card";
import { TEAM_MEMBERS } from "@/lib/mock-data";

export default function TeamPage() {
  const online = TEAM_MEMBERS.filter((m) => m.isOnline).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold text-text-primary">Team</h1>
        <span className="ml-2 text-xs text-text-muted">
          {online} / {TEAM_MEMBERS.length} онлайн
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TEAM_MEMBERS.map((member) => (
          <MemberCard key={member.id} member={member} />
        ))}
      </div>
    </div>
  );
}
