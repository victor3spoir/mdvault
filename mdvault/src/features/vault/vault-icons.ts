import {
	IconArchive,
	IconBook,
	IconBookmark,
	IconBulb,
	IconChecklist,
	IconCode,
	IconFlask,
	IconFolder,
	IconNote,
	IconPencil,
	IconSchool,
	IconStar,
} from "@tabler/icons-react";
import type { AssetIcon } from "#/features/vault/vault.types";

export const ASSET_ICON_COMPONENTS: Record<AssetIcon, typeof IconNote> = {
	note: IconNote,
	book: IconBook,
	school: IconSchool,
	bulb: IconBulb,
	checklist: IconChecklist,
	bookmark: IconBookmark,
	folder: IconFolder,
	flask: IconFlask,
	code: IconCode,
	pencil: IconPencil,
	star: IconStar,
	archive: IconArchive,
};

export function getAssetIcon(icon: string) {
	return ASSET_ICON_COMPONENTS[icon as AssetIcon] ?? ASSET_ICON_COMPONENTS.note;
}
