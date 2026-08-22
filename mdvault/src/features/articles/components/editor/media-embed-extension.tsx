import {
	IconBrandVimeo,
	IconBrandYoutube,
	IconExternalLink,
} from "@tabler/icons-react";
import { mergeAttributes, Node } from "@tiptap/core";
import {
	type NodeViewProps,
	NodeViewWrapper,
	ReactNodeViewRenderer,
} from "@tiptap/react";
import { parseMediaEmbed } from "#/features/content/media-embed";

function MediaEmbedView({ node, selected }: NodeViewProps) {
	const media = parseMediaEmbed(
		typeof node.attrs.src === "string" ? node.attrs.src : "",
	);
	if (!media) {
		return null;
	}

	const ProviderIcon =
		media.provider === "youtube" ? IconBrandYoutube : IconBrandVimeo;

	return (
		<NodeViewWrapper
			className={`group my-5 overflow-hidden rounded-xl border bg-muted/30 ${
				selected ? "ring-2 ring-ring/40" : ""
			}`}
			data-media-embed={media.provider}
		>
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
			<a
				href={media.sourceUrl}
				target="_blank"
				rel="noreferrer"
				contentEditable={false}
				className="flex items-center gap-2 border-t px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
			>
				<ProviderIcon className="size-4" />
				<span className="truncate">{media.sourceUrl}</span>
				<IconExternalLink className="ml-auto size-3.5 shrink-0" />
			</a>
		</NodeViewWrapper>
	);
}

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		mediaEmbed: {
			setMediaEmbed: (src: string) => ReturnType;
		};
	}
}

export const MediaEmbedExtension = Node.create({
	name: "mediaEmbed",
	group: "block",
	atom: true,
	draggable: true,
	selectable: true,

	addAttributes() {
		return {
			src: { default: null },
		};
	},

	parseHTML() {
		return [{ tag: "div[data-media-embed][data-src]" }];
	},

	renderHTML({ HTMLAttributes }) {
		return [
			"div",
			mergeAttributes(HTMLAttributes, {
				"data-media-embed": "",
				"data-src": HTMLAttributes.src,
			}),
		];
	},

	parseMarkdown: (token, helpers) =>
		helpers.createNode("mediaEmbed", { src: token.src }),

	renderMarkdown: (node) =>
		typeof node.attrs?.src === "string" ? node.attrs.src : "",

	markdownTokenizer: {
		name: "mediaEmbed",
		level: "block",
		start(src) {
			const match = src.match(/^https?:\/\/\S+\s*$/m);
			return match?.index ?? -1;
		},
		tokenize(src) {
			const line = src.match(/^([^\n]+)(?:\n|$)/)?.[1]?.trim();
			if (!line || !parseMediaEmbed(line)) {
				return undefined;
			}
			return {
				type: "mediaEmbed",
				raw: src.startsWith(`${line}\n`) ? `${line}\n` : line,
				src: line,
			};
		},
	},

	addCommands() {
		return {
			setMediaEmbed:
				(src: string) =>
				({ commands }) => {
					const media = parseMediaEmbed(src);
					return media
						? commands.insertContent({
								type: this.name,
								attrs: { src: media.sourceUrl },
							})
						: false;
				},
		};
	},

	addNodeView() {
		return ReactNodeViewRenderer(MediaEmbedView);
	},
});
