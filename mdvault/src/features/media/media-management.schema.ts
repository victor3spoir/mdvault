import { z } from "zod";

export const MediaTargetsSchema = z
	.array(
		z.object({
			path: z.string().trim().min(1).max(1024),
			sha: z.string().regex(/^[a-f0-9]{40}$/i, "Invalid media revision"),
		}),
	)
	.min(1)
	.max(100)
	.refine(
		(targets) =>
			new Set(targets.map((target) => target.path)).size === targets.length,
		"Select each asset only once",
	);

export const MoveMediaSchema = z.object({
	targets: MediaTargetsSchema,
	folder: z.string().trim().max(255),
});
