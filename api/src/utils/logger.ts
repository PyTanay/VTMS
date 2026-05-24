/**
 * Structured logging utility for VTMS.
 * Provides consistent logging levels, formatting, and context.
 * Logs are written to console with structured format and optionally to file.
 */
import fs from "fs";
import path from "path";

export type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  data?: Record<string, any>;
  error?: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const CURRENT_LOG_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || "info";

// ── Log file (optional, only if LOG_FILE is set) ──
const LOG_FILE = process.env.LOG_FILE || "";

const writeToFile = (entry: LogEntry) => {
  if (!LOG_FILE) return;
  try {
    const logDir = path.dirname(LOG_FILE);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + "\n");
  } catch {
    // File logging is best-effort
  }
};

const formatTimestamp = (): string => {
  return new Date().toISOString();
};

const shouldLog = (level: LogLevel): boolean => {
  return LOG_LEVELS[level] >= LOG_LEVELS[CURRENT_LOG_LEVEL];
};

const extractError = (error: unknown): string | undefined => {
  if (error === undefined || error === null) return undefined;
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (typeof error === "object") {
    const obj = error as Record<string, any>;
    return obj.message || obj.code || String(error);
  }
  return String(error);
};

const createLogFn = (level: LogLevel) => {
  return (context: string, message: string, data?: Record<string, any>, error?: unknown) => {
    if (!shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: formatTimestamp(),
      level,
      context,
      message,
      data,
      error: extractError(error),
    };

    const prefix = `[${entry.timestamp}] [${level.toUpperCase()}] [${context}]`;
    const suffix = data ? ` | ${JSON.stringify(data)}` : "";
    const errSuffix = entry.error ? ` | Error: ${entry.error}` : "";

    switch (level) {
      case "error":
        console.error(`${prefix} ${message}${suffix}${errSuffix}`, error instanceof Error ? error : "");
        break;
      case "warn":
        console.warn(`${prefix} ${message}${suffix}${errSuffix}`);
        break;
      case "debug":
        console.debug(`${prefix} ${message}${suffix}${errSuffix}`);
        break;
      default:
        console.log(`${prefix} ${message}${suffix}${errSuffix}`);
    }

    writeToFile(entry);
  };
};

// ── Public API ──

export const logger = {
  debug: createLogFn("debug"),
  info: createLogFn("info"),
  warn: createLogFn("warn"),
  error: createLogFn("error"),

  /**
   * Create a child logger with a fixed context prefix.
   */
  child: (context: string) => ({
    debug: (message: string, data?: Record<string, any>) => createLogFn("debug")(context, message, data),
    info: (message: string, data?: Record<string, any>) => createLogFn("info")(context, message, data),
    warn: (message: string, data?: Record<string, any>) => createLogFn("warn")(context, message, data),
    error: (message: string, error?: unknown, data?: Record<string, any>) => createLogFn("error")(context, message, data, error),
  }),
};

// ── Pre-created loggers for common components ──

export const log = {
  email: logger.child("EMAIL"),
  cron: logger.child("CRON"),
  queue: logger.child("QUEUE"),
  auth: logger.child("AUTH"),
  db: logger.child("DB"),
  api: logger.child("API"),
  pdf: logger.child("PDF"),
  samvad: logger.child("SAMVAD"),
  audit: logger.child("AUDIT"),
};

export default logger;
