const dateFormatter = new Intl.DateTimeFormat("en-US", {
	day: "numeric",
	month: "short",
	timeZone: "UTC",
	year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
	day: "numeric",
	hour: "numeric",
	hour12: true,
	minute: "2-digit",
	month: "short",
	timeZone: "UTC",
	year: "numeric",
});

type DateInput = Date | number | string;

function toDate(value: DateInput): Date {
	if (value instanceof Date) {
		return value;
	}

	return new Date(value);
}

export function formatDate(value: DateInput): string {
	return dateFormatter.format(toDate(value));
}

export function formatDateTime(value: DateInput): string {
	return dateTimeFormatter.format(toDate(value));
}
