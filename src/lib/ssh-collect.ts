import { Client } from "ssh2";
import crypto from "crypto";

const ENC_KEY = (process.env.JWT_SECRET || "sentry-dev-secret-32-bytes-padded").slice(0, 32).padEnd(32, "0");
const IV_LEN = 16;

export function encryptPassword(plain: string): string {
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENC_KEY), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return iv.toString("hex") + ":" + enc.toString("hex");
}

export function decryptPassword(encrypted: string): string {
  const [ivHex, encHex] = encrypted.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const enc = Buffer.from(encHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENC_KEY), iv);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}

export interface CollectedMetrics {
  cpuPercent: number;
  ramPercent: number;
  diskPercent: number;
  uptimeSeconds: number;
  activeUsers: number;
  playersOnline: number;
}

export interface ConnectedUser {
  user: string;
  ip: string;
  since: string; // ISO string
}

function parseWhoOutput(raw: string): ConnectedUser[] {
  const result: ConnectedUser[] = [];
  for (const line of raw.split("\n").filter(Boolean)) {
    // Format: "root     pts/0        2026-03-25 12:34 (192.168.1.1)"
    const m = line.match(/^(\S+)\s+\S+\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})(?:\s+\(([^)]+)\))?/);
    if (m) {
      result.push({
        user: m[1],
        ip: m[3] || "local",
        since: new Date(m[2]).toISOString(),
      });
    }
  }
  return result;
}

export interface LogLine {
  level: string; // error | warn | info
  source: string;
  message: string;
  ts: number; // ms since epoch
}

function parseJournaldLogs(raw: string): LogLine[] {
  const lines = raw.split("\n").filter(Boolean);
  const result: LogLine[] = [];
  for (const line of lines) {
    try {
      const obj = JSON.parse(line);
      const priority = parseInt(obj.PRIORITY ?? "6");
      const tsUs = parseInt(obj.__REALTIME_TIMESTAMP ?? obj._SOURCE_REALTIME_TIMESTAMP ?? "0");
      result.push({
        level: priority <= 3 ? "error" : priority === 4 ? "warn" : "info",
        source: String(obj.SYSLOG_IDENTIFIER || obj._COMM || "system").slice(0, 64),
        message: String(obj.MESSAGE || "").slice(0, 500),
        ts: tsUs > 0 ? Math.floor(tsUs / 1000) : Date.now(),
      });
    } catch {
      // syslog text fallback: "Jan 15 12:34:56 host sshd[123]: message"
      const m = line.match(/^\S+\s+\S+\s+\S+\s+\S+\s+(\S+?)(?:\[\d+\])?:\s+(.+)$/);
      if (m) result.push({ level: "warn", source: m[1].slice(0, 64), message: m[2].slice(0, 500), ts: Date.now() });
    }
  }
  return result;
}

function execSSH(client: Client, command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    client.exec(command, (err, stream) => {
      if (err) return reject(err);
      let out = "";
      stream.on("data", (d: Buffer) => (out += d.toString()));
      stream.stderr.on("data", () => {}); // ignore stderr
      stream.on("close", () => resolve(out.trim()));
    });
  });
}

export async function collectViaSSH(
  ip: string,
  port: number,
  sshUser: string,
  sshPasswordEncrypted: string,
  serverType: string
): Promise<{ metrics: CollectedMetrics; logs: LogLine[]; connectedUsers: ConnectedUser[] }> {
  const password = decryptPassword(sshPasswordEncrypted);

  return new Promise((resolve, reject) => {
    const client = new Client();
    const timeout = setTimeout(() => {
      client.destroy();
      reject(new Error("SSH timeout (>8s)"));
    }, 8000);

    client.on("ready", async () => {
      try {
        const script = `
CPU=$(grep 'cpu ' /proc/stat | awk '{u=$2+$4+$6; t=$2+$3+$4+$5+$6+$7+$8+$9+$10; printf "%.1f", u/t*100}')
RAM=$(free | awk '/Mem/{printf "%.1f", $3/$2*100}')
DISK=$(df / | awk 'NR==2{gsub(/%/,"",$5); print $5}')
UPTIME=$(awk '{print int($1)}' /proc/uptime)
USERS=$(who | wc -l | tr -d ' ')
PLAYERS=0
${serverType === "game" ? `PLAYERS=$(curl -s --max-time 3 http://localhost:30120/players.json 2>/dev/null | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo 0)` : ""}
echo "$CPU $RAM $DISK $UPTIME $USERS $PLAYERS"
`.trim();

        const logsCmd =
          "journalctl --no-pager -n 40 -p 4 --output=json 2>/dev/null || " +
          "tail -n 40 /var/log/syslog 2>/dev/null || " +
          "tail -n 40 /var/log/messages 2>/dev/null || true";

        const [metricsRaw, logsRaw, whoRaw] = await Promise.all([
          execSSH(client, `bash -c '${script.replace(/'/g, "'\\''")}'`),
          execSSH(client, logsCmd),
          execSSH(client, "who 2>/dev/null || true"),
        ]);

        const connectedUsers = parseWhoOutput(whoRaw);
        const parts = metricsRaw.split(/\s+/);
        resolve({
          metrics: {
            cpuPercent:    parseFloat(parts[0]) || 0,
            ramPercent:    parseFloat(parts[1]) || 0,
            diskPercent:   parseFloat(parts[2]) || 0,
            uptimeSeconds: parseInt(parts[3]) || 0,
            activeUsers:   connectedUsers.length || parseInt(parts[4]) || 0,
            playersOnline: parseInt(parts[5]) || 0,
          },
          logs: parseJournaldLogs(logsRaw),
          connectedUsers,
        });
      } catch (e) {
        reject(e);
      } finally {
        clearTimeout(timeout);
        client.end();
      }
    });

    client.on("error", (e) => {
      clearTimeout(timeout);
      reject(e);
    });

    client.connect({
      host: ip,
      port,
      username: sshUser,
      password,
      readyTimeout: 8000,
    });
  });
}
