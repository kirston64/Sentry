"use client";

import { AlertTriangle } from "lucide-react";

interface UserData {
  id: string;
  username: string;
  fullName: string;
  role: string;
  createdAt: string;
  passwordChangedAt: string;
}

const roleColors: Record<string, string> = {
  owner: "bg-error/20 text-error",
  admin: "bg-warning/20 text-warning",
  developer: "bg-primary/20 text-primary",
};

export function UserManager({ users }: { users: UserData[] }) {
  return (
    <div className="divide-y divide-border">
      {users.map((u) => {
        const passAge = Date.now() - new Date(u.passwordChangedAt).getTime();
        const passDaysLeft = Math.max(0, 30 - Math.floor(passAge / (24 * 60 * 60 * 1000)));
        const passExpiring = passDaysLeft <= 7;

        return (
          <div key={u.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                {u.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <span className="text-text-primary">{u.fullName}</span>
                <span className="ml-2 text-xs text-text-muted">@{u.username}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {passExpiring && (
                <span className="flex items-center gap-1 text-[10px] text-warning">
                  <AlertTriangle className="h-3 w-3" />
                  {passDaysLeft === 0 ? "Пароль истёк" : `${passDaysLeft} дн.`}
                </span>
              )}
              <span className={`rounded px-2 py-0.5 text-xs ${roleColors[u.role] || "bg-primary/20 text-primary"}`}>
                {u.role}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
