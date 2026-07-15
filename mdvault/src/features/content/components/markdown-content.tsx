import type { ReactNode } from "react";
import Markdown, { type Components } from "react-markdown";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "#/components/ui/code-block";
import { PrivateImage } from "#/features/media/components/private-image";

function MarkdownImage({
	src,
	alt,
	title,
}: {
	src?: string;
	alt?: string;
	title?: string;
}) {
	if (!src) {
		return null;
	}

	return (
		<figure className="my-8 space-y-3">
			<div className="overflow-hidden rounded-2xl border bg-muted">
				<PrivateImage
					src={src}
					alt={alt ?? ""}
					className="max-h-[32rem] w-full object-contain"
				/>
			</div>
			{title ? (
				<figcaption className="text-center text-sm text-muted-foreground">
					{title}
				</figcaption>
			) : null}
		</figure>
	);
}

function getNodeText(node: ReactNode): string {
	if (typeof node === "string" || typeof node === "number") {
		return String(node);
	}

	if (Array.isArray(node)) {
		return node.map(getNodeText).join("");
	}

	return "";
}

export function slugifyMarkdownHeading(value: string) {
	return value
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
}

function createHeadingId(children: ReactNode, counts: Map<string, number>) {
	const baseId = slugifyMarkdownHeading(getNodeText(children)) || "section";
	const count = counts.get(baseId) ?? 0;

	counts.set(baseId, count + 1);

	return count === 0 ? baseId : `${baseId}-${count + 1}`;
}

const baseComponents: Components = {
	p: ({ children }) => (
		<p className="my-5 text-lg leading-8 text-foreground/90">{children}</p>
	),
	ul: ({ children }) => (
		<ul className="my-5 ml-6 list-disc space-y-2">{children}</ul>
	),
	ol: ({ children }) => (
		<ol className="my-5 ml-6 list-decimal space-y-2">{children}</ol>
	),
	li: ({ children }) => <li className="leading-8">{children}</li>,
	blockquote: ({ children }) => (
		<blockquote className="my-6 border-l-4 border-primary pl-5 italic text-muted-foreground">
			{children}
		</blockquote>
	),
	a: ({ href, children }) => (
		<a
			href={href}
			target={
				href?.startsWith("/") || href?.startsWith("#") ? undefined : "_blank"
			}
			rel={
				href?.startsWith("/") || href?.startsWith("#")
					? undefined
					: "noreferrer"
			}
			className="font-medium text-primary underline-offset-4 hover:underline"
		>
			{children}
		</a>
	),
	pre: ({ children }) => <>{children}</>,
	code: ({ className, children }) => {
		if (!className) {
			return (
				<code className="rounded bg-muted px-1.5 py-0.5 text-sm">
					{children}
				</code>
			);
		}

		const language = className.replace("language-", "") || "text";
		const code =
			typeof children === "string"
				? children.trim()
				: String(children || "").trim();

		return <CodeBlock language={language}>{code}</CodeBlock>;
	},
	img: ({ src, alt, title }) => (
		<MarkdownImage
			src={typeof src === "string" ? src : undefined}
			alt={alt}
			title={typeof title === "string" ? title : undefined}
		/>
	),
	hr: () => <hr className="my-10 border-border" />,
	table: ({ children }) => (
		<div className="my-6 overflow-x-auto rounded-2xl border">
			<table className="min-w-full text-sm">{children}</table>
		</div>
	),
	th: ({ children }) => (
		<th className="bg-muted px-4 py-3 text-left font-semibold">{children}</th>
	),
	td: ({ children }) => (
		<td className="border-t px-4 py-3 align-top">{children}</td>
	),
};

const markdownSanitizeSchema = {
	...defaultSchema,
	protocols: {
		...defaultSchema.protocols,
		href: ["http", "https", "mailto"],
		src: ["http", "https"],
	},
};

export function MarkdownContent({ source }: { source: string }) {
	const headingCounts = new Map<string, number>();
	const components: Components = {
		...baseComponents,
		h1: ({ children }) => (
			<h1
				id={createHeadingId(children, headingCounts)}
				className="scroll-mt-24 mt-10 mb-4 text-4xl font-bold tracking-tight first:mt-0"
			>
				{children}
			</h1>
		),
		h2: ({ children }) => (
			<h2
				id={createHeadingId(children, headingCounts)}
				className="scroll-mt-24 mt-10 mb-4 border-b pb-3 text-3xl font-semibold tracking-tight"
			>
				{children}
			</h2>
		),
		h3: ({ children }) => (
			<h3
				id={createHeadingId(children, headingCounts)}
				className="scroll-mt-24 mt-8 mb-3 text-2xl font-semibold tracking-tight"
			>
				{children}
			</h3>
		),
	};

	return (
		<Markdown
			remarkPlugins={[remarkGfm]}
			rehypePlugins={[[rehypeSanitize, markdownSanitizeSchema]]}
			components={components}
		>
			{source}
		</Markdown>
	);
}
