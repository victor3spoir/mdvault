import { IconEye, IconFileText, IconPhoto } from "@tabler/icons-react";
import Link from "next/link";
import PageLayout from "@/features/shared/components/page-layout";
import { RecentActivity } from "@/features/shared/components/recent-activity";
import {
  getDashboardStatsAction,
  getRecentActivityAction,
} from "../../features/dashboard/dashboard.actions";

const Page = async () => {
  const stats = await getDashboardStatsAction();
  const activities = await getRecentActivityAction();

  const statsCards = [
    {
      title: "Total Articles",
      value: stats.totalArticles.toString(),
      description: "Total articles",
      icon: IconFileText,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Published Articles",
      value: stats.publishedArticles.toString(),
      description: "Published articles",
      icon: IconEye,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      title: "Draft Articles",
      value: stats.draftArticles.toString(),
      description: "Unpublished articles",
      icon: IconFileText,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      title: "Media Files",
      value: stats.mediaFiles.toString(),
      description: "Images & files",
      icon: IconPhoto,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
  ];

  const quickActions = [
    { title: "New Article", href: "/cms/articles/new", icon: IconFileText },
    { title: "View Posts", href: "/cms/articles", icon: IconEye },
    { title: "Upload Media", href: "/cms/media", icon: IconPhoto },
  ];

  return (
    <PageLayout
      title="Dashboard"
      description="Welcome back! Here's an overview of your content."
      breadcrumbs={[{ label: "Dashboard" }]}
    >
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <div
            key={stat.title}
            className="group relative overflow-hidden rounded-xl border bg-card p-6 transition-all hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </p>
                <p className="mt-2 text-3xl font-bold">{stat.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </div>
              <div className={`rounded-lg p-2.5 ${stat.bg}`}>
                <stat.icon className={`size-5 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href as "/"}
              className="flex items-center gap-4 rounded-xl border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <action.icon className="size-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{action.title}</p>
                <p className="text-sm text-muted-foreground">Get started</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      {/* <RecentActivity activities={activities} /> */}
    </PageLayout>
  );
};

export default Page;
