import { IconBrandGithub, IconMarkdown, IconRocket, IconArrowRight, IconSparkles } from "@tabler/icons-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";

const HomeHero = ({ className, ...props }: React.ComponentProps<"div">) => {
  return (
    <div
      className={cn(
        "relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-background px-4 py-8 text-center",
        className,
      )}
      {...props}
    >
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[44px_44px] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      
      {/* Animated gradient orbs */}
      <div className="absolute top-0 left-1/2 -z-10 h-100 w-150 -translate-x-1/2 bg-primary/15 blur-[120px] opacity-60 animate-pulse" />
      <div className="absolute bottom-20 right-0 -z-10 h-80 w-80 bg-accent/10 blur-[100px] opacity-40 animate-pulse" style={{ animationDelay: "1s" }} />
      <div className="absolute top-1/3 left-0 -z-10 h-60 w-60 bg-primary/5 blur-[90px] opacity-30" />

      <div className="container relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-4 justify-center h-full">
        {/* Logo with enhanced animation */}
        <div className="animate-in fade-in slide-in-from-top-8 duration-1000 shrink-0">
          <div className="relative">
            <div className="absolute inset-0 -z-10 rounded-full bg-primary/10 blur-2xl" />
            <Logo className="scale-100 sm:scale-125" />
          </div>
        </div>

        {/* Enhanced Badge with icon animation */}
        <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1.5 text-xs sm:text-sm font-medium text-muted-foreground backdrop-blur-sm animate-in fade-in slide-in-from-top-4 duration-1000 delay-150 hover:bg-muted/70 transition-colors shrink-0">
          <IconSparkles className="h-3 w-3 sm:h-4 sm:w-4 animate-spin shrink-0" style={{ animationDuration: "3s" }} />
          <span className="whitespace-nowrap">Modern CMS for GitHub</span>
        </div>

        {/* Enhanced Heading with better typography */}
        <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200 max-w-3xl shrink-0">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl lg:text-6xl leading-tight">
              Your Markdown, <br />
              <span className="bg-linear-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
                Perfectly Vaulted
              </span>
            </h1>
          </div>
          <p className="mx-auto max-w-2xl text-sm sm:text-base text-muted-foreground leading-snug">
            A powerful, intuitive CMS built for GitHub. Create, edit, and manage markdown content with a modern editor and seamless Git integration.
          </p>
        </div>

        {/* Enhanced CTAs with better styling */}
        <div className="flex flex-col items-center gap-3 sm:flex-row animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500 w-full sm:w-auto shrink-0">
          <Button
            size="sm"
            className="h-10 px-6 text-sm font-semibold gap-2 group/btn relative overflow-hidden"
            asChild
          >
            <Link href="/cms" className="flex items-center justify-center">
              <span>Get Started</span>
              <IconRocket className="h-4 w-4 group-hover/btn:translate-y-0.5 transition-transform" />
            </Link>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-10 px-6 text-sm font-semibold gap-2 group/btn"
            asChild
          >
            <Link
              href="https://github.com/victor3spoir/mdvault"
              target="_blank"
              className="flex items-center justify-center"
            >
              <IconBrandGithub className="h-4 w-4" />
              <span>Explore Source</span>
              <IconArrowRight className="h-3 w-3 group-hover/btn:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>

        {/* Compact Features Grid */}
        <div className="hidden w-full lg:flex gap-6 mt-6 animate-in fade-in duration-1000 delay-700 shrink-0 text-center">
          <div className="group flex-1 flex flex-col items-center gap-2 transition-all duration-300 hover:bg-muted/30 p-2 rounded-lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-primary/20 to-primary/5 text-primary transition-all duration-300 group-hover:scale-110 shrink-0">
              <IconMarkdown className="h-5 w-5" />
            </div>
            <h3 className="text-xs font-semibold text-foreground">MDX Editor</h3>
          </div>

          <div className="group flex-1 flex flex-col items-center gap-2 transition-all duration-300 hover:bg-muted/30 p-2 rounded-lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-primary/20 to-primary/5 text-primary transition-all duration-300 group-hover:scale-110 shrink-0">
              <IconBrandGithub className="h-5 w-5" />
            </div>
            <h3 className="text-xs font-semibold text-foreground">Git Versioning</h3>
          </div>

          <div className="group flex-1 flex flex-col items-center gap-2 transition-all duration-300 hover:bg-muted/30 p-2 rounded-lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-primary/20 to-accent/10 text-primary transition-all duration-300 group-hover:scale-110 shrink-0">
              <IconRocket className="h-5 w-5" />
            </div>
            <h3 className="text-xs font-semibold text-foreground">Fast Deploy</h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeHero;
