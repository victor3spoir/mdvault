import { describe, expect, it } from "vitest";
import {
	createTranslationKey,
	findLinkCandidates,
	findTranslations,
	getTranslationLinkError,
	groupTranslations,
	type TranslatableContent,
} from "#/features/shared/article-translations";

function createArticle(
	overrides: Partial<TranslatableContent> & { id: string },
): TranslatableContent {
	return { lang: "en", ...overrides };
}

describe("groupTranslations", () => {
	it("pairs articles that share a key", () => {
		const groups = groupTranslations([
			createArticle({ id: "a", lang: "en", translationKey: "docker-nfs" }),
			createArticle({ id: "b", lang: "fr", translationKey: "docker-nfs" }),
		]);

		expect(groups).toHaveLength(1);
		expect(groups[0].key).toBe("docker-nfs");
		expect(groups[0].members.map((member) => member.id)).toEqual(["a", "b"]);
		expect(groups[0].conflictingLangs).toEqual([]);
	});

	it("ignores articles without a key instead of grouping them together", () => {
		const groups = groupTranslations([
			createArticle({ id: "a" }),
			createArticle({ id: "b" }),
			createArticle({ id: "c", translationKey: "  " }),
		]);

		expect(groups).toEqual([]);
	});

	it("matches keys case-insensitively and trims surrounding space", () => {
		const groups = groupTranslations([
			createArticle({ id: "a", lang: "en", translationKey: "Docker-NFS" }),
			createArticle({ id: "b", lang: "fr", translationKey: " docker-nfs " }),
		]);

		expect(groups).toHaveLength(1);
		expect(groups[0].members).toHaveLength(2);
	});

	it("reports a language claimed twice rather than dropping a member", () => {
		const groups = groupTranslations([
			createArticle({ id: "a", lang: "en", translationKey: "docker-nfs" }),
			createArticle({ id: "b", lang: "en", translationKey: "docker-nfs" }),
			createArticle({ id: "c", lang: "fr", translationKey: "docker-nfs" }),
		]);

		expect(groups[0].members).toHaveLength(3);
		expect(groups[0].conflictingLangs).toEqual(["en"]);
	});

	it("supports groups with more than two locales", () => {
		const groups = groupTranslations([
			createArticle({ id: "a", lang: "en", translationKey: "guide" }),
			createArticle({ id: "b", lang: "fr", translationKey: "guide" }),
			createArticle({ id: "c", lang: "de", translationKey: "guide" }),
		]);

		expect(groups[0].members.map((member) => member.lang)).toEqual([
			"en",
			"fr",
			"de",
		]);
		expect(groups[0].conflictingLangs).toEqual([]);
	});

	it("keeps unrelated keys in separate groups", () => {
		const groups = groupTranslations([
			createArticle({ id: "a", translationKey: "one" }),
			createArticle({ id: "b", translationKey: "two" }),
		]);

		expect(groups.map((group) => group.key)).toEqual(["one", "two"]);
	});

	it("keeps identical keys in separate vault asset types", () => {
		const groups = groupTranslations([
			createArticle({ id: "a", type: "guides", translationKey: "install" }),
			createArticle({ id: "b", type: "notes", translationKey: "install" }),
		]);

		expect(groups).toHaveLength(2);
		expect(groups.map((group) => group.members[0].type)).toEqual([
			"guides",
			"notes",
		]);
	});
});

describe("findTranslations", () => {
	const articles = [
		createArticle({ id: "a", lang: "en", translationKey: "docker-nfs" }),
		createArticle({ id: "b", lang: "fr", translationKey: "docker-nfs" }),
		createArticle({ id: "c", lang: "fr", translationKey: "other" }),
	];

	it("returns siblings without the article itself", () => {
		const siblings = findTranslations(articles, {
			id: "a",
			translationKey: "docker-nfs",
		});

		expect(siblings.map((sibling) => sibling.id)).toEqual(["b"]);
	});

	it("returns nothing for an unlinked article", () => {
		expect(findTranslations(articles, { id: "d" })).toEqual([]);
	});
});

