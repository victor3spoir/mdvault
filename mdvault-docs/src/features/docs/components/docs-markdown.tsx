import type { MarkdownComponents } from "@tanstack/markdown/react";
import { Markdown } from "@tanstack/markdown/react";
import { Link } from "@tanstack/react-router";
import type { AnchorHTMLAttributes } from "react";
import { DocsCodeBlock } from "#/features/docs/components/docs-code-block";
import { DocsMermaid } from "#/features/docs/components/docs-mermaid";
import type { DocsPagePayload } from "#/features/docs/docs.functions";
import { createLookupHighlighter } from "#/features/docs/docs.highlight";

/**
 * Renders a parsed document.
 *
 * The component map is kept deliberately small — every override is a place
 * where Markdown stops behaving like Markdown. Two earn their keep:
 *
 * - `a`: internal links go through the router, so navigation stays client-side
 *   and preloading works; external links get `rel="noreferrer"`.
 * - `pre`: adds the copy button and the language label around the server-
 *   highlighted HTML, and routes ```mermaid fences to the diagram renderer.
 */
const components: MarkdownComponents = {
	a: DocsLink,
	pre: DocsFence,
};

/**
 * A fence is either a diagram or code. Branching here rather than inside
 * `DocsCodeBlock` keeps the copy-button component free of diagram concerns.
 */
function DocsFence(props: React.HTMLAttributes<HTMLPreElement>) {
	const lang = (props as { "data-lang"?: string })["data-lang"];

	if (lang === "mermaid") {
		return <DocsMermaid>{props.children}</DocsMermaid>;
	}

	return <DocsCodeBlock {...props} />;
}

export function DocsMarkdown({
	document,
	highlighted,
}: {
	document: DocsPagePayload["document"];
	highlighted: DocsPagePayload["highlighted"];
}) {
	return (
		<Markdown
			components={components}
			highlighter={createLookupHighlighter(highlighted)}
			headingAnchors={{ content: "#", className: "docs-anchor" }}
		>
			{document}
		</Markdown>
	);
}

function DocsLink({
	href,
	children,
	...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
	const isInternal = href?.startsWith("/") === true;

	if (isInternal) {
		return (
			<Link to={href} {...props}>
				{children}
			</Link>
		);
	}

	const isAnchor = href?.startsWith("#") === true;

	return (
		<a
			href={href}
			{...(isAnchor ? {} : { target: "_blank", rel: "noreferrer" })}
			{...props}
		>
			{children}
		</a>
	);
}
