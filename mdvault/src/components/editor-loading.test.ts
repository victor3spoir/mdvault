import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EditorLoading } from "#/components/editor-loading";
import {
	EditorPageLoading,
	PostEditorPageLoading,
} from "#/components/editor-page-loading";

describe("editor loading layouts", () => {
	it("reserves the rich toolbar, writing area and footer without a spinner", () => {
		const html = renderToStaticMarkup(
			createElement(EditorLoading, { withToolbar: true }),
		);
		for (const part of ["toolbar", "body", "footer"])
			expect(html).toContain(`data-editor-skeleton="${part}"`);
		expect(html).toContain("<output");
		expect(html).not.toContain("animate-spin");
		expect(html).not.toContain("animate-ping");
	});
	it("uses an editor-shaped article page, not list cards", () => {
		const html = renderToStaticMarkup(createElement(EditorPageLoading));
		expect(html).toContain('data-editor-skeleton="title"');
		expect(html).toContain("h-12");
		expect(html).not.toContain("aspect-video");
	});
	it("omits rich tools for plain posts and reserves the settings panel", () => {
		const html = renderToStaticMarkup(createElement(PostEditorPageLoading));
		expect(html).not.toContain('data-editor-skeleton="toolbar"');
		expect(html).not.toContain('data-editor-skeleton="footer"');
		expect(html).toContain('data-editor-skeleton="settings"');
	});
});
