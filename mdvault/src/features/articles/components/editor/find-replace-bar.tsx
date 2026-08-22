import {
	IconArrowsExchange,
	IconChevronDown,
	IconChevronUp,
	IconReplace,
	IconX,
} from "@tabler/icons-react";
import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import {
	findReplacePluginKey,
	findTextMatches,
} from "#/features/articles/components/editor/find-replace-extension";

interface FindReplaceBarProps {
	editor: Editor;
	onClose: () => void;
}

export function FindReplaceBar({ editor, onClose }: FindReplaceBarProps) {
	const [query, setQuery] = useState("");
	const [replacement, setReplacement] = useState("");
	const [active, setActive] = useState(0);
	const queryRef = useRef<HTMLInputElement>(null);
	const document = useEditorState({
		editor,
		selector: ({ editor: current }) => current.state.doc,
	});
	const matches = useMemo(
		() => findTextMatches(document, query),
		[document, query],
	);

	useEffect(() => {
		queryRef.current?.focus();
	}, []);

	useEffect(() => {
		setActive((value) => Math.min(value, Math.max(matches.length - 1, 0)));
	}, [matches.length]);

	useEffect(() => {
		editor.view.dispatch(
			editor.state.tr.setMeta(findReplacePluginKey, { query, active }),
		);
	}, [active, editor, query]);

	useEffect(
		() => () => {
			if (!editor.isDestroyed) {
				editor.view.dispatch(
					editor.state.tr.setMeta(findReplacePluginKey, {
						query: "",
						active: 0,
					}),
				);
			}
		},
		[editor],
	);

	const selectMatch = (index: number) => {
		const match = matches[index];
		if (!match) {
			return;
		}
		setActive(index);
		editor
			.chain()
			.focus()
			.setTextSelection({ from: match.from, to: match.to })
			.scrollIntoView()
			.run();
	};

	const move = (direction: 1 | -1) => {
		if (matches.length === 0) {
			return;
		}
		selectMatch((active + direction + matches.length) % matches.length);
	};

	const replaceCurrent = () => {
		const match = matches[active];
		if (!match) {
			return;
		}
		editor.view.dispatch(
			editor.state.tr.insertText(replacement, match.from, match.to),
		);
	};

	const replaceAll = () => {
		if (matches.length === 0) {
			return;
		}
		const transaction = editor.state.tr;
		for (const match of [...matches].reverse()) {
			transaction.insertText(replacement, match.from, match.to);
		}
		editor.view.dispatch(transaction);
	};

	return (
		<search
			className="flex shrink-0 flex-wrap items-center gap-2 border-b bg-muted/30 px-3 py-2"
			onKeyDown={(event) => {
				if (event.key === "Escape") {
					event.preventDefault();
					onClose();
					editor.commands.focus();
				}
				if (event.key === "Enter" && event.target === queryRef.current) {
					event.preventDefault();
					move(event.shiftKey ? -1 : 1);
				}
			}}
		>
			<div className="relative min-w-48 flex-1">
				<Input
					ref={queryRef}
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					placeholder="Find"
					aria-label="Find text"
					className="h-8 pr-16"
				/>
				<span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[11px] tabular-nums text-muted-foreground">
					{matches.length ? active + 1 : 0}/{matches.length}
				</span>
			</div>
			<Input
				value={replacement}
				onChange={(event) => setReplacement(event.target.value)}
				placeholder="Replace with"
				aria-label="Replacement text"
				className="h-8 min-w-48 flex-1"
			/>
			<div className="flex items-center gap-1">
				<Button
					type="button"
					size="icon-sm"
					variant="ghost"
					disabled={matches.length === 0}
					onClick={() => move(-1)}
					aria-label="Previous match"
					title="Previous match"
				>
					<IconChevronUp />
				</Button>
				<Button
					type="button"
					size="icon-sm"
					variant="ghost"
					disabled={matches.length === 0}
					onClick={() => move(1)}
					aria-label="Next match"
					title="Next match"
				>
					<IconChevronDown />
				</Button>
				<Button
					type="button"
					size="sm"
					variant="outline"
					disabled={matches.length === 0}
					onClick={replaceCurrent}
				>
					<IconReplace />
					Replace
				</Button>
				<Button
					type="button"
					size="sm"
					variant="outline"
					disabled={matches.length === 0}
					onClick={replaceAll}
				>
					<IconArrowsExchange />
					All
				</Button>
				<Button
					type="button"
					size="icon-sm"
					variant="ghost"
					onClick={onClose}
					aria-label="Close find and replace"
					title="Close"
				>
					<IconX />
				</Button>
			</div>
		</search>
	);
}