describe("findLinkCandidates", () => {
	const articles = [
		createArticle({ id: "self", lang: "en" }),
		createArticle({ id: "free-fr", lang: "fr" }),
		createArticle({ id: "same-lang", lang: "en" }),
		createArticle({ id: "taken-fr", lang: "fr", translationKey: "other" }),
	];

	it("offers compatible articles in another language", () => {
		const candidates = findLinkCandidates(articles, { id: "self", lang: "en" });

		expect(candidates.map((candidate) => candidate.id)).toEqual([
			"free-fr",
			"taken-fr",
		]);
	});

	it("does not offer articles already in the same group", () => {
		const candidates = findLinkCandidates(articles, {
			id: "self",
			lang: "en",
			translationKey: "other",
		});

		expect(candidates).toEqual([]);
	});

	it("rejects joining a group that already contains the source locale", () => {
		const grouped = [
			createArticle({ id: "self", lang: "en" }),
			createArticle({ id: "target", lang: "fr", translationKey: "guide" }),
			createArticle({ id: "existing-en", lang: "en", translationKey: "guide" }),
			createArticle({ id: "existing-de", lang: "de", translationKey: "guide" }),
		];

		expect(
			findLinkCandidates(grouped, grouped[0]).map((candidate) => candidate.id),
		).not.toContain("target");
	});
});

describe("getTranslationLinkError", () => {
	it("rejects items written in the same language", () => {
		const items = [
			createArticle({ id: "source", lang: "en" }),
			createArticle({ id: "target", lang: "en" }),
		];

		expect(getTranslationLinkError(items, items[0], items[1])).toContain(
			'locale "en"',
		);
	});

	it("rejects linking vault assets across custom types", () => {
		const items = [
			createArticle({ id: "source", lang: "en", type: "guides" }),
			createArticle({ id: "target", lang: "fr", type: "notes" }),
		];

		expect(getTranslationLinkError(items, items[0], items[1])).toContain(
			"across vault asset types",
		);
	});

	it("allows adding a new locale to an existing multi-locale group", () => {
		const articles = [
			createArticle({ id: "source", lang: "de" }),
			createArticle({ id: "target", lang: "fr", translationKey: "guide" }),
			createArticle({ id: "english", lang: "en", translationKey: "guide" }),
		];

		expect(
			getTranslationLinkError(articles, articles[0], articles[1]),
		).toBeNull();
	});

	it("rejects duplicate locale members", () => {
		const articles = [
			createArticle({ id: "source", lang: "en" }),
			createArticle({ id: "target", lang: "fr", translationKey: "guide" }),
			createArticle({ id: "english", lang: "en", translationKey: "guide" }),
		];

		expect(
			getTranslationLinkError(articles, articles[0], articles[1]),
		).toContain('locale "en"');
	});

	it("rejects merging two existing groups", () => {
		const articles = [
			createArticle({ id: "source", lang: "en", translationKey: "one" }),
			createArticle({ id: "target", lang: "fr", translationKey: "two" }),
		];

		expect(
			getTranslationLinkError(articles, articles[0], articles[1]),
		).toContain("cannot be merged");
	});
});

describe("createTranslationKey", () => {
	it("slugifies the title and stays within the schema pattern", () => {
		const key = createTranslationKey("Déployer Docker sur NFS !");

		expect(key).toMatch(/^deployer-docker-sur-nfs-[a-z0-9]{6}$/);
	});

	it("falls back to a generic slug when the title has no usable characters", () => {
		expect(createTranslationKey("!!!")).toMatch(/^article-[a-z0-9]{6}$/);
	});

	it("stays unique for identical titles", () => {
		expect(createTranslationKey("Same title")).not.toBe(
			createTranslationKey("Same title"),
		);
	});

	it("never exceeds the persisted key length", () => {
		const key = createTranslationKey("word ".repeat(50));

		expect(key.length).toBeLessThanOrEqual(64);
	});
});
