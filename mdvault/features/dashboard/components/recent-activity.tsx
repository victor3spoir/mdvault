"use client";

import {
  IconClock,
  IconEdit,
  IconEye,
  IconFileText,
  IconPhoto,
} from "@tabler/icons-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Activity } from "../dashboard.types";

const iconMap = {
  file: IconFileText,
  image: IconPhoto,
  eye: IconEye,
  edit: IconEdit,
};

const colorMap = {
  article_created: "text-blue-500 bg-blue-500/10",
  article_published: "text-green-500 bg-green-500/10",
  article_updated: "text-amber-500 bg-amber-500/10",
  image_uploaded: "text-purple-500 bg-purple-500/10",
};

interface RecentActivityProps {
  activities: Activity[];
}

export function RecentActivity({ activities }: Readonly<RecentActivityProps>) {
  if (activities.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">No recent activity yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
      </div>
      <div className="rounded-xl border bg-card">
        <div className="divide-y">
          {activities.map((activity) => {
            const Icon =
              iconMap[activity.icon as keyof typeof iconMap] || IconFileText;
            const colorClass =
              colorMap[activity.type as keyof typeof colorMap] ||
              "text-gray-500 bg-gray-500/10";

            return (
              <div
                key={activity.id}
                className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/50"
              >
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full",
                    colorClass,
                  )}
                >
                  <Icon className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm sm:text-base truncate">
                    {activity.title}:{" "}
                    <span className="font-normal text-muted-foreground">
                      {activity.description}
                    </span>
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                    <IconClock className="size-3.5" />
                    <span>
                      {formatDistanceToNow(new Date(activity.timestamp), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
                {activity.link && (
                  <Link
                    href={activity.link as "/"}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    View
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
