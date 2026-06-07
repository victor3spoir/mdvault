import {
	IconFileText,
	IconLanguage,
	IconPhoto,
	IconPlus,
	IconTag,
	IconX,
} from "@tabler/icons-react";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import { Separator } from "#/components/ui/separator";
import { Textarea } from "#/components/ui/textarea";
import { CoverImageSelector } from "#/features/media/components/cover-image-selector";
import { cn } from "#/lib/utils";

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
	onCollapse: () => void;
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
	onCollapse,
}: ArticleEditorSettingsSidebarProps) {
	const [tagInput, setTagInput] = useState("");

	return (
		<aside
			className={cn(
				"shrink-0 border-l bg-muted/20 transition-all duration-300 ease-in-out",
				collapsed ? "w-0 overflow-hidden" : "w-80",
			)}
		>
			<div className="flex h-full w-80 flex-col overflow-hidden">
				<div className="flex h-12 shrink-0 items-center justify-between border-b px-4">
					<h3 className="text-sm font-semibold">Article Settings</h3>
					<Button
						variant="ghost"
						size="icon"
						className="size-7 rounded-lg"
						onClick={onCollapse}
					>
						<IconX className="size-3.5" />
					</Button>
				</div>

				<div className="flex-1 overflow-y-auto">
					<div className="space-y-6 p-4">
						<div className="space-y-2">
							<Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
								<IconLanguage className="size-3.5" />
								Language
							</Label>
							<Select
								value={lang}
								onValueChange={(value) => onLangChange(value as "fr" | "en")}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="en">English</SelectItem>
									<SelectItem value="fr">Français</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<Separator />

						<div className="space-y-2">
							<Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
								<IconFileText className="size-3.5" />
								Description
							</Label>
							<Textarea
								value={description}
								onChange={(event) => onDescriptionChange(event.target.value)}
								rows={4}
								placeholder="Brief description for previews..."
							/>
						</div>

						<Separator />

						<div className="space-y-3">
							<Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
								<IconTag className="size-3.5" />
								Tags
							</Label>
							<div className="flex gap-2">
								<Input
									value={tagInput}
									onChange={(event) => setTagInput(event.target.value)}
									onKeyDown={(event) => {
										if (event.key === "Enter") {
											event.preventDefault();
											const next = tagInput.trim();
											if (next && !tags.includes(next)) {
												onTagsChange([...tags, next]);
												setTagInput("");
											}
										}
									}}
									placeholder="Add tag..."
								/>
								<Button
									type="button"
									size="icon"
									variant="secondary"
									disabled={!tagInput.trim()}
									onClick={() => {
										const next = tagInput.trim();
										if (next && !tags.includes(next)) {
											onTagsChange([...tags, next]);
											setTagInput("");
										}
									}}
								>
									<IconPlus className="size-3.5" />
								</Button>
							</div>
							<div className="flex flex-wrap gap-2">
								{tags.map((tag) => (
									<div
										key={tag}
										className="inline-flex items-center gap-1 rounded-md border bg-background px-2 py-1 text-xs"
									>
										<span>{tag}</span>
										<button
											type="button"
											onClick={() =>
												onTagsChange(tags.filter((value) => value !== tag))
											}
										>
											<IconX className="size-3" />
										</button>
									</div>
								))}
							</div>
						</div>

						<Separator />

						<div className="space-y-3">
							<Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
								<IconPhoto className="size-3.5" />
								Cover Image
							</Label>
							<CoverImageSelector
								selectedImageUrl={coverImage}
								onSelectImage={(image) => onCoverImageChange(image.url)}
							/>
						</div>
					</div>
				</div>
			</div>
		</aside>
	);
}
