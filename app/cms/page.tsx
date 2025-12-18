import PageLayout from '@/features/shared/components/page-layout'
import {
  IconFileText,
  IconPhoto,
  IconEye,
  IconTrendingUp,
} from '@tabler/icons-react'
import Link from 'next/link'

const statsCards = [
  {
    title: 'Total Posts',
    value: '12',
    description: 'Published articles',
    icon: IconFileText,
    trend: '+2 this month',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    title: 'Media Files',
    value: '48',
    description: 'Images & files',
    icon: IconPhoto,
    trend: '+8 this month',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
  {
    title: 'Total Views',
    value: '2.4k',
    description: 'All time views',
    icon: IconEye,
    trend: '+12% vs last month',
    color: 'text-green-500',
    bg: 'bg-green-500/10',
  },
  {
    title: 'Growth',
    value: '+24%',
    description: 'Engagement rate',
    icon: IconTrendingUp,
    trend: 'Trending up',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
  },
]

const quickActions = [
  { title: 'New Post', href: '/cms/posts/new', icon: IconFileText },
  { title: 'View Posts', href: '/cms/posts', icon: IconEye },
  { title: 'Upload Media', href: '/cms/media', icon: IconPhoto },
]

const Page = () => {
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
            <div className="mt-4 flex items-center gap-1 text-xs text-muted-foreground">
              <IconTrendingUp className="size-3 text-green-500" />
              <span>{stat.trend}</span>
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
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                  <IconFileText className="size-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Post updated</p>
                  <p className="text-sm text-muted-foreground">
                    Sample post title was modified
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">2h ago</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  )
}

export default Page