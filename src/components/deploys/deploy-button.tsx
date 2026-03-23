"use client";

import { useState } from "react";
import { Rocket, Lock } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";
import { useProfile } from "@/components/auth/profile-context";
import { canDeployProd } from "@/lib/rbac";
import { addAuditEntry } from "@/lib/audit";
import { clsx } from "clsx";

export function DeployButton() {
  const [deploying, setDeploying] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const profile = useProfile();
  const allowed = canDeployProd(profile.role);

  const handleDeploy = () => {
    if (deploying || !allowed) return;
    setDeploying(true);
    setProgress(0);

    const steps = [0, 20, 45, 70, 90, 100];
    steps.forEach((p, i) => {
      setTimeout(() => {
        setProgress(p);
        if (p === 100) {
          setTimeout(() => {
            setDeploying(false);
            setProgress(0);
            toast("Deploy v2.14.1 завершён успешно!", "success");
            addAuditEntry({ user: profile.github_username ?? "Unknown", action: "deploy.trigger", target: "v2.14.1 → production" });
          }, 500);
        }
      }, i * 1000);
    });
  };

  if (!allowed) {
    return (
      <button
        disabled
        className="flex items-center gap-2 rounded-md bg-surface-hover px-4 py-2 text-sm font-medium text-text-muted cursor-not-allowed"
        title="Деплой доступен только для Owner"
      >
        <Lock className="h-4 w-4" />
        Deploy Now
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={handleDeploy}
        disabled={deploying}
        className={clsx(
          "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white transition-all",
          deploying ? "bg-warning/80 cursor-wait" : "bg-primary hover:bg-primary-hover"
        )}
      >
        <Rocket className={clsx("h-4 w-4", deploying && "animate-pulse")} />
        {deploying ? "Deploying..." : "Deploy Now"}
      </button>
      {deploying && (
        <div className="absolute -bottom-1 left-0 h-1 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full bg-warning transition-all duration-700 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
