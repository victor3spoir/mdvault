import { Editor } from "@tiptap/core";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { Markdown } from "@tiptap/markdown";
import StarterKit from "@tiptap/starter-kit";
import { describe, expect, it } from "vitest";

function makeEditor(markdown: string) {
	return new Editor({
		extensions: [
			StarterKit.configure({ codeBlock: false }),
			Markdown,
			TaskList,
			TaskItem.configure({ nested: true }),
		],
		content: markdown,
		contentType: "markdown",
	});
}

describe("checklist round trip", () => {
	it("keeps task syntax through markdown", () => {
		const editor = makeEditor("- [ ] todo\n- [x] done\n");
		expect(editor.getMarkdown()).toContain("- [ ] todo");
		expect(editor.getMarkdown()).toContain("- [x] done");
		editor.destroy();
	});

	it("produces task syntax from the toolbar command", () => {
		const editor = makeEditor("write docs");
		editor.chain().focus().toggleTaskList().run();
		expect(editor.getMarkdown()).toContain("- [ ] write docs");
		editor.destroy();
	});
});
