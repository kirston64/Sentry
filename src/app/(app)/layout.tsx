import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { CommandPalette } from "@/components/ui/command-palette";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getSession();
  if (!profile) redirect("/");

  return (
    <div className="flex h-screen">
      <Sidebar profile={profile} />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
      <CommandPalette />
    </div>
  );
}
