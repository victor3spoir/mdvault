// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, type ComponentType, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { articlesListQueryOptions } from "#/features/articles/articles.queries";
import type { Article } from "#/features/articles/articles.types";
import { postsListQueryOptions } from "#/features/posts/posts.queries";
import { DEFAULT_CONTENT_FILTERS } from "#/features/shared/content-filters";
import { vaultConfigQueryOptions } from "#/features/vault/vault.queries";
import { Route as ArticlesRoute } from "#/routes/cms/articles/index";
import { Route as PostsRoute } from "#/routes/cms/posts/index";

const fixtures = vi.hoisted(() => ({
	documents: [] as Article[],
	loaderDocuments: [] as Article[],
	filters: { status: "all" },
	config: { version: 1, locales: ["en"], defaultLocale: "en", assetTypes: [] },
	invalidateRouter: vi.fn().mockResolvedValue(undefined),
	confirm: vi.fn().mockResolvedValue(true),
	mutate: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
	createFileRoute: () => (options: unknown) => ({
		options,
		useSearch: () => ({ ...DEFAULT_CONTENT_FILTERS, ...fixtures.filters }),
		useLoaderData: () => ({
			articles: fixtures.loaderDocuments,
			posts: fixtures.loaderDocuments,
			config: fixtures.config,
		}),
	}),
	useNavigate: () => vi.fn(),
	useRouter: () => ({ invalidate: fixtures.invalidateRouter }),
	Link: ({ children }: { children: React.ReactNode }) =>
		createElement("a", null, children),
}));

vi.mock("#/features/articles/articles.functions", () => ({
	getArticles: async () => fixtures.documents,
	getArticleById: vi.fn(),
	getArticleTranslations: vi.fn(),
	publishArticleMutation: (input: unknown) => fixtures.mutate("publish", input),
	unpublishArticleMutation: (input: unknown) =>
		fixtures.mutate("unpublish", input),
	deleteArticleMutation: (input: unknown) => fixtures.mutate("delete", input),
}));
vi.mock("#/features/posts/posts.functions", () => ({
	getPosts: async () => fixtures.documents,
	getPostBySlug: vi.fn(),
	publishPostMutation: (input: unknown) => fixtures.mutate("publish", input),
	unpublishPostMutation: (input: unknown) =>
		fixtures.mutate("unpublish", input),
	deletePostMutation: (input: unknown) => fixtures.mutate("delete", input),
}));
vi.mock("#/features/dashboard/dashboard.functions", () => ({
	getDashboardOverview: vi.fn(),
}));
vi.mock("#/features/vault/vault.functions", () => ({
	getVaultConfig: async () => fixtures.config,
	getVaultAssets: vi.fn(),
	getVaultAssetById: vi.fn(),
	getVaultAssetTranslations: vi.fn(),
}));
vi.mock("#/hooks/use-confirm", () => ({
	useConfirm: () => ({ confirm: fixtures.confirm, confirmDialog: null }),
	DELETE_DESCRIPTION: "Delete test document",
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

let root: Root;
let container: HTMLDivElement;
let queryClient: QueryClient;

beforeEach(() => {
	vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
	fixtures.documents = [
		{
			id: "test",
			title: "Test document",
			content: "Body",
			lang: "en",
			createdAt: "2026-01-01",
			updatedAt: "2026-01-01",
			published: false,
			path: "test.md",
			sha: "original",
		},
	];
	fixtures.loaderDocuments = fixtures.documents;
	fixtures.filters = { status: "all" };
	fixtures.invalidateRouter.mockClear();
	fixtures.confirm.mockClear();
	fixtures.mutate.mockReset().mockImplementation(async (action: string) => {
		fixtures.documents =
			action === "delete"
				? []
				: fixtures.documents.map((item) => ({
						...item,
						published: action === "publish",
						sha: action,
					}));
		return { id: "test", path: "test.md", sha: action };
	});
	queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	queryClient.setQueryData(vaultConfigQueryOptions().queryKey, fixtures.config);
	container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
});

afterEach(async () => {
	await act(async () => root.unmount());
	container.remove();
	queryClient.clear();
	vi.unstubAllGlobals();
});

async function clickAction(label: string) {
	const button = container.querySelector<HTMLButtonElement>(
		`button[aria-label="${label}"]`,
	);
	expect(button).not.toBeNull();
	await act(async () => {
		button?.click();
	});
	await vi.waitFor(async () => {
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});
		expect(
			container.querySelector("button[disabled][aria-label$='Test document']"),
		).toBeNull();
	});
}

describe.each([
	{ kind: "articles", route: ArticlesRoute, options: articlesListQueryOptions },
	{ kind: "posts", route: PostsRoute, options: postsListQueryOptions },
])("$kind list updates", ({ kind, route, options }) => {
	async function renderList() {
		queryClient.setQueryData(options().queryKey, fixtures.documents);
		await act(async () => {
			root.render(
				createElement(
					QueryClientProvider,
					{ client: queryClient },
					createElement(route.options.component as ComponentType),
				),
			);
		});
	}

	it("publishes, unpublishes and deletes without a page reload", async () => {
		await renderList();
		await clickAction("Publish Test document");
		expect(container.querySelector("article")?.textContent).toContain(
			"Published",
		);
		await clickAction("Unpublish Test document");
		expect(fixtures.mutate).toHaveBeenLastCalledWith("unpublish", {
			data: { id: "test", revision: { path: "test.md", sha: "publish" } },
		});
		expect(container.querySelector("article")?.textContent).toContain("Draft");
		await clickAction("Delete Test document");
		expect(container.querySelector("article")).toBeNull();
		expect(container.textContent).toContain(`No ${kind} yet`);
		expect(fixtures.invalidateRouter).toHaveBeenCalledWith({ sync: true });
	});

	it("removes a newly published card from a draft-filtered list", async () => {
		fixtures.filters = { status: "draft" };
		await renderList();
		await clickAction("Publish Test document");
		expect(container.querySelector("article")).toBeNull();
		expect(container.textContent).toContain(`No ${kind} match these filters`);
	});

	it("keeps the original card when a mutation fails", async () => {
		fixtures.mutate.mockRejectedValueOnce(new Error("Write failed"));
		await renderList();
		await clickAction("Publish Test document");
		expect(container.querySelector("article")?.textContent).toContain("Draft");
		expect(fixtures.invalidateRouter).not.toHaveBeenCalled();
	});

	it("shows newly created and edited documents when the cache is refreshed", async () => {
		await renderList();
		fixtures.documents = [
			{ ...fixtures.documents[0], title: "Edited document" },
			{ ...fixtures.documents[0], id: "new", title: "New document" },
		];
		await act(async () => {
			await queryClient.invalidateQueries({ queryKey: options().queryKey });
			await new Promise((resolve) => setTimeout(resolve, 0));
		});
		expect(container.querySelectorAll("article")).toHaveLength(2);
		expect(container.textContent).toContain("Edited document");
		expect(container.textContent).toContain("New document");
	});
});
