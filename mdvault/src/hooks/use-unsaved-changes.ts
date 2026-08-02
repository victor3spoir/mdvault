import { useBlocker } from "@tanstack/react-router";
import { useRef } from "react";

const UNSAVED_CHANGES_MESSAGE =
	"You have unsaved changes. Leave this page without saving?";

export function shouldBlockUnsavedNavigation(
	hasUnsavedChanges: boolean,
	allowNavigation: boolean,
	confirmLeave: () => boolean,
) {
	if (!hasUnsavedChanges || allowNavigation) {
		return false;
	}

	return !confirmLeave();
}

export function useUnsavedChanges(hasUnsavedChanges: boolean) {
	const allowNavigationRef = useRef(false);

	useBlocker({
		shouldBlockFn: () =>
			shouldBlockUnsavedNavigation(
				hasUnsavedChanges,
				allowNavigationRef.current,
				() => window.confirm(UNSAVED_CHANGES_MESSAGE),
			),
		enableBeforeUnload: () => hasUnsavedChanges && !allowNavigationRef.current,
	});

	return () => {
		allowNavigationRef.current = true;
	};
}
