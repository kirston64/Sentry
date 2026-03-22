"use client";

import { Rocket } from "lucide-react";
import { DeployCard } from "@/components/deploys/deploy-card";
import { DeployButton } from "@/components/deploys/deploy-button";
import { DEPLOYS } from "@/lib/mock-data";

export default function DeploysPage() {
  const successCount = DEPLOYS.filter((d) => d.status === "success").length;
  const failCount = DEPLOYS.filter((d) => d.status === "failed").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Rocket className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-text-primary">Deploys</h1>
          <span className="ml-2 text-xs text-text-muted">
            {successCount} success, {failCount} failed
          </span>
        </div>
        <DeployButton />
      </div>

      <div className="space-y-2">
        {DEPLOYS.map((deploy) => (
          <DeployCard key={deploy.id} deploy={deploy} />
        ))}
      </div>
    </div>
  );
}
