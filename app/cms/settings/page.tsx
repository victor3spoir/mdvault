import PageLayout from '@/features/shared/components/page-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { IconDeviceFloppy, IconBrandGithub, IconKey, IconWorld } from '@tabler/icons-react'

export default function SettingsPage() {
  return (
    <PageLayout
      title="Settings"
      description="Configure your CMS preferences"
      breadcrumbs={[
        { label: 'Dashboard', href: '/cms' },
        { label: 'Settings' },
      ]}
    >
      <div className=" space-y-8">
        {/* GitHub Configuration */}
        <div className="rounded-xl border bg-card">
          <div className="flex items-center gap-3 border-b p-6">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <IconBrandGithub className="size-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">GitHub Repository</h2>
              <p className="text-sm text-muted-foreground">
                Configure your content repository
              </p>
            </div>
          </div>
          <div className="space-y-4 p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="owner">Repository Owner</Label>
                <Input id="owner" placeholder="username" defaultValue="victor3spoir" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="repo">Repository Name</Label>
                <Input id="repo" placeholder="my-content" defaultValue="victorespoir-contents" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch">Branch</Label>
              <Input id="branch" placeholder="main" defaultValue="main" />
            </div>
          </div>
        </div>

        {/* API Configuration */}
        <div className="rounded-xl border bg-card">
          <div className="flex items-center gap-3 border-b p-6">
            <div className="flex size-10 items-center justify-center rounded-lg bg-purple-500/10">
              <IconKey className="size-5 text-purple-500" />
            </div>
            <div>
              <h2 className="font-semibold">Authentication</h2>
              <p className="text-sm text-muted-foreground">
                Manage your access tokens
              </p>
            </div>
          </div>
          <div className="space-y-4 p-6">
            <div className="space-y-2">
              <Label htmlFor="token">GitHub Personal Access Token</Label>
              <Input
                id="token"
                type="password"
                placeholder="ghp_xxxxxxxxxxxx"
                defaultValue="••••••••••••••••"
              />
              <p className="text-xs text-muted-foreground">
                Token is stored securely in environment variables
              </p>
            </div>
          </div>
        </div>

        {/* Site Configuration */}
        <div className="rounded-xl border bg-card">
          <div className="flex items-center gap-3 border-b p-6">
            <div className="flex size-10 items-center justify-center rounded-lg bg-green-500/10">
              <IconWorld className="size-5 text-green-500" />
            </div>
            <div>
              <h2 className="font-semibold">Site Settings</h2>
              <p className="text-sm text-muted-foreground">
                General site configuration
              </p>
            </div>
          </div>
          <div className="space-y-4 p-6">
            <div className="space-y-2">
              <Label htmlFor="siteName">Site Name</Label>
              <Input id="siteName" placeholder="My Portfolio" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="siteUrl">Site URL</Label>
              <Input id="siteUrl" placeholder="https://example.com" />
            </div>
          </div>
        </div>

        <Separator />

        <div className="flex justify-end">
          <Button className="gap-2">
            <IconDeviceFloppy className="size-4" />
            Save Settings
          </Button>
        </div>
      </div>
    </PageLayout>
  )
}
