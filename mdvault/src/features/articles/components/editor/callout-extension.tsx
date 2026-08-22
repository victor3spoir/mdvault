import {
	IconAlertTriangle,
	IconBulb,
	IconCircleCheck,
	IconInfoCircle,
	IconStar,
} from "@tabler/icons-react";
import { mergeAttributes, Node } from "@tiptap/core";
import {
	NodeViewContent,
	type NodeViewProps,
	NodeViewWrapper,
	ReactNodeViewRenderer,
} from "@tiptap/react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import {
	CALLOUT_TYPES,
	type CalloutType,
	calloutLabel,
	normalizeCalloutType,
} from "#/features/content/callout";
import { cn } from "#/lib/utils";

const CALLOUT_ICONS = {
	note: IconInfoCircle,
	tip: IconBulb,
	important: IconStar,
	warning: IconAlertTriangle,
	caution: IconCircleCheck,
} satisfies Record<CalloutType, typeof IconInfoCircle>;

function CalloutView({ node, selected, updateAttributes }: NodeViewProps) {
	const type = normalizeCalloutType(node.attrs.type);
	const Icon = CALLOUT_ICONS[type];

	return (
		<NodeViewWrapper
			className={cn(
				"tiptap-callout my-4 rounded-xl border p-4",
				selected && "ring-2 ring-ring/40",
			)}
			data-callout={type}
		>
			<div
				contentEditable={false}
				className="mb-2 flex items-center text-xs font-bold uppercase tracking-wider"
			>
				<Select
					value={type}
					onValueChange={(value) =>
						updateAttributes({ type: normalizeCalloutType(value) })
					}
				>
					<SelectTrigger
						size="sm"
						aria-label="Change callout type"
						className="h-7 border-0 bg-transparent px-1 text-xs font-bold uppercase tracking-wider shadow-none transition-[color,transform] hover:bg-foreground/5 focus-visible:ring-2 active:scale-[0.97] dark:bg-transparent dark:hover:bg-foreground/5"
						onPointerDown={(event) => event.stopPropagation()}
					>
						<Icon className="size-4" />
						<SelectValue>{calloutLabel(type)}</SelectValue>
					</SelectTrigger>
					<SelectContent align="start">
						{CALLOUT_TYPES.map((option) => {
							const OptionIcon = CALLOUT_ICONS[option];

							return (
								<SelectItem key={option} value={option}>
									<OptionIcon className="size-4" />
									{calloutLabel(option)}
								</SelectItem>
							);
						})}
					</SelectContent>
				</Select>
			</div>
			<NodeViewContent className="tiptap-callout-content" />
		</NodeViewWrapper>
	);
}

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		callout: {
			setCallout: (type?: CalloutType) => ReturnType;
		};
	}
}

export const CalloutExtension = Node.create({
	name: "callout",
	group: "block",
	content: "block+",
	defining: true,
	draggable: true,

	addAttributes() {
		return {
			type: { default: "note" },
		};
	},

	parseHTML() {
		return [{ tag: "aside[data-callout]" }];
	},

	renderHTML({ HTMLAttributes }) {
		return [
			"aside",
			mergeAttributes(HTMLAttributes, {
				"data-callout": HTMLAttributes.type ?? "note",
			}),
			0,
		];
	},

	parseMarkdown: (token, helpers) => {
		const type = normalizeCalloutType(token.calloutType);
		return helpers.createNode(
			"callout",
			{ type },
			helpers.parseChildren(token.tokens ?? []),
		);
	},

	renderMarkdown: (node, helpers) => {
		const type = normalizeCalloutType(node.attrs?.type);
		const body = helpers.renderChildren(node.content ?? [], "\n\n").trim();
		const quotedBody = body
			.split("\n")
			.map((line) => (line ? `> ${line}` : ">"))
			.join("\n");
		return `> [!${type.toUpperCase()}]\n>\n${quotedBody}`;
	},

	markdownTokenizer: {
		name: "callout",
		level: "block",
		start(src) {
			const match = src.match(
				/^>\s*\[!(?:NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*$/im,
			);
			return match?.index ?? -1;
		},
		tokenize(src, _tokens, lexer) {
			const lines = src.split("\n");
			const header = lines[0]?.match(
				/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*$/i,
			);
			if (!header) {
				return undefined;
			}

			const blockLines = [lines[0]];
			for (const line of lines.slice(1)) {
				if (!line.startsWith(">")) {
					break;
				}
				blockLines.push(line);
			}

			const body = blockLines
				.slice(1)
				.map((line) => line.replace(/^>\s?/, ""))
				.join("\n")
				.replace(/^\n/, "");

			return {
				type: "callout",
				raw: blockLines.join("\n"),
				calloutType: header[1].toLowerCase(),
				tokens: lexer.blockTokens(body || "Write your callout here."),
			};
		},
	},

	addCommands() {
		return {
			setCallout:
				(type: CalloutType = "note") =>
				({ commands }) =>
					commands.insertContent({
						type: this.name,
						attrs: { type },
						content: [
							{
								type: "paragraph",
								content: [{ type: "text", text: "Write your callout here." }],
							},
						],
					}),
		};
	},

	addNodeView() {
		return ReactNodeViewRenderer(CalloutView);
	},
});
