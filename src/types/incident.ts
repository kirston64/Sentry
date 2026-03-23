export type Severity = "P1" | "P2" | "P3" | "P4";
export type IncidentStatus = "investigating" | "identified" | "monitoring" | "resolved";

export interface IncidentEvent {
  timestamp: string;
  message: string;
  author: string;
}

export interface Postmortem {
  whatBroke: string;
  rootCause: string;
  fix: string;
  prevention: string;
  author: string;
  writtenAt: string;
}

export interface Incident {
  id: string;
  title: string;
  severity: Severity;
  status: IncidentStatus;
  assigneeId: string | null;
  timeline: IncidentEvent[];
  createdAt: string;
  resolvedAt: string | null;
  postmortem?: Postmortem;
}
