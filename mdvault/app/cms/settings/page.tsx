import {
  IconBrandGithub,
  IconCircleCheck,
  IconKey,
  IconWorld,
} from "@tabler/icons-react";
import { Suspense } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import UserProfileCard from "@/features/settings/components/user-profile-card";
import { CopyToClipboard } from "@/features/shared/components/copy-to-clipboard";
import PageLayout from "@/features/shared/components/page-layout";
import getenv from "@/lib/env";

export default async function SettingsPage() {
  const env = getenv();

  return (
    <PageLayout
      title="Settings"
      description="Configure your CMS preferences"
      breadcrumbs={[
        { label: "Dashboard", href: "/cms" },
        { label: "Settings" },
      ]}
    >
      <div className="space-y-8">
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">
            Connected Account
          </h3>
          <Suspense
            fallback={
              <div className="rounded-xl border bg-card p-6 animate-pulse">
                <div className="h-24 bg-muted rounded" />
              </div>
            }
          >
            <UserProfileCard />
          </Suspense>
        </div>

        <Separator />

        {/* GitHub Configuration (Read-only) */}
        <div className="rounded-xl border bg-card">
          <div className="flex items-center gap-3 border-b p-6">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <IconBrandGithub className="size-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">GitHub Repository</h2>
              <p className="text-sm text-muted-foreground">
                Configured repository (read-only)
              </p>
            </div>
          </div>
          <div className="space-y-4 p-6 bg-muted/30">
            <div className="rounded-lg border border-muted-foreground/20 bg-background/50 p-4">
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Repository Owner
                  </dt>
                  <dd className="text-sm font-mono text-foreground flex items-center justify-between group">
                    <span>{env.GITHUB_OWNER}</span>
                    <CopyToClipboard
                      value={env.GITHUB_OWNER}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Repository Name
                  </dt>
                  <dd className="text-sm font-mono text-foreground flex items-center justify-between group">
                    <span>{env.GITHUB_REPO}</span>
                    <CopyToClipboard
                      value={env.GITHUB_REPO}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Branch
                  </dt>
                  <dd className="text-sm font-mono text-foreground flex items-center justify-between group">
                    <span>main</span>
                    <CopyToClipboard
                      value="main"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </dd>
                </div>
              </dl>
            </div>
            <p className="text-xs text-muted-foreground">
              ℹ️ Repository configuration is set via environment variables and
              cannot be changed here for security reasons.
            </p>
          </div>
        </div>

        {/* API Configuration (Read-only) */}
        <div className="rounded-xl border bg-card">
          <div className="flex items-center gap-3 border-b p-6">
            <div className="flex size-10 items-center justify-center rounded-lg bg-purple-500/10">
              <IconKey className="size-5 text-purple-500" />
            </div>
            <div>
              <h2 className="font-semibold">Authentication</h2>
              <p className="text-sm text-muted-foreground">
                Secure token storage
              </p>
            </div>
          </div>
          <div className="space-y-4 p-6 bg-muted/30">
            <div className="rounded-lg border border-muted-foreground/20 bg-background/50 p-4">
              <div className="space-y-2">
                <Label htmlFor="token">GitHub Personal Access Token</Label>
                <Input
                  id="token"
                  type="password"
                  placeholder="••••••••••••••••"
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
            <div className="flex items-start gap-2">
              <IconCircleCheck className="size-4 text-green-500 mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                Token is stored securely in environment variables. No changes
                can be made through the UI.
              </p>
            </div>
          </div>
        </div>

        {/* Site Configuration */}
        <div className="rounded-xl border bg-card">
          <div className="flex items-center gap-3 border-b p-6">
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10">
              <IconWorld className="size-5 text-blue-500" />
            </div>
            <div>
              <h2 className="font-semibold">Site Settings</h2>
              <p className="text-sm text-muted-foreground">
                General site configuration (coming soon)
              </p>
            </div>
          </div>
          <div className="space-y-4 p-6 opacity-50 pointer-events-none">
            <div className="space-y-2">
              <Label htmlFor="siteName">MDVault</Label>
              <Input id="siteName" placeholder="My Portfolio" disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="siteUrl">Site URL</Label>
              <Input id="siteUrl" placeholder="https://example.com" disabled />
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
