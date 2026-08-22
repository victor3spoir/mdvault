import { IconAlertTriangle, IconCircleCheck } from "@tabler/icons-react";
import { type Editor, useEditorState } from "@tiptap/react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { useMemo } from "react";
import { analyzeEditorDocument } from "#/features/articles/components/editor/editor-document";
import { cn } from "#/lib/utils";

export function ContentChecksPopover({ editor }: { editor: Editor }) {
	const document = useEditorState({
		editor,
		selector: ({ editor: current }) => current.getJSON(),
	});
	const issues = useMemo(() => analyzeEditorDocument(document), [document]);

	return (
		<PopoverPrimitive.Root>
			<PopoverPrimitive.Trigger asChild>
				<button
					type="button"
					className={cn(
						"flex h-7 items-center gap-1.5 rounded-md px-2 text-[11px] transition-colors hover:bg-muted hover:text-foreground",
						issues.length > 0
							? "text-amber-700 dark:text-amber-400"
							: "text-muted-foreground",
					)}
				>
					{issues.length > 0 ? (
						<IconAlertTriangle className="size-3.5" />
					) : (
						<IconCircleCheck className="size-3.5" />
					)}
					{issues.length > 0
						? `${issues.length} content ${issues.length === 1 ? "issue" : "issues"}`
						: "Content checks passed"}
				</button>
			</PopoverPrimitive.Trigger>
			<PopoverPrimitive.Portal>
				<PopoverPrimitive.Content
					align="start"
					sideOffset={6}
					className="z-50 w-[min(22rem,calc(100vw-1.5rem))] rounded-xl border bg-popover p-2 shadow-xl outline-none"
				>
					<div className="px-2 py-1">
						<p className="text-sm font-semibold">Content checks</p>
						<p className="text-xs text-muted-foreground">
							Warnings do not block saving.
						</p>
					</div>
					<div className="mt-1 max-h-72 overflow-y-auto">
						{issues.length === 0 ? (
							<div className="flex items-center gap-2 px-2 py-5 text-sm text-muted-foreground">
								<IconCircleCheck className="size-4 text-emerald-600" />
								No issues found.
							</div>
						) : (
							issues.map((issue) => (
								<PopoverPrimitive.Close
									asChild
									key={`${issue.type}:${issue.position}:${issue.href ?? issue.message}`}
								>
									<button
										type="button"
										onClick={() => {
											const chain = editor.chain().focus();
											if (
												issue.type === "missing-image-alt" ||
												issue.type === "generic-image-alt"
											) {
												chain
													.setNodeSelection(issue.position)
													.scrollIntoView()
													.run();
												return;
											}
											chain
												.setTextSelection(
													Math.min(
														Math.max(issue.position || 1, 1),
														editor.state.doc.content.size,
													),
												)
												.scrollIntoView()
												.run();
										}}
										className="flex w-full gap-2 rounded-lg px-2 py-2 text-left hover:bg-muted"
									>
										<IconAlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
										<span className="min-w-0">
											<span className="block text-xs">{issue.message}</span>
											{issue.href ? (
												<span className="block truncate text-[10px] text-muted-foreground">
													{issue.href}
												</span>
											) : null}
										</span>
									</button>
								</PopoverPrimitive.Close>
							))
						)}
					</div>
					<PopoverPrimitive.Arrow className="fill-border" />
				</PopoverPrimitive.Content>
			</PopoverPrimitive.Portal>
		</PopoverPrimitive.Root>
	);
}
