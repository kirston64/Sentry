export type TerminalLineType = "input" | "output" | "error" | "system";

export interface TerminalLine {
  id: string;
  type: TerminalLineType;
  content: string;
  timestamp: string;
}
