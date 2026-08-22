import { IconLink, IconUnlink } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { LocaleFlag } from "#/components/locale-flag";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import {
	linkArticleTranslationMutation,
	unlinkArticleTranslationMutation,
} from "#/features/articles/articles.functions";
import {
	articleKeys,
	articleTranslationsQueryOptions,
} from "#/features/articles/articles.queries";
import type { ContentRevision } from "#/features/shared/content-revision";
import { getLocaleBadge, getLocaleLabel } from "#/features/shared/locales";

interface ArticleTranslationsSectionProps {
	articleId?: string;
	revision: ContentRevision | null;
	onRevisionChange: (revision: ContentRevision) => void;
}

export function ArticleTranslationsSection({
	articleId,
	revision,
	onRevisionChange,
}: ArticleTranslationsSectionProps) {
	const queryClient = useQueryClient();
	const [selectedId, setSelectedId] = useState("");

	const { data, isPending } = useQuery({
		...articleTranslationsQueryOptions(articleId ?? ""),
		enabled: Boolean(articleId),
	});

	async function refresh() {
		await queryClient.invalidateQueries({
			queryKey: articleKeys.all,
			refetchType: "all",
		});
	}

	const link = useMutation({
		mutationFn: (targetId: string) =>
			linkArticleTranslationMutation({
				data: { id: articleId ?? "", targetId },
			}),
		onSuccess: async (result) => {
			onRevisionChange({
				path: result.revision.path,
				sha: result.revision.sha,
			});
			setSelectedId("");
			await refresh();
			toast.success("Translation linked");
		},
		onError: (error) => toast.error(error.message),
	});

	const unlink = useMutation({
		mutationFn: (current: ContentRevision) =>
			unlinkArticleTranslationMutation({
				data: { id: articleId ?? "", revision: current },
			}),
		onSuccess: async (result) => {
			onRevisionChange({ path: result.path, sha: result.sha });
			await refresh();
			toast.success("Translation unlinked");
		},
		onError: (error) => toast.error(error.message),
	});

	if (!articleId) {
		return (
			<p className="text-[11px] leading-relaxed text-muted-foreground/70">
				Save this article first if you want to link another language version.
			</p>
		);
	}

	const translations = data?.translations ?? [];
	const candidates = data?.candidates ?? [];
	const busy = link.isPending || unlink.isPending;
	return (
		<div className="space-y-3">
			{translations.length > 0 ? (
				<ul className="space-y-1.5">
					{translations.map((translation) => (
						<li
							key={translation.id}
							className="flex items-center gap-2 rounded-md border bg-background px-2.5 py-2 shadow-xs"
						>
							<Badge variant="secondary" className="shrink-0 font-mono">
								<LocaleFlag locale={translation.lang} />
								{getLocaleBadge(translation.lang)}
							</Badge>
							<Link
								to="/cms/articles/$id/edit"
								params={{ id: translation.id }}
								className="min-w-0 flex-1 truncate text-xs hover:underline"
								title={translation.title}
							>
								{translation.title}
							</Link>
							{!translation.published ? (
								<span className="shrink-0 text-[10px] text-muted-foreground/70">
									Draft
								</span>
							) : null}
						</li>
					))}
				</ul>
			) : (
				<p className="text-[11px] leading-relaxed text-muted-foreground/70">
					{isPending
						? "Loading translations..."
						: "Not linked to any other language yet."}
				</p>
			)}

			{candidates.length > 0 ? (
				<div className="flex gap-2">
					<Select
						value={selectedId}
						onValueChange={setSelectedId}
						disabled={busy}
					>
						<SelectTrigger
							aria-label="Article to link as translation"
							className="min-w-0 flex-1"
						>
							<SelectValue placeholder="Link an article..." />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								{candidates.map((candidate) => (
									<SelectItem key={candidate.id} value={candidate.id}>
										<LocaleFlag locale={candidate.lang} />
										<span className="font-mono text-[10px] text-muted-foreground">
											{getLocaleBadge(candidate.lang)}
										</span>{" "}
										{candidate.title} ({getLocaleLabel(candidate.lang)})
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
					<Button
						type="button"
						size="icon"
						variant="secondary"
						aria-label="Link translation"
						disabled={!selectedId || busy}
						onClick={() => link.mutate(selectedId)}
					>
						<IconLink className="size-3.5" />
					</Button>
				</div>
			) : (
				<p className="text-[11px] leading-relaxed text-muted-foreground/70">
					{isPending ? null : "No compatible article is available to link."}
				</p>
			)}

			{translations.length > 0 && revision ? (
				<Button
					type="button"
					size="sm"
					variant="ghost"
					className="w-full justify-start text-muted-foreground hover:text-destructive"
					disabled={busy}
					onClick={() => unlink.mutate(revision)}
				>
					<IconUnlink className="size-3.5" />
					Remove from this group
				</Button>
			) : null}
		</div>
	);
}
