export function SkeletonLoader() {
  return (
    <div className="space-y-4">
      <div className="h-24 rounded-lg bg-muted animate-pulse" />
      <div className="h-24 rounded-lg bg-muted animate-pulse" />
      <div className="h-24 rounded-lg bg-muted animate-pulse" />
    </div>
  );
}

export function SkeletonCard() {
  return <div className="h-40 rounded-lg bg-muted animate-pulse" />;
}

export function SkeletonText() {
  return <div className="h-4 rounded bg-muted animate-pulse" />;
}
