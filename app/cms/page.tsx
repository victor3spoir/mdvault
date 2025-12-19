import PageLayout from '@/features/shared/components/page-layout'
import { getDashboardStatsAction, getRecentActivityAction } from './actions/dashboard.actions'
import {
  IconFileText,
  IconPhoto,
  IconEye,
} from '@tabler/icons-react'
import Link from 'next/link'

const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

const getActivityIcon = (icon: string) => {
  switch (icon) {
    case 'eye':
      return IconEye
    case 'image':
      return IconPhoto
    default:
      return IconFileText
  }
}

const Page = async () => {
  const stats = await getDashboardStatsAction()
  const activities = await getRecentActivityAction()

  const statsCards = [
    {
      title: 'Total Posts',
      value: stats.totalPosts.toString(),
      description: 'Total articles',
      icon: IconFileText,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'Published Posts',
      value: stats.publishedPosts.toString(),
      description: 'Published articles',
      icon: IconEye,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
    {
      title: 'Draft Posts',
      value: stats.draftPosts.toString(),
      description: 'Unpublished articles',
      icon: IconFileText,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    {
      title: 'Media Files',
      value: stats.mediaFiles.toString(),
      description: 'Images & files',
      icon: IconPhoto,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
  ]

  const quickActions = [
    { title: 'New Post', href: '/cms/posts/new', icon: IconFileText },
    { title: 'View Posts', href: '/cms/posts', icon: IconEye },
    { title: 'Upload Media', href: '/cms/media', icon: IconPhoto },
  ]

  return (
    <PageLayout
      title="Dashboard"
      description="Welcome back! Here's an overview of your content."
      breadcrumbs={[{ label: 'Dashboard' }]}
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
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <p className="mt-2 text-3xl font-bold">{stat.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{stat.description}</p>
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
              href={action.href as '/'}
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
      <div>
        <h2 className="mb-4 text-lg font-semibold">Recent Activity</h2>
        <div className="rounded-xl border bg-card">
          <div className="flex flex-col divide-y">
            {activities.length === 0 ? (
              <div className="flex items-center justify-center p-8 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                  <p className="text-xs text-muted-foreground/70">Start creating posts and uploading images</p>
                </div>
              </div>
            ) : (
              activities.map((activity) => {
                const ActivityIcon = getActivityIcon(activity.icon)
                return (
                  <div key={activity.id} className="flex items-center gap-4 p-4">
                    <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                      <ActivityIcon className="size-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{activity.title}</p>
                      <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">{formatTime(activity.timestamp)}</p>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  )
}

export default Page