import {
	IconBlockquote,
	IconCode,
	IconH2,
	IconH3,
	IconList,
	IconListCheck,
	IconListNumbers,
	IconMinus,
	IconPhoto,
	IconQuote,
	IconTable,
	IconVideo,
} from "@tabler/icons-react";
import type { Editor } from "@tiptap/core";
import { Extension, type Range } from "@tiptap/core";
import { ReactRenderer } from "@tiptap/react";
import Suggestion, {
	type SuggestionKeyDownProps,
	type SuggestionProps,
} from "@tiptap/suggestion";
import { forwardRef, useImperativeHandle, useState } from "react";
import { parseMediaEmbed } from "#/features/content/media-embed";
import { cn } from "#/lib/utils";

interface SlashCommandItem {
	title: string;
	description: string;
	keywords: string;
	icon: typeof IconH2;
	command: (editor: Editor) => void;
}

interface SlashCommandListProps
	extends SuggestionProps<SlashCommandItem, SlashCommandItem> {}

interface SlashCommandListHandle {
	onKeyDown: (props: SuggestionKeyDownProps) => boolean;
}

const SlashCommandList = forwardRef<
	SlashCommandListHandle,
	SlashCommandListProps
>(({ items, command }, ref) => {
	const [selectedIndex, setSelectedIndex] = useState(0);
	const safeSelectedIndex = Math.min(
		selectedIndex,
		Math.max(items.length - 1, 0),
	);

	const selectItem = (index: number) => {
		const item = items[index];
		if (item) {
			command(item);
		}
	};

	useImperativeHandle(ref, () => ({
		onKeyDown: ({ event }) => {
			if (items.length === 0) {
				return false;
			}
			if (event.key === "ArrowUp") {
				setSelectedIndex((selectedIndex + items.length - 1) % items.length);
				return true;
			}
			if (event.key === "ArrowDown") {
				setSelectedIndex((selectedIndex + 1) % items.length);
				return true;
			}
			if (event.key === "Enter") {
				selectItem(safeSelectedIndex);
				return true;
			}
			return false;
		},
	}));

	if (items.length === 0) {
		return (
			<div className="w-72 rounded-xl border bg-popover p-3 text-sm text-muted-foreground shadow-xl">
				No matching blocks
			</div>
		);
	}

	return (
		<div
			role="listbox"
			aria-label="Insert block"
			className="max-h-80 w-72 overflow-y-auto rounded-xl border bg-popover p-1.5 shadow-xl"
		>
			<span className="sr-only" aria-live="polite" aria-atomic="true">
				{items[safeSelectedIndex]?.title ?? "No matching blocks"} selected
			</span>
			{items.map((item, index) => (
				<button
					key={item.title}
					type="button"
					role="option"
					aria-selected={index === safeSelectedIndex}
					onMouseDown={(event) => event.preventDefault()}
					onMouseEnter={() => setSelectedIndex(index)}
					onClick={() => selectItem(index)}
					className={cn(
						"flex w-full items-start gap-3 rounded-lg px-2.5 py-2 text-left transition-colors",
						index === safeSelectedIndex
							? "bg-accent text-accent-foreground"
							: "text-foreground hover:bg-accent/60",
					)}
				>
					<span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border bg-background">
						<item.icon className="size-4" />
					</span>
					<span className="min-w-0">
						<span className="block text-sm font-semibold">{item.title}</span>
						<span className="block truncate text-xs text-muted-foreground">
							{item.description}
						</span>
					</span>
				</button>
			))}
		</div>
	);
});

SlashCommandList.displayName = "SlashCommandList";

