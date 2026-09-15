import { CodeBlock } from "@tiptap/extension-code-block";
import {
	NodeViewContent,
	type NodeViewProps,
	NodeViewWrapper,
	ReactNodeViewRenderer,
} from "@tiptap/react";
import { createCodeBlockHighlightPlugin } from "#/features/articles/components/editor/code-block-highlight";
import { CodeBlockHeader } from "#/features/content/components/code-block-header";
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
	{ value: "powershell", label: "PowerShell" },
	{ value: "pwsh", label: "PowerShell (pwsh)" },
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
	const knownLanguage = LANGUAGES.some((item) => item.value === language);

	return (
		<NodeViewWrapper className="tiptap-code-block">
			<div className="code-block-frame">
				<CodeBlockHeader
					getCode={() => node.textContent}
					language={
						<select
							value={language}
							aria-label="Code block language"
							onChange={(event) =>
								updateAttributes({ language: event.target.value })
							}
							className="code-block-language code-block-language-select"
						>
							{!knownLanguage ? (
								<option value={language}>{language}</option>
							) : null}
							{LANGUAGES.map((item) => (
								<option key={item.value} value={item.value}>
									{item.label}
								</option>
							))}
						</select>
					}
				/>
				<pre className="code-block" spellCheck={false}>
					<NodeViewContent<"code"> as="code" style={{ whiteSpace: "pre" }} />
				</pre>
			</div>
			{language === "mermaid" ? (
				<div contentEditable={false} suppressContentEditableWarning>
					<MermaidDiagram chart={node.textContent} className="mt-2" />
				</div>
			) : null}
		</NodeViewWrapper>
	);
}

/**
 * Code block with a persistent language/copy header and live
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
