import {
	IconAccessible,
	IconAlignCenter,
	IconAlignLeft,
	IconAlignRight,
} from "@tabler/icons-react";
import Image from "@tiptap/extension-image";
import {
	type NodeViewProps,
	NodeViewWrapper,
	ReactNodeViewRenderer,
} from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import { PrivateImage } from "#/features/media/components/private-image";
import {
	type ImageAlign,
	joinImageSource,
	splitImageSource,
} from "#/features/media/image-display";
import { cn } from "#/lib/utils";

const WIDTH_OPTIONS = [25, 50, 75, 100] as const;

const ALIGN_OPTIONS: Array<{
	value: ImageAlign;
	label: string;
	icon: typeof IconAlignLeft;
}> = [
	{ value: "left", label: "Align left", icon: IconAlignLeft },
	{ value: "center", label: "Align center", icon: IconAlignCenter },
	{ value: "right", label: "Align right", icon: IconAlignRight },
];

function PrivateImageView({ node, selected, updateAttributes }: NodeViewProps) {
	const src = typeof node.attrs.src === "string" ? node.attrs.src : "";
	const alt = typeof node.attrs.alt === "string" ? node.attrs.alt : "";
	const title = typeof node.attrs.title === "string" ? node.attrs.title : "";
	const width = typeof node.attrs.width === "number" ? node.attrs.width : 100;
	const align: ImageAlign =
		node.attrs.align === "left" || node.attrs.align === "right"
			? node.attrs.align
			: "center";

	const [altOpen, setAltOpen] = useState(false);
	const altInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (!selected) {
			setAltOpen(false);
		}
	}, [selected]);

	useEffect(() => {
		if (altOpen) {
			altInputRef.current?.focus();
		}
	}, [altOpen]);

	return (
		<NodeViewWrapper className="my-4" data-drag-handle>
			<div
				className={cn(
					"relative flex",
					align === "left" && "justify-start",
					align === "center" && "justify-center",
					align === "right" && "justify-end",
				)}
			>
				<div className="relative" style={{ width: `${width}%` }}>
					<PrivateImage
						src={src}
						alt={alt}
						className={cn(
							"w-full rounded-xl border object-contain transition-shadow",
							selected &&
								"ring-2 ring-ring/40 ring-offset-2 ring-offset-background",
						)}
					/>

					{selected ? (
						<div
							contentEditable={false}
							className="absolute -top-3 left-1/2 z-10 flex -translate-x-1/2 -translate-y-full flex-col items-center gap-1"
						>
							<div className="flex items-center gap-0.5 rounded-lg border bg-popover p-1 shadow-lg">
								{WIDTH_OPTIONS.map((option) => (
									<button
										key={option}
										type="button"
										aria-label={`Width ${option}%`}
										title={`Width ${option}%`}
										onMouseDown={(event) => event.preventDefault()}
										onClick={() => updateAttributes({ width: option })}
										className={cn(
											"rounded-md px-1.5 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
											width === option && "bg-primary/10 text-primary",
										)}
									>
										{option}%
									</button>
								))}

								<span className="mx-0.5 h-4 w-px bg-border" />

								{ALIGN_OPTIONS.map((option) => (
									<button
										key={option.value}
										type="button"
										aria-label={option.label}
										title={option.label}
										onMouseDown={(event) => event.preventDefault()}
										onClick={() => updateAttributes({ align: option.value })}
										className={cn(
											"flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
											align === option.value && "bg-primary/10 text-primary",
										)}
									>
										<option.icon className="size-3.5" />
									</button>
								))}

								<span className="mx-0.5 h-4 w-px bg-border" />

								<button
									type="button"
									aria-label="Edit alt text"
									title="Edit alt text"
									onMouseDown={(event) => event.preventDefault()}
									onClick={() => setAltOpen((value) => !value)}
									className={cn(
										"flex h-7 items-center gap-1 rounded-md px-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
										(altOpen || alt) && "bg-primary/10 text-primary",
									)}
								>
									<IconAccessible className="size-3.5" />
									Alt
								</button>
							</div>

							{altOpen ? (
								<div className="rounded-lg border bg-popover p-1 shadow-lg">
									<input
										ref={altInputRef}
										type="text"
										value={alt}
										placeholder="Describe this image (alt text)..."
										aria-label="Image alt text"
										onChange={(event) =>
											updateAttributes({ alt: event.target.value })
										}
										onKeyDown={(event) => {
											if (event.key === "Enter" || event.key === "Escape") {
												event.preventDefault();
												setAltOpen(false);
											}
										}}
										className="w-64 rounded-md bg-transparent px-2 py-1 text-xs outline-none placeholder:text-muted-foreground/60"
									/>
								</div>
							) : null}
						</div>
					) : null}

					{selected || title ? (
						<div contentEditable={false} className="mt-2">
							{selected ? (
								<input
									type="text"
									value={title}
									placeholder="Add a caption..."
									aria-label="Image caption"
									onChange={(event) =>
										updateAttributes({ title: event.target.value })
									}
									onKeyDown={(event) => {
										if (event.key === "Enter" || event.key === "Escape") {
											event.preventDefault();
											event.currentTarget.blur();
										}
									}}
									className="w-full bg-transparent text-center text-sm italic text-muted-foreground outline-none placeholder:not-italic placeholder:text-muted-foreground/50"
								/>
							) : (
								<p className="text-center text-sm italic text-muted-foreground">
									{title}
								</p>
							)}
						</div>
					) : null}
				</div>
			</div>
		</NodeViewWrapper>
	);
}

/**
 * Image node with private repo-path rendering plus width/alignment editing.
 * Display attrs persist through markdown as a URL fragment
 * (`![alt](src#w=50&align=left)`), keeping plain-markdown compatibility.
 */
export const PrivateImageExtension = Image.extend({
	addAttributes() {
		return {
			...this.parent?.(),
			width: { default: null },
			align: { default: null },
		};
	},

	parseMarkdown: (token, helpers) => {
		const raw = typeof token.href === "string" ? token.href : "";
		const { src, attrs } = splitImageSource(raw);
		return helpers.createNode("image", {
			src,
			title: token.title ?? null,
			alt: token.text ?? null,
			width: attrs.width,
			align: attrs.align,
		});
	},

	renderMarkdown: (node) => {
		const attrs = node.attrs ?? {};
		const src = typeof attrs.src === "string" ? attrs.src : "";
		const alt = typeof attrs.alt === "string" ? attrs.alt : "";
		const title = typeof attrs.title === "string" ? attrs.title : "";
		const source = joinImageSource(src, {
			width: typeof attrs.width === "number" ? attrs.width : null,
			align:
				attrs.align === "left" ||
				attrs.align === "center" ||
				attrs.align === "right"
					? attrs.align
					: null,
		});
		return title ? `![${alt}](${source} "${title}")` : `![${alt}](${source})`;
	},

	addNodeView() {
		return ReactNodeViewRenderer(PrivateImageView);
	},
});
