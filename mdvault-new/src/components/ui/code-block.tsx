import { IconCheck, IconCopy } from "@tabler/icons-react";
import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { Button } from "#/components/ui/button";

interface CodeBlockProps {
	children: string;
	language: string;
}

function normalizeLanguage(lang: string) {
	const aliases: Record<string, string> = {
		ts: "typescript",
		js: "javascript",
		jsx: "jsx",
		tsx: "tsx",
		py: "python",
		sh: "bash",
		shell: "bash",
		yml: "yaml",
		dockerfile: "docker",
		tf: "hcl",
		terraform: "hcl",
		md: "markdown",
		mdx: "markdown",
		"c++": "cpp",
		cs: "csharp",
		rb: "ruby",
		rs: "rust",
		kt: "kotlin",
		gql: "graphql",
	};

	const normalized = lang.toLowerCase();
	return aliases[normalized] || normalized;
}

export function CodeBlock({ children, language }: CodeBlockProps) {
	const [copied, setCopied] = useState(false);
	const normalizedLang = normalizeLanguage(language);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(children);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {}
	};

	return (
		<div className="group relative my-6 overflow-hidden rounded-2xl border bg-[#0f172a]">
			<SyntaxHighlighter
				language={normalizedLang}
				style={oneDark}
				customStyle={{
					margin: 0,
					padding: "1.25rem",
					borderRadius: "1rem",
					fontSize: "0.875rem",
					lineHeight: "1.7",
					background: "transparent",
				}}
				showLineNumbers={false}
				wrapLines
				wrapLongLines
			>
				{children}
			</SyntaxHighlighter>
			<div className="absolute top-3 right-3 flex items-center gap-2">
				<Button
					type="button"
					onClick={handleCopy}
					size="icon-sm"
					variant="secondary"
					className="border border-white/10 bg-black/30 text-zinc-200 backdrop-blur transition-opacity md:opacity-0 md:group-hover:opacity-100"
					title="Copy code"
				>
					{copied ? (
						<IconCheck className="size-4 text-emerald-400" />
					) : (
						<IconCopy className="size-4" />
					)}
				</Button>
				{language !== "text" ? (
					<div className="rounded-md border border-white/10 bg-black/30 px-2 py-1 font-mono text-[11px] uppercase tracking-wide text-zinc-300 backdrop-blur transition-opacity md:opacity-0 md:group-hover:opacity-100">
						{language}
					</div>
				) : null}
			</div>
		</div>
	);
}
