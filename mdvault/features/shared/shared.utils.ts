export function formatDate(date: Date) {
  return date.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
export const formatTime = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    // Use a stable 'now' for build environments, actual 'now' for runtime
    const now =
      typeof window === "undefined" &&
      process.env.NEXT_PHASE === "phase-production-build"
        ? new Date(timestamp) // Default to same time as the event to be safe during build
        : new Date();

    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return new Date(timestamp).toLocaleDateString();
  } catch {
    return new Date(timestamp).toLocaleDateString();
  }
};
