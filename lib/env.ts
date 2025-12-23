export interface EnvVars {
  NODE_ENV: string | undefined;
  GITHUB_TOKEN: string;
  GITHUB_OWNER: string;
  GITHUB_REPO: string;
}

export default function getenv(): EnvVars {
  const NODE_ENV = process.env.NODE_ENV;
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_OWNER = process.env.GITHUB_OWNER;
  const GITHUB_REPO = process.env.GITHUB_REPO;

  // Validation: Check required env vars
  const required = { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO };
  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. ` +
        `Please set them in your .env.local or environment.`,
    );
  }

  // At this point, we know these are strings due to validation above
  const token = GITHUB_TOKEN as string;
  const owner = GITHUB_OWNER as string;
  const repo = GITHUB_REPO as string;

  // Validation: Check token format
  if (!token.startsWith("ghp_") && !token.startsWith("github_pat_")) {
    console.warn(
      "Warning: GITHUB_TOKEN does not appear to be a valid GitHub token. " +
        "Expected format: ghp_* or github_pat_*",
    );
  }

  // Validation: Check owner and repo are not empty
  if (owner.trim().length === 0) {
    throw new Error("GITHUB_OWNER cannot be empty");
  }

  if (repo.trim().length === 0) {
    throw new Error("GITHUB_REPO cannot be empty");
  }

  return {
    NODE_ENV,
    GITHUB_TOKEN: token,
    GITHUB_OWNER: owner,
    GITHUB_REPO: repo,
  };
}
