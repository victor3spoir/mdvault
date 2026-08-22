import { useEffect, useRef, useState } from "react";

/** True briefly after `value` changes, never on first render. */
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
