/**
 * Secure logging utility that prevents exposure of sensitive data
 * - Never logs tokens, secrets, or environment variables
 * - Never logs full error stacks in production
 * - Only logs to server-side console (never to client)
 */

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogContext {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

/**
 * List of patterns that indicate sensitive data
 */
const SENSITIVE_PATTERNS = [
  /ghp_[a-zA-Z0-9]+/g, // GitHub personal token
  /github_pat_[a-zA-Z0-9]+/g, // GitHub long-lived token
  /ghs_[a-zA-Z0-9]+/g, // GitHub app token
  /ghu_[a-zA-Z0-9]+/g, // GitHub user token
  /GITHUB_TOKEN\s*[:=]\s*[^\s,}]+/gi, // Environment variable assignment
  /Authorization:\s*[^\s]+/gi, // Authorization header
  /password\s*[:=]\s*[^\s,}]+/gi, // Password fields
  /secret\s*[:=]\s*[^\s,}]+/gi, // Secret fields
  /api[_-]?key\s*[:=]\s*[^\s,}]+/gi, // API keys
  /token\s*[:=]\s*[^\s,}]+/gi, // Token fields
];

/**
 * Mask sensitive data in strings
 */
function maskSensitiveData(str: string): string {
  if (typeof str !== "string") {
    return String(str);
  }

  let masked = str;

  for (const pattern of SENSITIVE_PATTERNS) {
    masked = masked.replace(pattern, "***REDACTED***");
  }

  return masked;
}

/**
 * Clean error object - remove sensitive data and limit stack trace
 */
function cleanError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    const cleaned: Record<string, unknown> = {
      name: error.name,
      message: maskSensitiveData(error.message),
    };

    // Only include stack in development
    if (process.env.NODE_ENV === "development" && error.stack) {
      cleaned.stack = error.stack;
    }

    return cleaned;
  }

  if (typeof error === "object" && error !== null) {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(error)) {
      if (key.toLowerCase().includes("token") || key.toLowerCase().includes("secret")) {
        cleaned[key] = "***REDACTED***";
      } else if (typeof value === "string") {
        cleaned[key] = maskSensitiveData(value);
      } else {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }

  return { message: String(error) };
}

/**
 * Clean context object - mask sensitive data
 */
function cleanContext(context: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(context)) {
    // Skip sensitive keys entirely
    if (
      key.toLowerCase().includes("token") ||
      key.toLowerCase().includes("secret") ||
      key.toLowerCase().includes("password") ||
      key.toLowerCase().includes("api_key") ||
      key.toLowerCase().includes("apikey")
    ) {
      cleaned[key] = "***REDACTED***";
      continue;
    }

    // Mask sensitive data in strings
    if (typeof value === "string") {
      cleaned[key] = maskSensitiveData(value);
    } else if (value instanceof Error) {
      cleaned[key] = cleanError(value);
    } else if (typeof value === "object" && value !== null) {
      // Recursively clean nested objects
      cleaned[key] = cleanContext(value as Record<string, unknown>);
    } else {
      cleaned[key] = value;
    }
  }

  return cleaned;
}

/**
 * Format log message for console output
 */
function formatLogMessage(logContext: LogContext): string {
  const prefix = `[${logContext.timestamp}] [${logContext.level.toUpperCase()}]`;
  const contextStr = logContext.context ? ` ${JSON.stringify(logContext.context)}` : "";
  return `${prefix} ${logContext.message}${contextStr}`;
}

/**
 * Internal logging function
 */
function log(level: LogLevel, message: string, error?: unknown, context?: Record<string, unknown>) {
  // Never log in non-server environments
  if (typeof window !== "undefined") {
    return;
  }

  const timestamp = new Date().toISOString();
  const logContext: LogContext = {
    timestamp,
    level,
    message: maskSensitiveData(message),
    context: context ? cleanContext(context) : undefined,
  };

  const formattedMessage = formatLogMessage(logContext);

  switch (level) {
    case "error":
      if (error) {
        const cleanedError = cleanError(error);
        console.error(formattedMessage, cleanedError);
      } else {
        console.error(formattedMessage);
      }
      break;
    case "warn":
      console.warn(formattedMessage);
      break;
    case "debug":
      if (process.env.NODE_ENV === "development") {
        console.debug(formattedMessage);
      }
      break;
    case "info":
    default:
      console.log(formattedMessage);
  }
}

/**
 * Public logger API
 */
export const logger = {
  /**
   * Log error message with optional error object and context
   * @example
   * logger.error("Failed to fetch article", error, { articleId: "123" })
   */
  error: (message: string, error?: unknown, context?: Record<string, unknown>) => {
    log("error", message, error, context);
  },

  /**
   * Log warning message with optional context
   * @example
   * logger.warn("Rate limit approaching", { remaining: 10 })
   */
  warn: (message: string, context?: Record<string, unknown>) => {
    log("warn", message, undefined, context);
  },

  /**
   * Log info message with optional context
   * @example
   * logger.info("Article created", { articleId: "123", title: "Example" })
   */
  info: (message: string, context?: Record<string, unknown>) => {
    log("info", message, undefined, context);
  },

  /**
   * Log debug message with optional context (only in development)
   * @example
   * logger.debug("Cache hit", { key: "articles" })
   */
  debug: (message: string, context?: Record<string, unknown>) => {
    log("debug", message, undefined, context);
  },
};

/**
 * Helper to ensure sensitive data never leaks in error messages
 */
export function createSafeErrorMessage(error: unknown): string {
  const isProduction = process.env.NODE_ENV === "production";

  if (error instanceof Error) {
    // In production, return generic message
    if (isProduction) {
      // Log the actual error server-side for debugging
      logger.error("Operation failed", error);
      return "An error occurred. Please try again later.";
    }

    // In development, include safe error details
    return error.message;
  }

  if (isProduction) {
    logger.error("Unknown error occurred", error);
    return "An error occurred. Please try again later.";
  }

  return String(error);
}
