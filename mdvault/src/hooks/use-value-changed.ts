import { useEffect, useRef, useState } from "react";

/**
 * Reports `true` for a short moment after `value` changes, and never on the
 * first render.
 *
 * This is what lets a status badge animate when the user publishes something,
 * without every card in a list animating each time the list is displayed - a
 * group entrance on a surface people visit many times a day reads as sluggish,
 * not delightful.
 */
export function useValueChanged<T>(value: T, duration = 400) {
	const [changed, setChanged] = useState(false);
	const previous = useRef(value);

	useEffect(() => {
		if (previous.current === value) {
			return;
		}

		previous.current = value;
		setChanged(true);

		const timeout = setTimeout(() => setChanged(false), duration);
		return () => clearTimeout(timeout);
	}, [value, duration]);

	return changed;
}