function commandItems(onImageInsertClick?: () => void): SlashCommandItem[] {
	return [
		{
			title: "Heading 2",
			description: "Large section heading",
			keywords: "heading h2 title",
			icon: IconH2,
			command: (editor) =>
				editor.chain().focus().setHeading({ level: 2 }).run(),
		},
		{
			title: "Heading 3",
			description: "Smaller section heading",
			keywords: "heading h3 subtitle",
			icon: IconH3,
			command: (editor) =>
				editor.chain().focus().setHeading({ level: 3 }).run(),
		},
		{
			title: "Bullet list",
			description: "Create an unordered list",
			keywords: "bullet unordered list",
			icon: IconList,
			command: (editor) => editor.chain().focus().toggleBulletList().run(),
		},
		{
			title: "Numbered list",
			description: "Create an ordered list",
			keywords: "number ordered list",
			icon: IconListNumbers,
			command: (editor) => editor.chain().focus().toggleOrderedList().run(),
		},
		{
			title: "Checklist",
			description: "Track actionable items",
			keywords: "todo task checklist",
			icon: IconListCheck,
			command: (editor) => editor.chain().focus().toggleTaskList().run(),
		},
		{
			title: "Quote",
			description: "Emphasize quoted text",
			keywords: "quote blockquote",
			icon: IconBlockquote,
			command: (editor) => editor.chain().focus().setBlockquote().run(),
		},
		{
			title: "Code block",
			description: "Insert highlighted source code",
			keywords: "code snippet fence",
			icon: IconCode,
			command: (editor) => editor.chain().focus().setCodeBlock().run(),
		},
		{
			title: "Table",
			description: "Insert a 3 by 3 table",
			keywords: "table grid cells",
			icon: IconTable,
			command: (editor) =>
				editor
					.chain()
					.focus()
					.insertTable({ rows: 3, cols: 3, withHeaderRow: true })
					.run(),
		},
		{
			title: "Image",
			description: "Choose an image from the media library",
			keywords: "image photo media",
			icon: IconPhoto,
			command: () => onImageInsertClick?.(),
		},
		{
			title: "Callout",
			description: "Insert a portable note block",
			keywords: "callout note alert info",
			icon: IconQuote,
			command: (editor) => editor.chain().focus().setCallout("note").run(),
		},
		{
			title: "Embed video",
			description: "Embed a YouTube or Vimeo URL",
			keywords: "embed video youtube vimeo",
			icon: IconVideo,
			command: (editor) => {
				const value = window.prompt("YouTube or Vimeo URL", "https://");
				if (!value) {
					return;
				}
				if (!parseMediaEmbed(value)) {
					window.alert("Use a valid YouTube or Vimeo video URL.");
					return;
				}
				editor.chain().focus().setMediaEmbed(value).run();
			},
		},
		{
			title: "Divider",
			description: "Separate sections with a horizontal rule",
			keywords: "divider separator rule",
			icon: IconMinus,
			command: (editor) => editor.chain().focus().setHorizontalRule().run(),
		},
	];
}

export function createSlashCommandExtension(onImageInsertClick?: () => void) {
	return Extension.create({
		name: "slashCommands",

		addProseMirrorPlugins() {
			const items = commandItems(onImageInsertClick);
			return [
				Suggestion<SlashCommandItem, SlashCommandItem>({
					editor: this.editor,
					char: "/",
					startOfLine: true,
					allow: ({ state, range }) =>
						state.doc.resolve(range.from).parent.type.name === "paragraph",
					items: ({ query }) => {
						const normalized = query.toLowerCase().trim();
						return items
							.filter((item) =>
								`${item.title} ${item.keywords}`
									.toLowerCase()
									.includes(normalized),
							)
							.slice(0, 8);
					},
					command: ({ editor, range, props }) => {
						editor
							.chain()
							.focus()
							.deleteRange(range as Range)
							.run();
						props.command(editor);
					},
					render: () => {
						let component:
							| ReactRenderer<SlashCommandListHandle, SlashCommandListProps>
							| undefined;
						let unmount: (() => void) | undefined;

						return {
							onStart: (props) => {
								component = new ReactRenderer(SlashCommandList, {
									props,
									editor: props.editor,
								});
								unmount = props.mount(component.element);
							},
							onUpdate: (props) => component?.updateProps(props),
							onKeyDown: (props) => component?.ref?.onKeyDown(props) ?? false,
							onExit: () => {
								unmount?.();
								component?.destroy();
							},
						};
					},
				}),
			];
		},
	});
}
