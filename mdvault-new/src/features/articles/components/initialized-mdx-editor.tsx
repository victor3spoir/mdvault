import {
	BlockTypeSelect,
	BoldItalicUnderlineToggles,
	ChangeCodeMirrorLanguage,
	CodeMirrorEditor,
	CodeToggle,
	ConditionalContents,
	CreateLink,
	codeBlockPlugin,
	codeMirrorPlugin,
	DiffSourceToggleWrapper,
	diffSourcePlugin,
	frontmatterPlugin,
	headingsPlugin,
	InsertCodeBlock,
	InsertFrontmatter,
	InsertTable,
	InsertThematicBreak,
	imagePlugin,
	ListsToggle,
	linkDialogPlugin,
	linkPlugin,
	listsPlugin,
	MDXEditor,
	type MDXEditorMethods,
	type MDXEditorProps,
	markdownShortcutPlugin,
	quotePlugin,
	Separator,
	tablePlugin,
	thematicBreakPlugin,
	toolbarPlugin,
	UndoRedo,
} from "@mdxeditor/editor";
import { IconPhoto } from "@tabler/icons-react";
import type { ForwardedRef } from "react";
import "@mdxeditor/editor/style.css";

export interface InitializedMDXEditorProps extends MDXEditorProps {
	editorRef: ForwardedRef<MDXEditorMethods> | null;
	onImageUpload?: (file: File) => Promise<string>;
	onImageInsertClick?: () => void;
	imagePreviewHandler?: (imageSource: string) => Promise<string>;
}

function InsertImageButton({
	onImageInsertClick,
}: {
	onImageInsertClick?: () => void;
}) {
	return (
		<button
			type="button"
			onClick={() => onImageInsertClick?.()}
			title="Insert image from library"
			className="mdxeditor-toolbar-button"
			aria-label="Insert image"
		>
			<IconPhoto className="h-4 w-4" />
		</button>
	);
}

export default function InitializedMDXEditor({
	editorRef,
	onImageUpload,
	onImageInsertClick,
	imagePreviewHandler,
	...props
}: InitializedMDXEditorProps) {
	const imageUploadHandler = async (image: File): Promise<string> => {
		if (onImageUpload) {
			return onImageUpload(image);
		}

		return URL.createObjectURL(image);
	};

	return (
		<MDXEditor
			plugins={[
				headingsPlugin({ allowedHeadingLevels: [2, 3, 4, 5, 6] }),
				listsPlugin(),
				quotePlugin(),
				thematicBreakPlugin(),
				linkPlugin(),
				linkDialogPlugin(),
				tablePlugin(),
				frontmatterPlugin(),
				codeBlockPlugin({
					defaultCodeBlockLanguage: "ts",
					codeBlockEditorDescriptors: [
						{
							priority: -10,
							match: () => true,
							Editor: CodeMirrorEditor,
						},
					],
				}),
				codeMirrorPlugin({
					codeBlockLanguages: {
						js: "JavaScript",
						jsx: "JSX",
						ts: "TypeScript",
						tsx: "TSX",
						css: "CSS",
						html: "HTML",
						python: "Python",
						bash: "Bash",
						json: "JSON",
						md: "Markdown",
						yml: "YAML",
					},
				}),
				imagePlugin({
					imageUploadHandler,
					imagePreviewHandler,
					imageAutocompleteSuggestions: [],
				}),
				diffSourcePlugin({ viewMode: "rich-text" }),
				markdownShortcutPlugin(),
				toolbarPlugin({
					toolbarContents: () => (
						<DiffSourceToggleWrapper>
							<ConditionalContents
								options={[
									{
										when: (editor) => editor?.editorType === "codeblock",
										contents: () => <ChangeCodeMirrorLanguage />,
									},
									{
										fallback: () => (
											<>
												<UndoRedo />
												<Separator />
												<BoldItalicUnderlineToggles />
												<CodeToggle />
												<Separator />
												<ListsToggle />
												<Separator />
												<BlockTypeSelect />
												<Separator />
												<CreateLink />
												<InsertCodeBlock />
												<InsertImageButton
													onImageInsertClick={onImageInsertClick}
												/>
												<InsertTable />
												<InsertThematicBreak />
												<Separator />
												<InsertFrontmatter />
											</>
										),
									},
								]}
							/>
						</DiffSourceToggleWrapper>
					),
				}),
			]}
			{...props}
			ref={editorRef}
			className="mdx-editor-wrapper"
		/>
	);
}
