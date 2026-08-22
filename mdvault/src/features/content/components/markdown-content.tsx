import {
	IconAlertTriangle,
	IconBrandVimeo,
	IconBrandYoutube,
	IconBulb,
	IconCheck,
	IconCircleCheck,
	IconCopy,
	IconInfoCircle,
	IconStar,
} from "@tabler/icons-react";
import { createTanStackMarkdownHighlighter } from "@tanstack/highlight/markdown";
import type { CodeHighlighter } from "@tanstack/markdown";
import { Markdown, type MarkdownComponents } from "@tanstack/markdown/react";
import {
	Children,
	type ComponentPropsWithoutRef,
	isValidElement,
	type ReactNode,
	useRef,
	useState,
} from "react";
import { Button } from "#/components/ui/button";
import {
	type CalloutType,
	calloutLabel,
	isCalloutType,
	normalizeCalloutMarkdown,
	normalizeCalloutType,
} from "#/features/content/callout";
import { MermaidDiagram } from "#/features/content/components/mermaid-diagram";
import { parseMediaEmbed } from "#/features/content/media-embed";
import { PrivateImage } from "#/features/media/components/private-image";
import { splitImageSource } from "#/features/media/image-display";
import { highlighter } from "#/lib/highlight";
import { cn } from "#/lib/utils";

const highlightMarkdownCode: CodeHighlighter =
	createTanStackMarkdownHighlighter(highlighter);

const HTML_ENTITIES: Record<string, string> = {
	"&amp;": "&",
	"&lt;": "<",
	"&gt;": ">",
	"&quot;": '"',
	"&#39;": "'",
	"&nbsp;": " ",
};

/**
 * With a highlighter configured the renderer leaves `children` undefined and
 * passes the code through `dangerouslySetInnerHTML`, so the source has to be
 * read back out of the markup.
 */
export function codeTextOf(node: ReactNode): string {
	if (typeof node === "string") {
		return node;
	}
	if (Array.isArray(node)) {
		return node.map(codeTextOf).join("");
	}
	if (
		isValidElement<{
			children?: ReactNode;
			dangerouslySetInnerHTML?: { __html: string };
		}>(node)
	) {
		const html = node.props.dangerouslySetInnerHTML?.__html;

		if (typeof html === "string") {
			return html
				.replace(/<[^>]*>/g, "")
				.replace(
					/&[a-z]+;|&#\d+;/gi,
					(entity) => HTML_ENTITIES[entity] ?? entity,
				);
		}

		return codeTextOf(node.props.children);
	}
	return "";
}

const CALLOUT_ICONS = {
	note: IconInfoCircle,
	tip: IconBulb,
	important: IconStar,
	warning: IconAlertTriangle,
	caution: IconCircleCheck,
} satisfies Record<CalloutType, typeof IconInfoCircle>;

function reactNodeText(node: ReactNode): string {
	if (typeof node === "string" || typeof node === "number") {
		return String(node);
	}
	if (Array.isArray(node)) {
		return node.map(reactNodeText).join("");
	}
	if (isValidElement<{ children?: ReactNode }>(node)) {
		return reactNodeText(node.props.children);
	}
	return "";
}

function calloutTypeOf(node: ReactNode): CalloutType | null {
	const match = reactNodeText(node)
		.trim()
		.match(/^\[!([A-Z]+)\]$/i);
	return match && isCalloutType(match[1])
		? normalizeCalloutType(match[1])
		: null;
}

function CalloutBlockquote({
	children,
	...props
}: ComponentPropsWithoutRef<"blockquote">) {
	const blocks = Children.toArray(children);
	const type = calloutTypeOf(blocks[0]);
	if (!type) {
		return (
			<blockquote
				{...props}
				className="my-6 border-l-4 border-primary pl-5 italic text-muted-foreground"
			>
				{children}
			</blockquote>
		);
	}

	const Icon = CALLOUT_ICONS[type];
	return (
		<aside
			data-callout={type}
			className="markdown-callout my-6 rounded-xl border p-5"
		>
			<div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
				<Icon className="size-4" />
				{calloutLabel(type)}
			</div>
			<div className="[&>:first-child]:mt-0 [&>:last-child]:mb-0">
				{blocks.slice(1)}
			</div>
		</aside>
	);
}

