export type DeployStatus = "success" | "failed" | "rolling" | "pending";
export type DeployEnvironment = "production" | "development" | "staging";

export interface Deploy {
  id: string;
  version: string;
  environment: DeployEnvironment;
  status: DeployStatus;
  triggeredBy: string;
  startedAt: string;
  finishedAt: string | null;
  commitSha: string;
  commitMsg: string;
  logs: string[];
}
