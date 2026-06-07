import {
	IconArrowLeft,
	IconCheck,
	IconCloud,
	IconCloudOff,
	IconDeviceFloppy,
	IconEye,
	IconFileText,
	IconSettings,
	IconTrash,
	IconX,
} from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Separator } from "#/components/ui/separator";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/ui/tooltip";
import type { Article } from "#/features/articles/articles.types";

interface ArticleEditorHeaderProps {
	title: string;
	mode: "create" | "edit";
	article?: Article;
	isSaving: boolean;
	hasUnsavedChanges: boolean;
	sidebarCollapsed: boolean;
	onSave: () => void;
	onToggleSidebar: () => void;
	onTogglePublish: () => void;
	onDelete: () => void;
}

export function ArticleEditorHeader({
	title,
	mode,
	article,
	isSaving,
	hasUnsavedChanges,
	sidebarCollapsed,
	onSave,
	onToggleSidebar,
	onTogglePublish,
	onDelete,
}: ArticleEditorHeaderProps) {
	return (
		<header className="flex h-14 shrink-0 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/60">
			<div className="flex items-center gap-3">
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="size-8 rounded-lg"
							asChild
						>
							<Link to="/cms/articles">
								<IconArrowLeft className="size-4" />
							</Link>
						</Button>
					</TooltipTrigger>
					<TooltipContent side="bottom">Back to articles</TooltipContent>
				</Tooltip>

				<Separator orientation="vertical" className="h-5" />

				<nav className="flex items-center gap-2 text-sm">
					<Link
						to="/cms/articles"
						className="text-muted-foreground transition-colors hover:text-foreground"
					>
						Articles
					</Link>
					<span className="text-muted-foreground/50">›</span>
					<span className="max-w-60 truncate font-medium">
						{title || "Untitled"}
					</span>
				</nav>

				<div className="ml-3 flex items-center gap-2">
					<Badge
						variant="secondary"
						className={
							article?.published
								? "h-5 gap-1 rounded-full bg-emerald-500/10 px-2 text-[10px] font-medium text-emerald-600 dark:text-emerald-400"
								: "h-5 gap-1 rounded-full bg-amber-500/10 px-2 text-[10px] font-medium text-amber-600 dark:text-amber-400"
						}
					>
						{article?.published ? (
							<>
								<IconCheck className="size-3" />
								Published
							</>
						) : (
							<>
								<IconFileText className="size-3" />
								Draft
							</>
						)}
					</Badge>

					{hasUnsavedChanges ? (
						<span className="flex items-center gap-1 text-xs text-muted-foreground">
							<IconCloudOff className="size-3" />
							Unsaved
						</span>
					) : mode === "edit" ? (
						<span className="flex items-center gap-1 text-xs text-muted-foreground">
							<IconCloud className="size-3" />
							Saved
						</span>
					) : null}
				</div>
			</div>

			<div className="flex items-center gap-2">
				{mode === "edit" && article ? (
					<Tooltip>
						<TooltipTrigger asChild>
							<Button variant="ghost" size="sm" asChild>
								<Link to="/cms/articles/$id" params={{ id: article.id }}>
									<IconEye className="size-4" />
									Preview
								</Link>
							</Button>
						</TooltipTrigger>
						<TooltipContent side="bottom">Open article preview</TooltipContent>
					</Tooltip>
				) : null}
				<Button
					variant="outline"
					size="sm"
					onClick={onSave}
					disabled={isSaving || !title}
				>
					<IconDeviceFloppy className="size-4" />
					{isSaving ? "Saving..." : "Save"}
				</Button>
				{mode === "edit" && article ? (
					<>
						<Button variant="outline" size="sm" onClick={onTogglePublish}>
							{article.published ? (
								<IconX className="size-4" />
							) : (
								<IconCheck className="size-4" />
							)}
							{article.published ? "Unpublish" : "Publish"}
						</Button>
						<Button variant="outline" size="sm" onClick={onDelete}>
							<IconTrash className="size-4" />
							Delete
						</Button>
					</>
				) : null}
				<Button
					variant={sidebarCollapsed ? "secondary" : "ghost"}
					size="icon"
					className="size-8 rounded-lg"
					onClick={onToggleSidebar}
				>
					<IconSettings className="size-4" />
				</Button>
			</div>
		</header>
	);
}
