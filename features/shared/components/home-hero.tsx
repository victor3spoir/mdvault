import { IconBrandGithub, IconMarkdown, IconRocket } from "@tabler/icons-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";

const HomeHero = ({ className, ...props }: React.ComponentProps<"div">) => {
  return (
    <div
      className={cn(
        "relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background px-4 py-10 text-center ",
        className,
      )}
      {...props}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[44px_44px] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      <div className="absolute top-0 left-1/2 -z-10 h-100 w-150 -translate-x-1/2 bg-primary/10 blur-[120px] opacity-50" />

      <div className="container relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-8">
        {/* Logo */}
        <div className="animate-in fade-in slide-in-from-top-8 duration-1000">
          <Logo className="scale-125" />
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm font-medium text-muted-foreground backdrop-blur-sm animate-in fade-in slide-in-from-top-4 duration-1000 delay-150">
          <IconBrandGithub className="h-4 w-4" />
          <span>Powered by GitHub API</span>
        </div>

        {/* Heading */}
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Your Markdown, <br />
            <span className="bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Vaulted on GitHub
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
            MDVault is a modern, straightforward CMS for your GitHub-hosted
            markdown content.
            <br />
            Create, edit, and manage your{" "}
            <span className="font-semibold ">articles</span> with a rich editor
            and seamless integration.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col items-center gap-4 sm:flex-row animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
          <Button
            size="lg"
            className="h-12 px-8 text-base font-semibold"
            asChild
          >
            <Link href="/cms">
              <IconRocket className="mr-2 h-5 w-5" />
              Commencer
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12 px-8 text-base font-semibold"
            asChild
          >
            <Link
              href="https://github.com/victor3spoir/mdvault"
              target="_blank"
            >
              <IconBrandGithub className="mr-2 h-5 w-5" />
              View Source
            </Link>
          </Button>
        </div>

        {/* Feature Icons */}
        <div className="mt-12 grid grid-cols-2 gap-8 border-t pt-12 sm:grid-cols-3 animate-in fade-in duration-1000 delay-700">
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <IconMarkdown className="h-6 w-6" />
            </div>
            <span className="text-sm font-medium">MDX Editor</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <IconBrandGithub className="h-6 w-6" />
            </div>
            <span className="text-sm font-medium">Git Versioning</span>
          </div>
          <div className="hidden flex-col items-center gap-2 sm:flex">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <IconRocket className="h-6 w-6" />
            </div>
            <span className="text-sm font-medium">Fast Deploy</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeHero;
