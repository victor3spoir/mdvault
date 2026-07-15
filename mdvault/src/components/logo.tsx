import { cn } from "#/lib/utils";

interface LogoProps {
	className?: string;
	size?: number;
}

export function Logo({ className, size = 36 }: LogoProps) {
	return (
		<div
			role="img"
			aria-label="mdvault logo"
			className={cn(
				"flex items-center rounded-lg bg-cover bg-center",
				className,
			)}
			style={{
				width: size,
				height: size,
				backgroundImage: "url(/logo.png)",
			}}
		/>
	);
}
