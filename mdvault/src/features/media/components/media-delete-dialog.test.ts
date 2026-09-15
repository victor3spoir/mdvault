// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import type { MediaAudit, MediaFile } from "../media.types";
import { MediaDeleteDialog } from "./media-delete-dialog";

const getAudit = vi.hoisted(() => vi.fn());
vi.mock("../media.queries", () => ({
	mediaAuditQueryOptions: () => ({
		queryKey: ["media", "audit"],
		queryFn: getAudit,
		retry: false,
	}),
}));
vi.mock("./media-usage-links", () => ({
	MediaUsageLinks: () => createElement("p", null, "Referenced by Vault entry"),
}));

const media: MediaFile = {
	id: "image",
	name: "a.png",
	path: "media/a.png",
	url: "media/a.png",
	sha: "a".repeat(40),
	size: 1,
	uploadedAt: "",
};
afterEach(() => {
	vi.unstubAllGlobals();
	vi.resetAllMocks();
});

it.each([
	"failed",
	"used",
	"unused",
] as const)("handles a %s usage scan without unsafe deletion", async (state) => {
	vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
	if (state === "failed") getAudit.mockRejectedValue(new Error("Unavailable"));
	else
		getAudit.mockResolvedValue({
			usage: { [media.path]: { isUsed: state === "used", usedInEntries: [] } },
		} as unknown as MediaAudit);
	const onConfirm = vi.fn();
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	const container = document.createElement("div");
	document.body.append(container);
	const root = createRoot(container);
	try {
		await act(async () => {
			root.render(
				createElement(
					QueryClientProvider,
					{ client },
					createElement(
						MediaDeleteDialog,
						{
							image: media,
							onConfirm,
						},
						createElement("button", { type: "button" }, "Open delete"),
					),
				),
			);
		});
		await act(async () => {
			container.querySelector("button")?.click();
		});
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 30));
		});
		const dialog = document.querySelector('[role="alertdialog"]');
		const confirm = Array.from(dialog?.querySelectorAll("button") ?? []).find(
			(button) => button.textContent === "Delete",
		);
		expect(confirm).toBeDefined();
		expect(confirm?.disabled).toBe(state !== "unused");
		if (state === "failed")
			expect(dialog?.textContent).toContain("Deletion is blocked");
		if (state === "used")
			expect(dialog?.textContent).toContain("Remove these references");
		expect(onConfirm).not.toHaveBeenCalled();
	} finally {
		await act(async () => root.unmount());
		client.clear();
		container.remove();
	}
});
