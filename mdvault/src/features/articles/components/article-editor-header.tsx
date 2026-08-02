import {
	IconArrowLeft,
	IconCheck,
	IconCloud,
	IconCloudOff,
	IconDeviceFloppy,
	IconEye,
	IconFileText,
	IconLoader2,
	IconSettings,
	IconTrash,
	IconWorldOff,
	IconWorldUpload,
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
	previewMode: boolean;
	onSave: () => void;
	onToggleSidebar: () => void;
	onTogglePreview: () => void;
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
	previewMode,
	onSave,
	onToggleSidebar,
	onTogglePreview,
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
							aria-label="Back to articles"
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

			<div className="flex items-center gap-1.5">
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant={previewMode ? "secondary" : "ghost"}
							size="icon"
							className="size-8 rounded-lg"
							aria-label="Toggle live preview"
							aria-pressed={previewMode}
							onClick={onTogglePreview}
						>
							<IconEye className="size-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent side="bottom">
						{previewMode ? "Close live preview" : "Live preview"}
					</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="size-8 rounded-lg"
							aria-label="Save article"
							onClick={onSave}
							disabled={isSaving || !title}
						>
							{isSaving ? (
								<IconLoader2 className="size-4 animate-spin" />
							) : (
								<IconDeviceFloppy className="size-4" />
							)}
						</Button>
					</TooltipTrigger>
					<TooltipContent side="bottom">
						{isSaving ? "Saving..." : "Save article"}
					</TooltipContent>
				</Tooltip>

				{mode === "edit" && article ? (
					<>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="size-8 rounded-lg"
									aria-label={
										article.published ? "Unpublish article" : "Publish article"
									}
									onClick={onTogglePublish}
								>
									{article.published ? (
										<IconWorldOff className="size-4" />
									) : (
										<IconWorldUpload className="size-4" />
									)}
								</Button>
							</TooltipTrigger>
							<TooltipContent side="bottom">
								{article.published ? "Unpublish" : "Publish"}
							</TooltipContent>
						</Tooltip>

						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="size-8 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
									aria-label="Delete article"
									onClick={onDelete}
								>
									<IconTrash className="size-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent side="bottom">Delete article</TooltipContent>
						</Tooltip>
					</>
				) : null}

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant={sidebarCollapsed ? "secondary" : "ghost"}
							size="icon"
							className="size-8 rounded-lg"
							aria-label={
								sidebarCollapsed
									? "Open article settings"
									: "Close article settings"
							}
							aria-controls="article-settings-sidebar"
							aria-expanded={!sidebarCollapsed}
							onClick={onToggleSidebar}
						>
							<IconSettings className="size-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent side="bottom">
						{sidebarCollapsed ? "Article settings" : "Close settings"}
					</TooltipContent>
				</Tooltip>
			</div>
		</header>
	);
}