function MediaEmbed({ source }: { source: string }) {
	const media = parseMediaEmbed(source);
	if (!media) {
		return null;
	}
	const ProviderIcon =
		media.provider === "youtube" ? IconBrandYoutube : IconBrandVimeo;

	return (
		<figure className="my-8 overflow-hidden rounded-2xl border bg-muted/30">
			<div className="aspect-video">
				<iframe
					src={media.embedUrl}
					title={media.label}
					className="size-full"
					loading="lazy"
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
					allowFullScreen
				/>
			</div>
			<figcaption className="flex items-center gap-2 border-t px-4 py-2 text-xs text-muted-foreground">
				<ProviderIcon className="size-4" />
				<a
					href={media.sourceUrl}
					target="_blank"
					rel="noreferrer"
					className="truncate hover:text-foreground hover:underline"
				>
					{media.sourceUrl}
				</a>
			</figcaption>
		</figure>
	);
}

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
		<div className="group relative my-6">
			<pre
				{...props}
				ref={preRef}
				data-lang={lang}
				className="code-block overflow-x-auto p-5 pr-24"
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
	p: ({ children, ...props }) => {
		const text = reactNodeText(children).trim();
		const media = parseMediaEmbed(text);
		if (media && text === media.sourceUrl.trim()) {
			return <MediaEmbed source={text} />;
		}
		return (
			<p {...props} className="my-5 text-lg leading-8 text-foreground/90">
				{children}
			</p>
		);
	},
	ul: (props) => <ul {...props} className="my-5 ml-6 list-disc space-y-2" />,
	ol: (props) => <ol {...props} className="my-5 ml-6 list-decimal space-y-2" />,
	li: (props) => <li {...props} className="leading-8" />,
	blockquote: (props) => <CalloutBlockquote {...props} />,
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
		const { src: cleanSrc, attrs } = splitImageSource(src);
		const width = attrs.width ?? 100;
		const align = attrs.align ?? "center";
		return (
			<figure className="my-8 space-y-3">
				<div
					className={cn(
						"flex",
						align === "left" && "justify-start",
						align === "center" && "justify-center",
						align === "right" && "justify-end",
					)}
				>
					<div
						className="overflow-hidden rounded-2xl border bg-muted"
						style={{ width: `${width}%` }}
					>
						<PrivateImage
							src={cleanSrc}
							alt={alt ?? ""}
							className="max-h-[32rem] w-full object-contain"
						/>
					</div>
				</div>
				{title ? (
					<figcaption className="text-center text-sm text-muted-foreground">
						{title}
					</figcaption>
				) : null}
			</figure>
		);
	},
	pre: (props) => {
		const lang = (props as { "data-lang"?: string })["data-lang"];

		if (lang === "mermaid") {
			return <MermaidDiagram chart={codeTextOf(props.children)} />;
		}

		return <CodeBlockFrame {...props} />;
	},
	hr: (props) => <hr {...props} className="my-10 border-border" />,
	table: (props) => (
		<div className="my-6 max-w-full overflow-x-auto rounded-2xl border">
			<table {...props} className="w-full table-fixed text-sm" />
		</div>
	),
	th: (props) => (
		<th
			{...props}
			className="break-words bg-muted px-4 py-3 text-left font-semibold"
		/>
	),
	td: (props) => (
		<td {...props} className="break-words border-t px-4 py-3 align-top" />
	),
} satisfies MarkdownComponents;

export function MarkdownContent({ source }: { source: string }) {
	return (
		<div className="markdown-content">
			<Markdown components={components} highlighter={highlightMarkdownCode}>
				{normalizeCalloutMarkdown(source)}
			</Markdown>
		</div>
	);
}
