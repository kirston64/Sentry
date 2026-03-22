export type ServerStatus = "online" | "offline" | "restarting";

export interface Server {
  id: string;
  name: string;
  ip: string;
  port: number;
  maxPlayers: number;
  status: ServerStatus;
  gameMode: string;
  mapName: string;
}

export interface ServerMetrics {
  playersOnline: number;
  cpuPercent: number;
  ramPercent: number;
  uptimeSeconds: number;
  tickRate: number;
}

export interface ServerWithMetrics {
  server: Server;
  metrics: ServerMetrics;
}
