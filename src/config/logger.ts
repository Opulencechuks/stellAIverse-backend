import pino from "pino";
import { loggerContextStore } from "../common/logger-context.store";

const env = process.env.NODE_ENV || "development";
const isDevelopment = env === "development" || env === "dev";
const isProduction = env === "production" || env === "prod";
const isStaging = env === "staging";

// Map configured log level or default based on environment
const getLogLevel = () => {
  if (process.env.LOG_LEVEL) {
    return process.env.LOG_LEVEL.toLowerCase();
  }
  if (isDevelopment) {
    return "debug";
  }
  return "info";
};

// Select transport based on environment
const getTransport = () => {
  if (isDevelopment) {
    return {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname",
      },
    };
  }
  // Production / Staging: log to a file (outputs structured JSON)
  return {
    target: "pino/file",
    options: {
      destination: "logs/combined.log",
      mkdir: true,
    },
  };
};

export const logger = pino({
  level: getLogLevel(),
  transport: getTransport(),
  mixin() {
    const store = loggerContextStore.getStore();
    return store ? { correlationId: store.correlationId } : {};
  },
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  base: {
    env,
    service: "stellAIverse-backend",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Helper function to create child loggers with context
export const createLogger = (context: Record<string, any>) => {
  return logger.child(context);
};
