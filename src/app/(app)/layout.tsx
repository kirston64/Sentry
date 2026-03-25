import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileHeader } from "@/components/layout/mobile-header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { CommandPalette } from "@/components/ui/command-palette";
import { ProfileProvider } from "@/components/auth/profile-context";
import { LockdownBanner } from "@/components/lockdown/lockdown-banner";
import { PresenceTracker } from "@/components/auth/presence-tracker";
import { BanChecker } from "@/components/auth/ban-checker";
import { prisma } from "@/lib/db";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getSession();
  if (!profile) redirect("/");

  // Check if user is banned
  const userRecord = await prisma.user.findUnique({
    where: { id: profile.id },
    select: { banned: true },
  }).catch(() => null);
  if (userRecord?.banned && profile.role !== "owner") {
    redirect("/banned");
  }

  // Check lockdown — non-owners get blocked
  const lockdown = await prisma.systemLockdown.findFirst({
    where: { status: { in: ["active", "pending"] } },
    orderBy: { initiatedAt: "desc" },
  }).catch(() => null);

  if (lockdown?.status === "active" && profile.role !== "owner") {
    redirect("/lockdown");
  }

  return (
    <ProfileProvider profile={profile}>
      <div className="flex h-screen">
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <Sidebar profile={profile} />
        </div>
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Mobile header */}
          <MobileHeader profile={profile} />
          {/* Lockdown banner for owners */}
          {profile.role === "owner" && lockdown && (
            <LockdownBanner lockdown={lockdown} userId={profile.id} />
          )}
          <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-6 md:pb-6">{children}</main>
        </div>
        <MobileNav />
        <CommandPalette />
        <PresenceTracker />
        {profile.role !== "owner" && <BanChecker />}
      </div>
    </ProfileProvider>
  );
}
