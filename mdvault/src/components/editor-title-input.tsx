import { useEffect, useRef } from "react";
import { cn } from "#/lib/utils";

interface EditorTitleInputProps {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	ariaLabel?: string;
	className?: string;
}

function supportsFieldSizing() {
	return typeof CSS !== "undefined" && CSS.supports("field-sizing", "content");
}

/**
 * Borderless editor title field. A textarea so long titles wrap onto the next
 * line instead of scrolling sideways, while still behaving as a single line
 * (Enter ignored, pasted newlines flattened). Grows with CSS field-sizing,
 * falling back to manual height sync.
 */
export function EditorTitleInput({
	value,
	onChange,
	placeholder,
	ariaLabel = "Title",
	className,
}: EditorTitleInputProps) {
	const ref = useRef<HTMLTextAreaElement>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: resync height whenever the title changes
	useEffect(() => {
		const element = ref.current;
		if (!element || supportsFieldSizing()) {
			return;
		}
		element.style.height = "auto";
		element.style.height = `${element.scrollHeight}px`;
	}, [value]);

	return (
		<textarea
			ref={ref}
			rows={1}
			value={value}
			placeholder={placeholder}
			aria-label={ariaLabel}
			onChange={(event) => onChange(event.target.value.replace(/\n/g, " "))}
			onKeyDown={(event) => {
				if (event.key === "Enter") {
					event.preventDefault();
				}
			}}
			className={cn(
				"w-full resize-none overflow-hidden bg-transparent text-3xl leading-tight font-bold tracking-tight outline-none [field-sizing:content] placeholder:text-muted-foreground/40",
				className,
			)}
		/>
	);
}
