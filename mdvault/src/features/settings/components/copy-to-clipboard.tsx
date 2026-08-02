import { IconCheck, IconCopy } from "@tabler/icons-react";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import { cn } from "#/lib/utils";

interface CopyToClipboardProps {
	value: string;
	className?: string;
}

export function CopyToClipboard({ value, className }: CopyToClipboardProps) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(value);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {}
	};

	return (
		<Button
			type="button"
			size="icon-xs"
			variant="ghost"
			className={cn("h-7 w-7", className)}
			onClick={handleCopy}
			title={copied ? "Copied" : "Copy"}
		>
			{copied ? (
				<IconCheck className="size-3 text-emerald-600" />
			) : (
				<IconCopy className="size-3" />
			)}
		</Button>
	);
}
