import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { IconRocket } from "@tabler/icons-react";
import Link from "next/link";

const HomeHero = ({ className, ...props }: React.ComponentProps<"div">) => {

  return (
    <Card className={cn("relative w-full max-w-sm overflow-hidden space-y-5 text-center", className)}
      {...props} >
      <CardHeader>
        <CardTitle>Welcome to MDVault</CardTitle>
        <CardDescription>GitHub-powered Markdown content management system. Create, edit, and manage your posts with ease.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant={"link"} asChild>
          <Link href={"/cms"}>
            <IconRocket />
            <span>Commencer</span>
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}


export default HomeHero;