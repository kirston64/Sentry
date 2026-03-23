import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileHeader } from "@/components/layout/mobile-header";
import { CommandPalette } from "@/components/ui/command-palette";
import { ProfileProvider } from "@/components/auth/profile-context";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getSession();
  if (!profile) redirect("/");

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
          <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
        </div>
        <CommandPalette />
      </div>
    </ProfileProvider>
  );
}
