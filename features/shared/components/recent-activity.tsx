"use client";

import { IconEye, IconFileText, IconPhoto } from "@tabler/icons-react";
import type { Activity } from "@/features/dashboard/dashboard.actions";

interface RecentActivityProps {
  activities: Activity[];
}

const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(timestamp).toLocaleDateString();
};

const getActivityIcon = (
  icon: string,
): React.ComponentType<React.SVGProps<SVGSVGElement>> => {
  const icons: Record<
    string,
    React.ComponentType<React.SVGProps<SVGSVGElement>>
  > = {
    eye: IconEye,
    file: IconFileText,
    photo: IconPhoto,
  };
  return icons[icon] || IconFileText;
};

export const RecentActivity = ({ activities }: RecentActivityProps) => {
  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Recent Activity</h2>
      <div className="rounded-xl border bg-card">
        <div className="flex flex-col divide-y">
          {activities.length === 0 ? (
            <div className="flex items-center justify-center p-8 text-center">
              <div>
                <p className="text-sm text-muted-foreground">
                  No recent activity
                </p>
                <p className="text-xs text-muted-foreground/70">
                  Start creating articles and uploading images
                </p>
              </div>
            </div>
          ) : (
            activities.map((activity) => {
              const ActivityIcon = getActivityIcon(activity.icon);
              return (
                <div key={activity.id} className="flex items-center gap-4 p-4">
                  <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                    <ActivityIcon className="size-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {activity.description}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatTime(activity.timestamp)}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
