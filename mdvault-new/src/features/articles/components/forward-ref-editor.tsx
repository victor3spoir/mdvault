import type { MDXEditorMethods, MDXEditorProps } from "@mdxeditor/editor";
import { forwardRef, lazy, Suspense } from "react";

const Editor = lazy(
	() => import("#/features/articles/components/initialized-mdx-editor"),
);

export interface ForwardRefEditorProps extends MDXEditorProps {
	onImageUpload?: (file: File) => Promise<string>;
	onImageInsertClick?: () => void;
	imagePreviewHandler?: (imageSource: string) => Promise<string>;
}

export const ForwardRefEditor = forwardRef<
	MDXEditorMethods,
	ForwardRefEditorProps
>((props, ref) => (
	<Suspense
		fallback={
			<div className="flex flex-1 items-center justify-center border bg-muted/30">
				<span className="text-sm text-muted-foreground">Loading editor...</span>
			</div>
		}
	>
		<Editor {...props} editorRef={ref} />
	</Suspense>
));

ForwardRefEditor.displayName = "ForwardRefEditor";
