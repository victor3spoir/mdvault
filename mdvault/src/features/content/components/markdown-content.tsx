import { IconCheck, IconCopy } from "@tabler/icons-react";
import { createTanStackMarkdownHighlighter } from "@tanstack/highlight/markdown";
import type { CodeHighlighter } from "@tanstack/markdown";
import { Markdown, type MarkdownComponents } from "@tanstack/markdown/react";
import { type ComponentPropsWithoutRef, useRef, useState } from "react";
import { Button } from "#/components/ui/button";
import { PrivateImage } from "#/features/media/components/private-image";
import { highlighter } from "#/lib/highlight";

const highlightMarkdownCode: CodeHighlighter =
	createTanStackMarkdownHighlighter(highlighter);

function CodeBlockFrame({
	"data-lang": lang,
	...props
}: ComponentPropsWithoutRef<"pre"> & { "data-lang"?: string }) {
	const preRef = useRef<HTMLPreElement>(null);
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		const code = preRef.current?.querySelector("code")?.textContent ?? "";
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
		<div className="group relative my-6 overflow-hidden rounded-2xl border">
			<pre
				{...props}
				ref={preRef}
				data-lang={lang}
				className="code-block overflow-x-auto p-5 text-sm leading-7"
			/>
			<div className="absolute top-3 right-3 flex items-center gap-2">
				<Button
					type="button"
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
				{lang && lang !== "plaintext" && lang !== "text" ? (
					<div className="rounded-md border bg-background/60 px-2 py-1 font-mono text-[11px] uppercase tracking-wide text-muted-foreground backdrop-blur transition-opacity md:opacity-0 md:group-hover:opacity-100">
						{lang}
					</div>
				) : null}
			</div>
		</div>
	);
}

export function slugifyMarkdownHeading(value: string) {
	return value
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
}

const components = {
	h1: (props) => (
		<h1
			{...props}
			className="scroll-mt-24 mt-10 mb-4 text-4xl font-bold tracking-tight first:mt-0"
		/>
	),
	h2: (props) => (
		<h2
			{...props}
			className="scroll-mt-24 mt-10 mb-4 border-b pb-3 text-3xl font-semibold tracking-tight"
		/>
	),
	h3: (props) => (
		<h3
			{...props}
			className="scroll-mt-24 mt-8 mb-3 text-2xl font-semibold tracking-tight"
		/>
	),
	p: (props) => (
		<p {...props} className="my-5 text-lg leading-8 text-foreground/90" />
	),
	ul: (props) => <ul {...props} className="my-5 ml-6 list-disc space-y-2" />,
	ol: (props) => <ol {...props} className="my-5 ml-6 list-decimal space-y-2" />,
	li: (props) => <li {...props} className="leading-8" />,
	blockquote: (props) => (
		<blockquote
			{...props}
			className="my-6 border-l-4 border-primary pl-5 italic text-muted-foreground"
		/>
	),
	a: ({ href, ...props }) => {
		const isInternal = href?.startsWith("/") || href?.startsWith("#");
		return (
			<a
				{...props}
				href={href}
				target={isInternal ? undefined : "_blank"}
				rel={isInternal ? undefined : "noreferrer"}
				className="font-medium text-primary underline-offset-4 hover:underline"
			/>
		);
	},
	img: ({ src, alt, title }) => {
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
	},
	pre: (props) => <CodeBlockFrame {...props} />,
	hr: (props) => <hr {...props} className="my-10 border-border" />,
	table: (props) => (
		<div className="my-6 overflow-x-auto rounded-2xl border">
			<table {...props} className="min-w-full text-sm" />
		</div>
	),
	th: (props) => (
		<th {...props} className="bg-muted px-4 py-3 text-left font-semibold" />
	),
	td: (props) => <td {...props} className="border-t px-4 py-3 align-top" />,
} satisfies MarkdownComponents;

export function MarkdownContent({ source }: { source: string }) {
	return (
		<div className="markdown-content">
			<Markdown components={components} highlighter={highlightMarkdownCode}>
				{source}
			</Markdown>
		</div>
	);
}
