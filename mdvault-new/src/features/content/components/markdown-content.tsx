import Markdown, { type Components } from "react-markdown";
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

const components: Components = {
	h1: ({ children }) => (
		<h1 className="mt-10 mb-4 text-4xl font-bold tracking-tight first:mt-0">
			{children}
		</h1>
	),
	h2: ({ children }) => (
		<h2 className="mt-10 mb-4 border-b pb-3 text-3xl font-semibold tracking-tight">
			{children}
		</h2>
	),
	h3: ({ children }) => (
		<h3 className="mt-8 mb-3 text-2xl font-semibold tracking-tight">
			{children}
		</h3>
	),
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

export function MarkdownContent({ source }: { source: string }) {
	return (
		<Markdown remarkPlugins={[remarkGfm]} components={components}>
			{source}
		</Markdown>
	);
}
