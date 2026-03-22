import type { TerminalLine } from "@/types/console";

function line(content: string, type: TerminalLine["type"] = "output"): TerminalLine {
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, type, content, timestamp: new Date().toISOString() };
}

const FAKE_PLAYERS = [
  { id: 1, name: "Viktor_Petrov", ping: 42, playtime: "3h 12m" },
  { id: 2, name: "Alena_Kuz", ping: 67, playtime: "1h 45m" },
  { id: 3, name: "MaxDrift", ping: 28, playtime: "5h 03m" },
  { id: 4, name: "DarkRacer", ping: 91, playtime: "0h 32m" },
  { id: 5, name: "IceQueen", ping: 55, playtime: "2h 18m" },
  { id: 6, name: "Shadow_X", ping: 38, playtime: "4h 51m" },
  { id: 7, name: "NeonBlade", ping: 73, playtime: "1h 09m" },
  { id: 8, name: "CyberWolf", ping: 44, playtime: "6h 27m" },
];

const RESOURCES = [
  "es_extended", "esx_identity", "esx_skin", "esx_vehicleshop",
  "esx_policejob", "esx_ambulancejob", "esx_mechanicjob",
  "mythic_notify", "mythic_progbar", "dpemotes", "pma-voice",
  "ox_inventory", "ox_lib", "ox_target", "qb-phone",
  "wasabi_carlock", "cd_garage", "loaf_housing", "sentry_anticheat",
  "sentry_admin", "sentry_logs", "sentry_weather",
];

const WEATHER_TYPES = ["clear", "clouds", "rain", "thunder", "snow", "fog", "overcast"];

export function handleCommand(input: string, serverName: string): TerminalLine[] {
  const parts = input.trim().split(/\s+/);
  const cmd = parts[0]?.toLowerCase();
  const args = parts.slice(1);

  switch (cmd) {
    case "help":
      return [
        line("Доступные команды:", "system"),
        line("  help        — Список команд"),
        line("  status      — Статус сервера"),
        line("  players     — Список игроков"),
        line("  kick <name> — Кикнуть игрока"),
        line("  say <msg>   — Broadcast сообщение"),
        line("  resources   — Запущенные ресурсы"),
        line("  restart     — Перезапуск сервера"),
        line("  uptime      — Аптайм сервера"),
        line("  weather <t> — Сменить погоду"),
        line("  clear       — Очистить консоль"),
      ];

    case "status":
      return [
        line(`═══ ${serverName} ═══`, "system"),
        line(`  Status:    ONLINE`),
        line(`  Players:   ${FAKE_PLAYERS.length}/128`),
        line(`  Uptime:    3d 4h 22m`),
        line(`  Tick Rate: 64`),
        line(`  Resources: ${RESOURCES.length} running`),
        line(`  Game Mode: Roleplay`),
        line(`  Map:       Los Santos`),
      ];

    case "players": {
      const lines: TerminalLine[] = [
        line(`ID  | Name            | Ping | Playtime`, "system"),
        line(`----+-----------------+------+---------`, "system"),
      ];
      FAKE_PLAYERS.forEach((p) => {
        lines.push(line(
          `${String(p.id).padStart(3)} | ${p.name.padEnd(15)} | ${String(p.ping).padStart(4)} | ${p.playtime}`
        ));
      });
      lines.push(line(`\nTotal: ${FAKE_PLAYERS.length} players online`, "system"));
      return lines;
    }

    case "kick": {
      const name = args.join(" ");
      if (!name) return [line("Usage: kick <player_name>", "error")];
      const player = FAKE_PLAYERS.find((p) => p.name.toLowerCase() === name.toLowerCase());
      if (player) return [line(`Player '${player.name}' has been kicked from the server.`, "system")];
      return [line(`Player '${name}' not found.`, "error")];
    }

    case "say": {
      const msg = args.join(" ");
      if (!msg) return [line("Usage: say <message>", "error")];
      return [line(`[BROADCAST] ${msg}`, "system")];
    }

    case "resources":
      return [
        line(`Running resources (${RESOURCES.length}):`, "system"),
        ...RESOURCES.map((r) => line(`  [RUNNING] ${r}`)),
      ];

    case "restart":
      return [
        line("Initiating server restart...", "system"),
        line("Saving world state..."),
        line("Notifying players..."),
        line("Disconnecting 8 players..."),
        line("Stopping resources..."),
        line("...", "system"),
        line("Server restarting...", "system"),
        line("Loading resources..."),
        line("Server is now ONLINE", "system"),
        line(`${serverName} restarted successfully.`, "system"),
      ];

    case "uptime":
      return [line(`Server uptime: 3 days, 4 hours, 22 minutes, 47 seconds`, "system")];

    case "weather": {
      const type = args[0]?.toLowerCase();
      if (!type) return [line(`Usage: weather <${WEATHER_TYPES.join("|")}>`, "error")];
      if (!WEATHER_TYPES.includes(type)) {
        return [line(`Unknown weather type. Available: ${WEATHER_TYPES.join(", ")}`, "error")];
      }
      return [line(`Weather changed to '${type}' for all players.`, "system")];
    }

    case "clear":
      return []; // handled by terminal

    case "":
    case undefined:
      return [];

    default:
      return [line(`Unknown command: '${cmd}'. Type 'help' for available commands.`, "error")];
  }
}
