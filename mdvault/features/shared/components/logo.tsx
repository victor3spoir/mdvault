import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo = ({ className, size = 36 }: LogoProps) => {
  return (
    <div className={cn("flex items-center", className)}>
      <Image
        src="/logo.png"
        alt="mdvault logo"
        width={size}
        height={size}
        className="rounded-lg"
        priority
      />
    </div>
  );
};
