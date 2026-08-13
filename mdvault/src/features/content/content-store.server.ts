import { randomUUID } from "node:crypto";
import {
	assertContentRevision,
	type ContentMutationResult,
	ContentNotFoundError,
	type ContentRevision,
	getContentPathCandidates,
	InvalidContentError,
	resolveContentPath,
} from "#/features/shared/content-revision";
import type { ActionResult } from "#/features/shared/shared.types";
import { getGitHubEnv } from "#/integrations/github/github-env.server";
import { buildMarkdownDocument, parseFrontmatter } from "#/lib/frontmatter";
import { getRepositoryFilePath } from "#/lib/repository-path";
import {
	createContentErrorMessage,
	isGitHubNotFoundError,
} from "#/lib/server/content-errors.server";
import {
	deleteRepositoryFile,
	listMarkdownEntries,
	readRepositoryFile,
	readRepositoryFiles,
	writeRepositoryFile,
} from "#/lib/server/github-files.server";
import { logger } from "#/lib/server/logger";

/** Shape shared by every stored document; kinds add their own metadata. */
export interface ContentDocument {
	id: string;
	title: string;
	content: string;
	published: boolean;
	author?: string;
	createdAt: string;
	updatedAt: string;
	publishedAt?: string;
	path: string;
	sha: string;
}

/**
 * Articles, posts and vault assets differ only in location, metadata and
 * naming. Everything else is shared.
 */
export interface ContentKind<TDocument extends ContentDocument, TCreate> {
	/** Human readable noun used in error messages, e.g. "Article". */
	label: string;
	/** Repository directory holding the documents of this kind. */
	root: () => string;
	/** Noun used in commit messages, e.g. "article". */
	commitNoun: string;
	/** Turns persisted frontmatter into a document, or throws if invalid. */
	toDocument: (input: {
		id: string;
		data: Record<string, unknown>;
		body: string;
		path: string;
		sha: string;
	}) => TDocument;
	/** Turns a document back into the frontmatter to persist. */
	toFrontmatter: (document: TDocument) => Record<string, unknown>;
	/** Builds the initial document for a create request. */
	toNewDocument: (input: {
		id: string;
		input: TCreate;
		body: string;
		now: string;
		author: string;
	}) => TDocument;
}

/** Editing preserves the publication date; publishing re-stamps it. */
type PublishStamp = "preserve" | "stamp";

function nextPublishedAt(
	existing: string | undefined,
	published: boolean,
	now: string,
	stamp: PublishStamp,
) {
	if (!published) {
		return undefined;
	}

	return stamp === "stamp" ? now : (existing ?? now);
}

function currentAuthor() {
	return getGitHubEnv().GITHUB_OWNER;
}

