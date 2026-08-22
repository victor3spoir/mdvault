export type MediaEmbedProvider = "youtube" | "vimeo";

export interface MediaEmbedData {
	provider: MediaEmbedProvider;
	id: string;
	sourceUrl: string;
	embedUrl: string;
	label: string;
}

const VIDEO_ID = /^[a-zA-Z0-9_-]{6,}$/;

export function parseMediaEmbed(value: string): MediaEmbedData | null {
	let url: URL;
	try {
		url = new URL(value.trim());
	} catch {
		return null;
	}

	if (url.protocol !== "https:" && url.protocol !== "http:") {
		return null;
	}

	const host = url.hostname.toLowerCase().replace(/^www\./, "");
	let provider: MediaEmbedProvider | null = null;
	let id = "";
	let privacyHash = "";

	if (host === "youtu.be") {
		provider = "youtube";
		id = url.pathname.split("/").filter(Boolean)[0] ?? "";
	} else if (host === "youtube.com" || host === "m.youtube.com") {
		provider = "youtube";
		if (url.pathname === "/watch") {
			id = url.searchParams.get("v") ?? "";
		} else {
			const parts = url.pathname.split("/").filter(Boolean);
			if (parts[0] === "embed" || parts[0] === "shorts") {
				id = parts[1] ?? "";
			}
		}
	} else if (host === "vimeo.com") {
		provider = "vimeo";
		const parts = url.pathname.split("/").filter(Boolean);
		id = parts[0] ?? "";
		privacyHash = parts[1] ?? "";
	} else if (host === "player.vimeo.com") {
		provider = "vimeo";
		const parts = url.pathname.split("/").filter(Boolean);
		if (parts[0] === "video") {
			id = parts[1] ?? "";
			privacyHash = url.searchParams.get("h") ?? "";
		}
	}

	if (
		!provider ||
		!VIDEO_ID.test(id) ||
		(privacyHash && !/^[a-zA-Z0-9]+$/.test(privacyHash))
	) {
		return null;
	}

	return {
		provider,
		id,
		sourceUrl: url.toString(),
		embedUrl:
			provider === "youtube"
				? `https://www.youtube-nocookie.com/embed/${id}`
				: `https://player.vimeo.com/video/${id}${
						privacyHash ? `?h=${privacyHash}` : ""
					}`,
		label: provider === "youtube" ? "YouTube video" : "Vimeo video",
	};
}
