import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  iconOnly?: boolean
}

export const Logo = ({ className, iconOnly = false }: LogoProps) => {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          role="img"
          aria-labelledby="logo-title"
        >
          <title id="logo-title">mdvault logo</title>
          <rect x="3" y="3" width="18" height="18" rx="4" />
          <circle cx="12" cy="12" r="5" className="opacity-40" strokeDasharray="2 2" />
          <path d="M8 10.5v3l1.5-1.5 1.5 1.5v-3" strokeWidth="1.5" />
          <path d="M14 10.5v3m-1-1 1 1 1-1" strokeWidth="1.5" />
        </svg>
        
        <div className="absolute top-1.5 left-1.5 h-0.5 w-0.5 rounded-full bg-primary-foreground/40" />
        <div className="absolute top-1.5 right-1.5 h-0.5 w-0.5 rounded-full bg-primary-foreground/40" />
        <div className="absolute bottom-1.5 left-1.5 h-0.5 w-0.5 rounded-full bg-primary-foreground/40" />
        <div className="absolute bottom-1.5 right-1.5 h-0.5 w-0.5 rounded-full bg-primary-foreground/40" />
      </div>
      
      {!iconOnly && (
        <span className="text-xl font-bold tracking-tight">
          md<span className="text-primary">vault</span>
        </span>
      )}
    </div>
  )
}
