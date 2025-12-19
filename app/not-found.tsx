'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { IconError404, IconHome, IconArrowLeft } from '@tabler/icons-react'

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-linear-to-b from-background to-muted/30 px-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* 404 Display */}
        <div className="flex justify-center">
          <div className="relative">
            {/* Background glow effect */}
            <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full" />

            {/* Icon container */}
            <div className="relative rounded-full bg-primary/5 p-8 border border-primary/10">
              <IconError404 className="w-20 h-20 text-primary/60 mx-auto" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="text-center space-y-4">
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Page Not Found
            </h1>
            <p className="text-lg text-muted-foreground">
              We couldn't find what you're looking for.
            </p>
          </div>

          <p className="text-sm text-muted-foreground/80 max-w-md mx-auto leading-relaxed">
            The page you're looking for might have been removed, had its name changed, or is temporarily unavailable. Double-check the URL and try again.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link href="/" className="flex-shrink-0">
            <Button size="lg" className="w-full sm:w-auto gap-2">
              <IconHome className="w-4 h-4" />
              Go to Homepage
            </Button>
          </Link>

          <Button
            variant="outline"
            size="lg"
            onClick={() => window.history.back()}
            className="w-full sm:w-auto gap-2"
          >
            <IconArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
        </div>

        {/* Helpful Links */}
        <div className="pt-8 border-t border-border">
          <p className="text-xs text-muted-foreground mb-4 text-center">
            Common pages you might be looking for:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {([
              { href: '/cms' as const, label: 'Dashboard' },
              { href: '/cms/posts' as const, label: 'Posts' },
              { href: '/cms/posts/new' as const, label: 'New Post' },
            ] as const).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 rounded-lg border border-border hover:bg-muted/50 text-sm text-foreground/70 hover:text-foreground transition-colors text-center"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
