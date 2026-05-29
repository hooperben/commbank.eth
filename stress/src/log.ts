// One-line JSON log per event so `docker compose logs stress | jq` works.
// Errors are anything with level === "error".

type Level = "info" | "warn" | "error";

export type LogEntry = {
  ts: string;
  level: Level;
  source: string;
  msg: string;
  [k: string]: unknown;
};

export const log = (
  level: Level,
  source: string,
  msg: string,
  fields: Record<string, unknown> = {},
) => {
  const entry: LogEntry = {
    ts: new Date().toISOString(),
    level,
    source,
    msg,
    ...fields,
  };
  process.stdout.write(JSON.stringify(entry) + "\n");
};

export const info = (source: string, msg: string, fields?: Record<string, unknown>) =>
  log("info", source, msg, fields);
export const warn = (source: string, msg: string, fields?: Record<string, unknown>) =>
  log("warn", source, msg, fields);
export const error = (source: string, msg: string, fields?: Record<string, unknown>) =>
  log("error", source, msg, fields);
