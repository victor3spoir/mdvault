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

      <div className="container relative z-10 mx-auto flex max-w-5xl flex-col items-center gap-8 overflow-y-auto max-h-[calc(100vh-2rem)]">
        {/* Logo with enhanced animation */}
        <div className="animate-in fade-in slide-in-from-top-8 duration-1000">
          <div className="relative">
            <div className="absolute inset-0 -z-10 rounded-full bg-primary/10 blur-2xl" />
            <Logo className="scale-125" />
          </div>
        </div>

        {/* Enhanced Badge with icon animation */}
        <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-2 text-sm font-medium text-muted-foreground backdrop-blur-sm animate-in fade-in slide-in-from-top-4 duration-1000 delay-150 hover:bg-muted/70 transition-colors">
          <IconSparkles className="h-4 w-4 animate-spin" style={{ animationDuration: "3s" }} />
          <span>Modern CMS for GitHub</span>
        </div>

        {/* Enhanced Heading with better typography */}
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200 max-w-3xl">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl leading-tight">
              Your Markdown, <br />
              <span className="bg-linear-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
                Perfectly Vaulted
              </span>
            </h1>
          </div>
          <p className="mx-auto max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed">
            A powerful, intuitive CMS built for GitHub. Create, edit, and manage markdown content with a modern editor, real-time collaboration, and seamless Git integration—all in one place.
          </p>
        </div>

        {/* Enhanced CTAs with better styling */}
        <div className="flex flex-col items-center gap-4 sm:flex-row animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500 w-full sm:w-auto">
          <Button
            size="lg"
            className="h-12 px-8 text-base font-semibold gap-2 group/btn relative overflow-hidden"
            asChild
          >
            <Link href="/cms" className="flex items-center justify-center">
              <span>Get Started</span>
              <IconRocket className="h-5 w-5 group-hover/btn:translate-y-0.5 transition-transform" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12 px-8 text-base font-semibold gap-2 group/btn"
            asChild
          >
            <Link
              href="https://github.com/victor3spoir/mdvault"
              target="_blank"
              className="flex items-center justify-center"
            >
              <IconBrandGithub className="h-5 w-5" />
              <span>Explore Source</span>
              <IconArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>

        {/* Enhanced Features Grid */}
        <div className="hidden w-full sm:block mt-12 animate-in fade-in duration-1000 delay-700">
          <div className="border-t border-muted/30" />
          <div className="grid grid-cols-1 gap-8 border-l border-r border-muted/30 py-12 px-6 sm:grid-cols-3">
            {/* Feature 1 */}
            <div className="group flex flex-col items-center gap-4 transition-all duration-300 hover:bg-muted/30 p-4 rounded-lg">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-linear-to-br from-primary/20 to-primary/5 text-primary transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg">
                <IconMarkdown className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground">MDX Editor</h3>
                <p className="text-sm text-muted-foreground">Rich markdown editing</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group flex flex-col items-center gap-4 transition-all duration-300 hover:bg-muted/30 p-4 rounded-lg">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-linear-to-br from-accent/20 to-accent/5 text-accent transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg">
                <IconBrandGithub className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground">Git Versioning</h3>
                <p className="text-sm text-muted-foreground">Full version control</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group hidden flex-col items-center gap-4 transition-all duration-300 hover:bg-muted/30 p-4 rounded-lg sm:flex">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-linear-to-br from-primary/20 to-accent/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg">
                <IconRocket className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground">Fast Deploy</h3>
                <p className="text-sm text-muted-foreground">Lightning-quick updates</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeHero;
