/** Minimal shape needed to relate language variants of the same content. */
export interface TranslatableContent {
	id: string;
	lang: string;
	translationKey?: string;
	/** Vault asset type. Empty for content kinds whose groups are global. */
	type?: string;
}

export interface TranslationGroup<T extends TranslatableContent> {
	key: string;
	members: T[];
	/** Languages claimed by more than one member, which readers cannot resolve. */
	conflictingLangs: string[];
}

const KEY_MAX_LENGTH = 64;
const KEY_SUFFIX_LENGTH = 6;
const SUFFIX_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

function normalizeKey(value: string | undefined) {
	return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeType(value: string | undefined) {
	return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function randomSuffix() {
	const values = new Uint8Array(KEY_SUFFIX_LENGTH);
	crypto.getRandomValues(values);

	return Array.from(
		values,
		(value) => SUFFIX_ALPHABET[value % SUFFIX_ALPHABET.length],
	).join("");
}

/**
 * Slugifies a title and appends a random suffix. Titles collide across
 * articles far more often than random suffixes do, and a key must identify one
 * group only, so the suffix is what makes it unique rather than the slug.
 */
export function createTranslationKey(title: string): string {
	const slug = title
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");

	const suffix = randomSuffix();
	if (!slug) {
		return `article-${suffix}`;
	}

	return `${slug.slice(0, KEY_MAX_LENGTH - suffix.length - 1)}-${suffix}`;
}

/**
 * Buckets content by translation key and vault type. Items without a key are unrelated to
 * everything, including each other, so they are left out entirely rather than
 * collapsed into a shared empty-key group.
 */
export function groupTranslations<T extends TranslatableContent>(
	items: readonly T[],
): TranslationGroup<T>[] {
	const groups = new Map<string, { key: string; members: T[] }>();

	for (const item of items) {
		const key = normalizeKey(item.translationKey);
		if (!key) {
			continue;
		}

		const groupId = `${normalizeType(item.type)}\0${key}`;
		const group = groups.get(groupId);
		if (group) {
			group.members.push(item);
		} else {
			groups.set(groupId, { key, members: [item] });
		}
	}

	return Array.from(groups.values(), ({ key, members }) => ({
		key,
		members,
		conflictingLangs: findConflictingLangs(members),
	}));
}

function findConflictingLangs<T extends TranslatableContent>(members: T[]) {
	const counts = new Map<string, number>();

	for (const member of members) {
		counts.set(member.lang, (counts.get(member.lang) ?? 0) + 1);
	}

	return Array.from(counts)
		.filter(([, count]) => count > 1)
		.map(([lang]) => lang);
}

/** Siblings of an item: same key and type, different document. */
export function findTranslations<T extends TranslatableContent>(
	items: readonly T[],
	item: Pick<TranslatableContent, "id" | "translationKey"> &
		Partial<Pick<TranslatableContent, "type">>,
): T[] {
	const key = normalizeKey(item.translationKey);
	if (!key) {
		return [];
	}

	const type = normalizeType(item.type);
	return items.filter(
		(candidate) =>
			candidate.id !== item.id &&
			normalizeType(candidate.type) === type &&
			normalizeKey(candidate.translationKey) === key,
	);
}

/**
 * Items that can still receive `item` as a translation: a different
 * language, and not already committed to another group.
 */
export function findLinkCandidates<T extends TranslatableContent>(
	items: readonly T[],
	item: Pick<TranslatableContent, "id" | "lang" | "translationKey"> &
		Partial<Pick<TranslatableContent, "type">>,
): T[] {
	return items.filter(
		(candidate) => getTranslationLinkError(items, item, candidate) === null,
	);
}

/**
 * Validates a manual link against the complete destination group. A group can
 * contain many locales, but each locale may appear only once.
 */
export function getTranslationLinkError<T extends TranslatableContent>(
	items: readonly T[],
	source: Pick<TranslatableContent, "id" | "lang" | "translationKey"> &
		Partial<Pick<TranslatableContent, "type">>,
	target: Pick<TranslatableContent, "id" | "lang" | "translationKey"> &
		Partial<Pick<TranslatableContent, "type">>,
): string | null {
	if (source.id === target.id) {
		return "An item cannot be linked to itself";
	}
	if (normalizeType(source.type) !== normalizeType(target.type)) {
		return "Translations cannot be linked across vault asset types";
	}
	if (source.lang === target.lang) {
		return `A translation group already contains locale "${source.lang}"`;
	}

	const sourceKey = normalizeKey(source.translationKey);
	const targetKey = normalizeKey(target.translationKey);
	if (sourceKey && targetKey) {
		return sourceKey === targetKey
			? "These items are already linked"
			: "Items from two existing translation groups cannot be merged";
	}

	const groupKey = sourceKey || targetKey;
	if (!groupKey) {
		return null;
	}

	const memberLocales = new Set(
		items
			.filter(
				(item) =>
					item.id !== source.id &&
					item.id !== target.id &&
					normalizeType(item.type) === normalizeType(source.type) &&
					normalizeKey(item.translationKey) === groupKey,
			)
			.map((item) => item.lang),
	);

	if (memberLocales.has(source.lang)) {
		return `This translation group already contains locale "${source.lang}"`;
	}
	if (memberLocales.has(target.lang)) {
		return `This translation group already contains locale "${target.lang}"`;
	}

	return null;
}
