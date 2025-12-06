type LogLevel = "info" | "warn" | "error";

function log(level: LogLevel, msg: string, context?: Record<string, unknown>) {
  const payload = context ? ` ${JSON.stringify(context)}` : "";
  console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](
    `[${new Date().toISOString()}] [${level.toUpperCase()}] ${msg}${payload}`
  );
}

export const logger = {
  info: (msg: string, ctx?: Record<string, unknown>) => log("info", msg, ctx),
  warn: (msg: string, ctx?: Record<string, unknown>) => log("warn", msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => log("error", msg, ctx),
};

