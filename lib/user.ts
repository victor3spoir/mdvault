import getenv from "./env";

/**
 * Get the current app user (GitHub owner configured in environment)
 */
export function getCurrentUser(): string {
  const env = getenv();
  return env.GITHUB_OWNER;
}
