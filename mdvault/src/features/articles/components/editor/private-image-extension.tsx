import Image from "@tiptap/extension-image";
import {
	type NodeViewProps,
	NodeViewWrapper,
	ReactNodeViewRenderer,
} from "@tiptap/react";
import { PrivateImage } from "#/features/media/components/private-image";
import { cn } from "#/lib/utils";

function PrivateImageView({ node, selected }: NodeViewProps) {
	const src = typeof node.attrs.src === "string" ? node.attrs.src : "";
	const alt = typeof node.attrs.alt === "string" ? node.attrs.alt : "";

	return (
		<NodeViewWrapper className="my-4" data-drag-handle>
			<PrivateImage
				src={src}
				alt={alt}
				className={cn(
					"max-h-[28rem] rounded-xl border object-contain",
					selected && "ring-2 ring-primary",
				)}
			/>
		</NodeViewWrapper>
	);
}

/**
 * Image node that resolves private repo paths to data URLs through the media
 * query cache, so images stored in the GitHub repo render inside the editor.
 */
export const PrivateImageExtension = Image.extend({
	addNodeView() {
		return ReactNodeViewRenderer(PrivateImageView);
	},
});
