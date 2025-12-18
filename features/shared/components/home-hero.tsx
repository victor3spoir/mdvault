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
        <CardTitle>Welcome here</CardTitle>
        <CardDescription>Lorem ipsum dolor sit amet consectetur, adipisicing elit. Dolor, incidunt.</CardDescription>
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