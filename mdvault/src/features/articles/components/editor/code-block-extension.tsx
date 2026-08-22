import { IconCheck, IconCopy } from "@tabler/icons-react";
import { CodeBlock } from "@tiptap/extension-code-block";
import {
	NodeViewContent,
	type NodeViewProps,
	NodeViewWrapper,
	ReactNodeViewRenderer,
} from "@tiptap/react";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import { createCodeBlockHighlightPlugin } from "#/features/articles/components/editor/code-block-highlight";
import { MermaidDiagram } from "#/features/content/components/mermaid-diagram";

const LANGUAGES = [
	{ value: "plaintext", label: "Plain text" },
	{ value: "bash", label: "Bash" },
	{ value: "csharp", label: "C#" },
	{ value: "css", label: "CSS" },
	{ value: "dockerfile", label: "Dockerfile" },
	{ value: "go", label: "Go" },
	{ value: "hcl", label: "HCL / Terraform" },
	{ value: "html", label: "HTML" },
	{ value: "java", label: "Java" },
	{ value: "javascript", label: "JavaScript" },
	{ value: "json", label: "JSON" },
	{ value: "markdown", label: "Markdown" },
	{ value: "mermaid", label: "Mermaid" },
	{ value: "php", label: "PHP" },
	{ value: "python", label: "Python" },
	{ value: "rust", label: "Rust" },
	{ value: "sql", label: "SQL" },
	{ value: "toml", label: "TOML" },
	{ value: "tsx", label: "TSX" },
	{ value: "typescript", label: "TypeScript" },
	{ value: "yaml", label: "YAML" },
] as const;

function CodeBlockView({ node, updateAttributes }: NodeViewProps) {
	const language =
		typeof node.attrs.language === "string" && node.attrs.language
			? node.attrs.language
			: "plaintext";
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		const code = node.textContent;
		if (!code) {
			return;
		}
		try {
			await navigator.clipboard.writeText(code);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {}
	};

	return (
		<NodeViewWrapper className="tiptap-code-block group relative">
			<div
				contentEditable={false}
				className="absolute top-3 right-3 z-10 flex items-center gap-2"
			>
				<Button
					type="button"
					onMouseDown={(event) => event.preventDefault()}
					onClick={handleCopy}
					size="icon-sm"
					variant="secondary"
					className="border bg-background/60 backdrop-blur transition-opacity md:opacity-0 md:group-hover:opacity-100"
					title="Copy code"
				>
					{copied ? (
						<IconCheck className="size-4 text-emerald-500" />
					) : (
						<IconCopy className="size-4" />
					)}
				</Button>
				<select
					value={language}
					aria-label="Code block language"
					onChange={(event) =>
						updateAttributes({ language: event.target.value })
					}
					className="rounded-md border bg-background/60 px-2 py-1 font-mono text-[11px] uppercase tracking-wide text-muted-foreground backdrop-blur transition-opacity focus:opacity-100 md:opacity-0 md:group-hover:opacity-100"
				>
					{LANGUAGES.map((item) => (
						<option key={item.value} value={item.value}>
							{item.label}
						</option>
					))}
				</select>
			</div>
			<pre spellCheck={false}>
				<NodeViewContent<"code"> as="code" />
			</pre>
			{language === "mermaid" ? (
				<div contentEditable={false} suppressContentEditableWarning>
					<MermaidDiagram chart={node.textContent} className="mt-2" />
				</div>
			) : null}
		</NodeViewWrapper>
	);
}

/**
 * Code block with a per-block language selector (shown on hover) and live
 * TanStack Highlight syntax colors while editing. The chosen language
 * serializes to the markdown fence info string (```lang), so the rendered
 * article view applies the same highlighting.
 */
export const CodeBlockExtension = CodeBlock.extend({
	addNodeView() {
		return ReactNodeViewRenderer(CodeBlockView);
	},
	addProseMirrorPlugins() {
		return [
			...(this.parent?.() ?? []),
			createCodeBlockHighlightPlugin(this.name),
		];
	},
}).configure({
	defaultLanguage: "plaintext",
});
