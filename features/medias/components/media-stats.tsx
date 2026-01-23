"use client";

interface MediaStatsProps {
  totalAssets: number;
  fileTypes: number;
}

export default function MediaStats({ totalAssets, fileTypes }: MediaStatsProps) {
  return (
    <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
      <div className="rounded-xl border bg-card/50 p-4 backdrop-blur-sm">
        <p className="text-sm font-medium text-muted-foreground">Total Assets</p>
        <p className="mt-2 text-3xl font-bold text-foreground">{totalAssets}</p>
      </div>
      <div className="rounded-xl border bg-card/50 p-4 backdrop-blur-sm">
        <p className="text-sm font-medium text-muted-foreground">File Types</p>
        <p className="mt-2 text-3xl font-bold text-foreground">{fileTypes}</p>
      </div>

    </div>
  );
}

