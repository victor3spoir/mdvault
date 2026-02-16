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

  // Validation: Check token format (NEVER log the actual token)
  const validTokenPrefixes = ["ghp_", "github_pat_", "ghs_", "ghu_"];
  const isValidToken = validTokenPrefixes.some((prefix) =>
    token.startsWith(prefix),
  );

  if (!isValidToken) {
    throw new Error(
      "Invalid GITHUB_TOKEN format. Expected token to start with: ghp_, github_pat_, ghs_, or ghu_",
    );
  }

  // Validation: Check owner and repo are not empty
  if (owner.trim().length === 0) {
    throw new Error("GITHUB_OWNER cannot be empty");
  }

  if (repo.trim().length === 0) {
    throw new Error("GITHUB_REPO cannot be empty");
  }

  // Validation: Check owner/repo don't contain invalid characters
  if (!/^[a-zA-Z0-9_-]+$/.test(owner)) {
    throw new Error(
      "GITHUB_OWNER contains invalid characters. Only alphanumeric, hyphens, and underscores are allowed.",
    );
  }

  if (!/^[a-zA-Z0-9._-]+$/.test(repo)) {
    throw new Error(
      "GITHUB_REPO contains invalid characters. Only alphanumeric, dots, hyphens, and underscores are allowed.",
    );
  }

  return {
    NODE_ENV,
    GITHUB_TOKEN: token,
    GITHUB_OWNER: owner,
    GITHUB_REPO: repo,
  };
}
