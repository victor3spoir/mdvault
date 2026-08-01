import { CodeBlock } from "@tiptap/extension-code-block";
import {
	NodeViewContent,
	type NodeViewProps,
	NodeViewWrapper,
	ReactNodeViewRenderer,
} from "@tiptap/react";

const LANGUAGES = [
	{ value: "plaintext", label: "Plain text" },
	{ value: "bash", label: "Bash" },
	{ value: "css", label: "CSS" },
	{ value: "dockerfile", label: "Dockerfile" },
	{ value: "go", label: "Go" },
	{ value: "html", label: "HTML" },
	{ value: "java", label: "Java" },
	{ value: "javascript", label: "JavaScript" },
	{ value: "json", label: "JSON" },
	{ value: "markdown", label: "Markdown" },
	{ value: "php", label: "PHP" },
	{ value: "python", label: "Python" },
	{ value: "rust", label: "Rust" },
	{ value: "sql", label: "SQL" },
	{ value: "typescript", label: "TypeScript" },
	{ value: "yaml", label: "YAML" },
] as const;

function CodeBlockView({ node, updateAttributes }: NodeViewProps) {
	const language =
		typeof node.attrs.language === "string" && node.attrs.language
			? node.attrs.language
			: "plaintext";

	return (
		<NodeViewWrapper className="tiptap-code-block group relative">
			<select
				contentEditable={false}
				value={language}
				aria-label="Code block language"
				onChange={(event) => updateAttributes({ language: event.target.value })}
				className="absolute top-2 right-2 z-10 rounded-md border bg-background px-2 py-0.5 text-xs text-muted-foreground opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100"
			>
				{LANGUAGES.map((item) => (
					<option key={item.value} value={item.value}>
						{item.label}
					</option>
				))}
			</select>
			<pre>
				<NodeViewContent<"code"> as="code" />
			</pre>
		</NodeViewWrapper>
	);
}

/**
 * Code block with a per-block language selector (shown on hover). The chosen
 * language serializes to the markdown fence info string (```lang), so the
 * rendered article view applies syntax highlighting.
 */
export const CodeBlockExtension = CodeBlock.extend({
	addNodeView() {
		return ReactNodeViewRenderer(CodeBlockView);
	},
}).configure({
	defaultLanguage: "plaintext",
});