function sortByNewest<TDocument extends ContentDocument>(
	documents: TDocument[],
) {
	return documents.sort(
		(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
	);
}

export interface ContentStore<TDocument extends ContentDocument, TCreate> {
	list: () => Promise<ActionResult<TDocument[]>>;
	get: (id: string, path?: string) => Promise<ActionResult<TDocument>>;
	create: (input: TCreate) => Promise<ActionResult<string>>;
	update: (
		id: string,
		patch: Partial<TDocument> & { content?: string },
		revision: ContentRevision,
	) => Promise<ActionResult<ContentMutationResult>>;
	remove: (
		id: string,
		revision: ContentRevision,
	) => Promise<ActionResult<boolean>>;
	setPublished: (
		id: string,
		published: boolean,
		revision: ContentRevision,
	) => Promise<ActionResult<ContentMutationResult>>;
}

export function createContentStore<TDocument extends ContentDocument, TCreate>(
	kind: ContentKind<TDocument, TCreate>,
): ContentStore<TDocument, TCreate> {
	const parseDocument = (file: {
		path: string;
		sha: string;
		content: string;
	}) => {
		const { data, body } = parseFrontmatter(file.content);
		const id = (file.path.split("/").pop() ?? "").replace(/\.mdx?$/, "");

		return kind.toDocument({ id, data, body, path: file.path, sha: file.sha });
	};

	const writeDocument = async (
		document: TDocument,
		message: string,
		sha?: string,
	) =>
		writeRepositoryFile(
			document.path,
			buildMarkdownDocument(kind.toFrontmatter(document), document.content),
			message,
			sha,
		);

	/** Tolerates both `.md` and `.mdx`, and a caller supplied path. */
	const load = async (id: string, requestedPath?: string) => {
		const root = kind.root();
		const paths = requestedPath
			? [resolveContentPath(root, id, requestedPath)].filter(
					(path): path is string => path !== null,
				)
			: getContentPathCandidates(root, id);

		for (const path of paths) {
			const file = await readRepositoryFile(path);
			if (file) {
				return parseDocument(file);
			}
		}

		throw new ContentNotFoundError(kind.label);
	};

	const failure = (error: unknown) => ({
		success: false as const,
		error: createContentErrorMessage(error, kind.label),
	});

	return {
		async list() {
			try {
				const entries = await listMarkdownEntries(kind.root());
				const files = await readRepositoryFiles(
					entries.map((entry) => entry.path),
				);

				const documents = files.flatMap((file) => {
					if (!file) {
						return [];
					}

					try {
						return [parseDocument(file)];
					} catch (error) {
						logger.error(
							`Skipping invalid ${kind.label.toLowerCase()}`,
							error,
							{
								path: file.path,
							},
						);
						return [];
					}
				});

				return { success: true as const, data: sortByNewest(documents) };
			} catch (error) {
				if (isGitHubNotFoundError(error)) {
					return { success: true as const, data: [] };
				}
				logger.error(`Failed to list ${kind.label.toLowerCase()}s`, error);
				return failure(error);
			}
		},

		async get(id, path) {
			try {
				return { success: true as const, data: await load(id, path) };
			} catch (error) {
				logger.error(`Failed to get ${kind.label.toLowerCase()}`, error, {
					id,
				});
				return failure(error);
			}
		},

		async create(input) {
			try {
				const id = randomUUID();
				const path = getRepositoryFilePath(kind.root(), id, ".md");
				if (!path) {
					return {
						success: false as const,
						error: `Invalid ${kind.label.toLowerCase()} id`,
					};
				}

				const now = new Date().toISOString();
				const document = kind.toNewDocument({
					id,
					input,
					// Editor content may carry its own frontmatter; only the body is used.
					body: parseFrontmatter(contentOf(input)).body,
					now,
					author: currentAuthor(),
				});

				await writeDocument(
					{ ...document, path },
					`Create ${kind.commitNoun}: ${document.title}`,
				);

				return { success: true as const, data: id };
			} catch (error) {
				logger.error(`Failed to create ${kind.label.toLowerCase()}`, error);
				return failure(error);
			}
		},

		async update(id, patch, revision) {
			try {
				const path = resolveContentPath(kind.root(), id, revision.path);
				if (!path) {
					return {
						success: false as const,
						error: `${kind.label} not found`,
					};
				}

				const existing = await load(id, path);
				assertContentRevision(revision.sha, existing.sha, kind.label);

				const now = new Date().toISOString();
				const published = patch.published ?? existing.published;
				const content =
					patch.content === undefined
						? existing.content
						: parseFrontmatter(patch.content).body;

				const next = {
					...existing,
					...patch,
					content,
					published,
					author: patch.author ?? existing.author ?? currentAuthor(),
					createdAt: existing.createdAt,
					updatedAt: now,
					publishedAt: nextPublishedAt(
						existing.publishedAt,
						published,
						now,
						"preserve",
					),
					path,
					sha: existing.sha,
				} as TDocument;

				const sha = await writeDocument(
					next,
					`Update ${kind.commitNoun}: ${next.title}`,
					revision.sha,
				);

				return { success: true as const, data: { id, path, sha } };
			} catch (error) {
				logger.error(`Failed to update ${kind.label.toLowerCase()}`, error, {
					id,
				});
				return failure(error);
			}
		},

		async remove(id, revision) {
			try {
				const path = resolveContentPath(kind.root(), id, revision.path);
				if (!path) {
					return { success: false as const, error: `${kind.label} not found` };
				}

				await deleteRepositoryFile(
					path,
					`Delete ${kind.commitNoun}: ${id}`,
					revision.sha,
				);

				return { success: true as const, data: true };
			} catch (error) {
				logger.error(`Failed to delete ${kind.label.toLowerCase()}`, error, {
					id,
				});
				return failure(error);
			}
		},

		async setPublished(id, published, revision) {
			try {
				const path = resolveContentPath(kind.root(), id, revision.path);
				if (!path) {
					return { success: false as const, error: `${kind.label} not found` };
				}

				const existing = await load(id, path);
				assertContentRevision(revision.sha, existing.sha, kind.label);

				const now = new Date().toISOString();
				const next = {
					...existing,
					published,
					author: existing.author ?? currentAuthor(),
					updatedAt: now,
					publishedAt: nextPublishedAt(
						existing.publishedAt,
						published,
						now,
						"stamp",
					),
				} as TDocument;

				const sha = await writeDocument(
					next,
					`${published ? "Publish" : "Unpublish"} ${kind.commitNoun}: ${next.title}`,
					revision.sha,
				);

				return { success: true as const, data: { id, path, sha } };
			} catch (error) {
				logger.error(
					`Failed to change ${kind.label.toLowerCase()} status`,
					error,
					{ id },
				);
				return failure(error);
			}
		},
	};
}

function contentOf(input: unknown) {
	return typeof input === "object" &&
		input !== null &&
		typeof (input as { content?: unknown }).content === "string"
		? (input as { content: string }).content
		: "";
}

export { InvalidContentError };
