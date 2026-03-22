import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/ui/login-form";
import { Shield, GitBranch, Activity } from "lucide-react";

export default async function HomePage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8">
      <div className="flex items-center gap-3">
        <Shield className="h-10 w-10 text-primary" />
        <h1 className="text-3xl font-bold text-text-primary">
          Sentry <span className="text-text-secondary font-normal">Dev-Ops</span>
        </h1>
      </div>

      <p className="max-w-md text-center text-text-secondary">
        Панель управления для команды разработчиков RP-проекта.
        Мониторинг серверов, репозиториев и активности.
      </p>

      <div className="flex gap-6 text-text-muted text-sm">
        <span className="flex items-center gap-1.5">
          <GitBranch className="h-4 w-4" /> GitHub
        </span>
        <span className="flex items-center gap-1.5">
          <Activity className="h-4 w-4" /> Audit Log
        </span>
        <span className="flex items-center gap-1.5">
          <Shield className="h-4 w-4" /> RBAC
        </span>
      </div>

      <LoginForm />
    </div>
  );
}
