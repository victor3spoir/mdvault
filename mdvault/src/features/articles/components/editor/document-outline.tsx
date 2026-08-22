import { IconListTree } from "@tabler/icons-react";
import { type Editor, useEditorState } from "@tiptap/react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { extractEditorOutline } from "#/features/articles/components/editor/editor-document";
import { cn } from "#/lib/utils";

export function DocumentOutline({ editor }: { editor: Editor }) {
	const state = useEditorState({
		editor,
		selector: ({ editor: current }) => ({
			outline: extractEditorOutline(current.getJSON()),
			selection: current.state.selection.from,
		}),
	});

	return (
		<PopoverPrimitive.Root>
			<PopoverPrimitive.Trigger asChild>
				<button
					type="button"
					aria-label="Document outline"
					title="Document outline"
					className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
				>
					<IconListTree className="size-4" />
				</button>
			</PopoverPrimitive.Trigger>
			<PopoverPrimitive.Portal>
				<PopoverPrimitive.Content
					align="end"
					sideOffset={6}
					className="z-50 w-[min(20rem,calc(100vw-1.5rem))] rounded-xl border bg-popover p-2 shadow-xl outline-none"
				>
					<div className="px-2 py-1">
						<p className="text-sm font-semibold">Document outline</p>
						<p className="text-xs text-muted-foreground">
							Jump to a heading without changing the editor layout.
						</p>
					</div>
					<div className="mt-1 max-h-72 overflow-y-auto">
						{state.outline.length === 0 ? (
							<p className="px-2 py-6 text-center text-xs text-muted-foreground">
								Add a heading to build the outline.
							</p>
						) : (
							state.outline.map((heading) => {
								const nextHeading = state.outline.find(
									(candidate) => candidate.position > heading.position,
								);
								const active =
									state.selection >= heading.position &&
									(nextHeading === undefined ||
										state.selection < nextHeading.position);
								return (
									<PopoverPrimitive.Close
										asChild
										key={`${heading.slug}:${heading.position}`}
									>
										<button
											type="button"
											onClick={() =>
												editor
													.chain()
													.focus()
													.setTextSelection(heading.position + 1)
													.scrollIntoView()
													.run()
											}
											className={cn(
												"flex w-full items-center gap-2 rounded-lg py-1.5 pr-2 text-left text-sm hover:bg-muted",
												active && "bg-primary/10 text-primary",
											)}
											style={{
												paddingLeft: `${8 + (heading.level - 2) * 12}px`,
											}}
										>
											<span className="w-5 shrink-0 text-[10px] font-semibold text-muted-foreground">
												H{heading.level}
											</span>
											<span className="truncate">
												{heading.text || "Untitled heading"}
											</span>
										</button>
									</PopoverPrimitive.Close>
								);
							})
						)}
					</div>
					<PopoverPrimitive.Arrow className="fill-border" />
				</PopoverPrimitive.Content>
			</PopoverPrimitive.Portal>
		</PopoverPrimitive.Root>
	);
}
