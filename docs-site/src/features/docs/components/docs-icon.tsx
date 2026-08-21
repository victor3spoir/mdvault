import {
	IconBook,
	IconBooks,
	IconBuildingCommunity,
	IconCloudUpload,
	IconCode,
	IconDatabase,
	IconDownload,
	IconFileText,
	IconFolder,
	IconGauge,
	IconList,
	IconLock,
	IconMail,
	IconMap2,
	IconMessage2,
	IconPencil,
	IconPhoto,
	IconPlug,
	IconRocket,
	IconRoute,
	IconSettings,
	IconShieldLock,
	IconStack2,
	IconUsersGroup,
	IconWorld,
} from "@tabler/icons-react";
import type { ComponentType } from "react";

/**
 * Icons are referenced by name in `docs.config.ts` so the configuration stays
 * data — an author can reorder sections without importing a React component,
 * and an unknown name degrades to a neutral icon instead of a crash.
 */
const ICONS: Record<string, ComponentType<{ className?: string }>> = {
	blocks: IconStack2,
	book: IconBook,
	books: IconBooks,
	cloud: IconCloudUpload,
	code: IconCode,
	database: IconDatabase,
	download: IconDownload,
	file: IconFileText,
	folder: IconFolder,
	gauge: IconGauge,
	globe: IconWorld,
	image: IconPhoto,
	list: IconList,
	lock: IconLock,
	mail: IconMail,
	map: IconMap2,
	message: IconMessage2,
	org: IconBuildingCommunity,
	pencil: IconPencil,
	plug: IconPlug,
	rocket: IconRocket,
	route: IconRoute,
	settings: IconSettings,
	shield: IconShieldLock,
	stack: IconStack2,
	users: IconUsersGroup,
};

export function DocsIcon({
	name,
	className,
}: {
	name?: string;
	className?: string;
}) {
	const Icon = (name && ICONS[name]) || IconFileText;
	return <Icon className={className} />;
}
