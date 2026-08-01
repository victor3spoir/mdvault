import {
	IconFileText,
	IconLanguage,
	IconPhoto,
	IconPlus,
	IconTag,
	IconX,
} from "@tabler/icons-react";
import { type ReactNode, useState } from "react";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { Textarea } from "#/components/ui/textarea";
import { CoverImageSelector } from "#/features/media/components/cover-image-selector";
import { cn } from "#/lib/utils";

const DESCRIPTION_RECOMMENDED_LENGTH = 160;

interface ArticleEditorSettingsSidebarProps {
	lang: "fr" | "en";
	description: string;
	tags: string[];
	coverImage: string;
	collapsed: boolean;
	onLangChange: (value: "fr" | "en") => void;
	onDescriptionChange: (value: string) => void;
	onTagsChange: (value: string[]) => void;
	onCoverImageChange: (url: string) => void;
}

interface SettingsSectionProps {
	icon: ReactNode;
	title: string;
	htmlFor?: string;
	meta?: ReactNode;
	children: ReactNode;
}

function SettingsSection({
	icon,
	title,
	htmlFor,
	meta,
	children,
}: SettingsSectionProps) {
	return (
		<section className="group border-b px-4 py-5 transition-colors last:border-b-0 hover:bg-muted/40">
			<div className="mb-3 flex items-center justify-between gap-2">
				<Label
					htmlFor={htmlFor}
					className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-colors group-hover:text-foreground"
				>
					<span className="flex size-6 items-center justify-center rounded-md border bg-background text-muted-foreground shadow-xs transition-colors group-hover:text-primary">
						{icon}
					</span>
					{title}
				</Label>
				{meta}
			</div>
			{children}
		</section>
	);
}

export function ArticleEditorSettingsSidebar({
	lang,
	description,
	tags,
	coverImage,
	collapsed,
	onLangChange,
	onDescriptionChange,
	onTagsChange,
	onCoverImageChange,
}: ArticleEditorSettingsSidebarProps) {
	const [tagInput, setTagInput] = useState("");

	const descriptionLength = description.trim().length;
	const descriptionOverLimit =
		descriptionLength > DESCRIPTION_RECOMMENDED_LENGTH;

	function commitTag() {
		const next = tagInput.trim().toLowerCase();
		if (next && !tags.includes(next)) {
			onTagsChange([...tags, next]);
		}
		setTagInput("");
	}

	return (
		<aside
			id="article-settings-sidebar"
			aria-label="Article settings"
			className={cn(
				"shrink-0 border-l bg-muted/20 transition-all duration-300 ease-in-out",
				collapsed ? "w-0 overflow-hidden" : "w-80",
			)}
		>
			<div className="flex h-full w-80 flex-col overflow-hidden">
				<div className="flex h-12 shrink-0 items-center justify-between border-b bg-background/60 px-4 backdrop-blur-sm">
					<h3 className="text-sm font-semibold">Article Settings</h3>
				</div>

				<div className="flex-1 overflow-y-auto">
					<SettingsSection
						icon={<IconLanguage className="size-3.5" />}
						title="Language"
						htmlFor="article-language"
					>
						<Select
							value={lang}
							onValueChange={(value) => onLangChange(value as "fr" | "en")}
						>
							<SelectTrigger id="article-language" className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectItem value="en">
										<span aria-hidden="true">🇬🇧</span> English
									</SelectItem>
									<SelectItem value="fr">
										<span aria-hidden="true">🇫🇷</span> Français
									</SelectItem>
								</SelectGroup>
							</SelectContent>
						</Select>
					</SettingsSection>

					<SettingsSection
						icon={<IconFileText className="size-3.5" />}
						title="Description"
						htmlFor="article-description"
						meta={
							<span
								className={cn(
									"font-mono text-[10px] tabular-nums",
									descriptionOverLimit
										? "text-destructive"
										: "text-muted-foreground/70",
								)}
							>
								{descriptionLength}/{DESCRIPTION_RECOMMENDED_LENGTH}
							</span>
						}
					>
						<Textarea
							id="article-description"
							value={description}
							onChange={(event) => onDescriptionChange(event.target.value)}
							rows={4}
							placeholder="Brief description for previews..."
							className="resize-none bg-background"
						/>
						<p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground/70">
							Shown in article cards and search previews.
						</p>
					</SettingsSection>

					<SettingsSection
						icon={<IconTag className="size-3.5" />}
						title="Tags"
						htmlFor="article-tag"
						meta={
							tags.length > 0 ? (
								<span className="rounded-full border bg-background px-1.5 py-px font-mono text-[10px] tabular-nums text-muted-foreground">
									{tags.length}
								</span>
							) : undefined
						}
					>
						<div className="flex gap-2">
							<Input
								id="article-tag"
								value={tagInput}
								onChange={(event) => setTagInput(event.target.value)}
								onKeyDown={(event) => {
									if (event.key === "Enter" || event.key === ",") {
										event.preventDefault();
										commitTag();
									} else if (
										event.key === "Backspace" &&
										!tagInput &&
										tags.length > 0
									) {
										onTagsChange(tags.slice(0, -1));
									}
								}}
								placeholder="Add tag, press Enter..."
								className="bg-background"
							/>
							<Button
								type="button"
								size="icon"
								variant="secondary"
								disabled={!tagInput.trim()}
								aria-label="Add tag"
								onClick={commitTag}
							>
								<IconPlus className="size-3.5" />
							</Button>
						</div>
						{tags.length > 0 ? (
							<div className="mt-3 flex flex-wrap gap-1.5">
								{tags.map((tag) => (
									<span
										key={tag}
										className="group/tag inline-flex items-center gap-1 rounded-full border bg-background py-1 pr-1.5 pl-2.5 text-xs shadow-xs transition-colors hover:border-destructive/40"
									>
										<span className="text-muted-foreground/60">#</span>
										{tag}
										<button
											type="button"
											aria-label={`Remove tag ${tag}`}
											className="flex size-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
											onClick={() =>
												onTagsChange(tags.filter((value) => value !== tag))
											}
										>
											<IconX className="size-3" />
										</button>
									</span>
								))}
							</div>
						) : (
							<p className="mt-2 text-[11px] text-muted-foreground/70">
								No tags yet. Tags help readers discover this article.
							</p>
						)}
					</SettingsSection>

					<SettingsSection
						icon={<IconPhoto className="size-3.5" />}
						title="Cover Image"
					>
						<CoverImageSelector
							selectedImageUrl={coverImage}
							onSelectImage={(image) => onCoverImageChange(image.url)}
						/>
					</SettingsSection>
				</div>
			</div>
		</aside>
	);
}
