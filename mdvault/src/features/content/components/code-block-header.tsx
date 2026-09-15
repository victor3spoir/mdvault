import { IconCheck, IconCopy } from "@tabler/icons-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";

export function CodeBlockHeader({
	language,
	getCode,
}: {
	language: ReactNode;
	getCode: () => string;
}) {
	const [copied, setCopied] = useState(false);
	const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (resetTimer.current !== null) clearTimeout(resetTimer.current);
		};
	}, []);

	async function handleCopy() {
		try {
			await navigator.clipboard.writeText(getCode());
			setCopied(true);
			if (resetTimer.current !== null) clearTimeout(resetTimer.current);
			resetTimer.current = setTimeout(() => setCopied(false), 2000);
		} catch {
			toast.error("Could not copy code. Please try again.");
		}
	}

	return (
		<div className="code-block-header" contentEditable={false}>
			{language}
			<Button
				type="button"
				variant="outline"
				size="icon"
				onMouseDown={(event) => event.preventDefault()}
				onClick={handleCopy}
				aria-label={copied ? "Code copied" : "Copy code"}
				title={copied ? "Copied!" : "Copy code"}
			>
				{copied ? (
					<IconCheck aria-hidden="true" />
				) : (
					<IconCopy aria-hidden="true" />
				)}
			</Button>
			<output className="sr-only">
				{copied ? "Code copied to clipboard" : ""}
			</output>
		</div>
	);
}
