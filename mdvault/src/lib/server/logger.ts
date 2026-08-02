type LogLevel = "info" | "warn" | "error";

const SENSITIVE_PATTERNS = [
	/ghp_[a-zA-Z0-9]+/g,
	/github_pat_[a-zA-Z0-9_]+/g,
	/ghs_[a-zA-Z0-9]+/g,
	/ghu_[a-zA-Z0-9]+/g,
	/token\s*[:=]\s*[^\s,}]+/gi,
];

function maskSensitiveData(value: string): string {
	return SENSITIVE_PATTERNS.reduce(
		(masked, pattern) => masked.replace(pattern, "***REDACTED***"),
		value,
	);
}

function log(
	level: LogLevel,
	message: string,
	context?: Record<string, unknown>,
) {
	const prefix = `[${new Date().toISOString()}] [${level.toUpperCase()}]`;
	// Context is masked too: it routinely carries paths, URLs and error payloads
	// that can echo a token back into the logs.
	const details = context
		? ` ${maskSensitiveData(JSON.stringify(context))}`
		: "";
	const line = `${prefix} ${maskSensitiveData(message)}${details}`;

	if (level === "error") {
		console.error(line);
		return;
	}

	if (level === "warn") {
		console.warn(line);
		return;
	}

	console.log(line);
}

export const logger = {
	info(message: string, context?: Record<string, unknown>) {
		log("info", message, context);
	},
	warn(message: string, context?: Record<string, unknown>) {
		log("warn", message, context);
	},
	error(message: string, error?: unknown, context?: Record<string, unknown>) {
		log("error", message, {
			...context,
			error:
				error instanceof Error
					? { name: error.name, message: maskSensitiveData(error.message) }
					: error,
		});
	},
};

export function createSafeErrorMessage(error: unknown): string {
	// Default to the safe message: only an explicit development environment ever
	// exposes internal error details to a caller.
	if (process.env.NODE_ENV !== "development") {
		return "An error occurred. Please try again later.";
	}

	if (error instanceof Error) {
		return error.message;
	}

	return String(error);
}
