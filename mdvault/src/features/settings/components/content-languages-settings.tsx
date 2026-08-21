import {
	IconLanguage,
	IconLoader2,
	IconPlus,
	IconTrash,
} from "@tabler/icons-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { LocaleFlag } from "#/components/locale-flag";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import {
	ContentLocaleConfigSchema,
	getLocaleLabel,
	LocaleSchema,
} from "#/features/shared/locales";
import { updateContentLocalesMutation } from "#/features/vault/vault.functions";
import {
	invalidateVaultConfig,
	vaultConfigQueryOptions,
} from "#/features/vault/vault.queries";

export function ContentLanguagesSettings() {
	const queryClient = useQueryClient();
	const router = useRouter();
	const config = useQuery(vaultConfigQueryOptions());
	const [isPending, startTransition] = useTransition();
	const [locales, setLocales] = useState<string[]>([]);
	const [defaultLocale, setDefaultLocale] = useState("");
	const [localeInput, setLocaleInput] = useState("");
	const [inputError, setInputError] = useState("");

	useEffect(() => {
		if (!config.data) {
			return;
		}

		setLocales(config.data.locales);
		setDefaultLocale(config.data.defaultLocale);
	}, [config.data]);

	function addLocale() {
		const parsed = LocaleSchema.safeParse(localeInput);
		if (!parsed.success) {
			setInputError(parsed.error.issues[0]?.message ?? "Invalid locale");
			return;
		}
		if (locales.includes(parsed.data)) {
			setInputError("This locale is already enabled");
			return;
		}

		setLocales((current) => [...current, parsed.data]);
		setDefaultLocale((current) => current || parsed.data);
		setLocaleInput("");
		setInputError("");
	}

	function removeLocale(locale: string) {
		if (locales.length === 1) {
			return;
		}

		const next = locales.filter((value) => value !== locale);
		setLocales(next);
		if (defaultLocale === locale) {
			setDefaultLocale(next[0] ?? "");
		}
	}

	function save() {
		const parsed = ContentLocaleConfigSchema.safeParse({
			locales,
			defaultLocale,
		});
		if (!parsed.success) {
			toast.error(parsed.error.issues[0]?.message ?? "Invalid languages");
			return;
		}

		startTransition(async () => {
			try {
				await updateContentLocalesMutation({ data: parsed.data });
				await invalidateVaultConfig(queryClient);
				router.invalidate();
				toast.success("Content languages updated");
			} catch (error) {
				toast.error(
					error instanceof Error
						? error.message
						: "Failed to update content languages",
				);
			}
		});
	}

	if (config.isLoading) {
		return (
			<div className="flex items-center gap-2 rounded-xl border bg-card p-6 text-sm text-muted-foreground">
				<IconLoader2 className="size-4 animate-spin" />
				Loading configuration...
			</div>
		);
	}

	return (
		<div className="rounded-xl border bg-card">
			<div className="flex items-center gap-3 border-b p-6">
				<div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
					<IconLanguage className="size-5 text-primary" />
				</div>
				<div>
					<h2 className="font-semibold">Content Languages</h2>
					<p className="text-sm text-muted-foreground">
						Choose the locales available when editing content.
					</p>
				</div>
			</div>

			<div className="@container/languages space-y-6 p-6">
				<div className="space-y-2">
					<Label htmlFor="default-content-locale">Default language</Label>
					<Select value={defaultLocale} onValueChange={setDefaultLocale}>
						<SelectTrigger
							id="default-content-locale"
							className="w-full @lg/languages:w-72"
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{locales.map((locale) => (
								<SelectItem key={locale} value={locale}>
									<LocaleFlag locale={locale} />
									{getLocaleLabel(locale)} ({locale})
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<p className="text-xs text-muted-foreground">
						Used for newly created articles, posts, and custom content.
					</p>
				</div>

				<div className="space-y-3">
					<Label htmlFor="content-locale">Enabled languages</Label>
					<div className="flex max-w-md gap-2">
						<Input
							id="content-locale"
							value={localeInput}
							onChange={(event) => {
								setLocaleInput(event.target.value);
								setInputError("");
							}}
							onKeyDown={(event) => {
								if (event.key === "Enter") {
									event.preventDefault();
									addLocale();
								}
							}}
							placeholder="es or pt-BR"
							aria-invalid={Boolean(inputError)}
							className="font-mono"
						/>
						<Button
							type="button"
							variant="secondary"
							onClick={addLocale}
							disabled={!localeInput.trim()}
						>
							<IconPlus data-icon="inline-start" />
							Add
						</Button>
					</div>
					{inputError ? (
						<p className="text-xs text-destructive">{inputError}</p>
					) : (
						<p className="text-xs text-muted-foreground">
							Use a locale identifier such as en, fr, es, or pt-BR.
						</p>
					)}

					<div className="divide-y rounded-lg border">
						{locales.map((locale) => (
							<div
								key={locale}
								className="flex items-center justify-between gap-3 px-4 py-3"
							>
								<div className="flex min-w-0 items-center gap-3">
									<LocaleFlag locale={locale} className="h-4 w-6" />
									<div className="min-w-0">
										<p className="truncate text-sm font-medium">
											{getLocaleLabel(locale)}
										</p>
										<p className="font-mono text-xs text-muted-foreground">
											{locale}
										</p>
									</div>
								</div>
								<div className="flex items-center gap-2">
									{locale === defaultLocale ? (
										<Badge variant="secondary">Default</Badge>
									) : null}
									<Button
										type="button"
										variant="ghost"
										size="icon"
										aria-label={`Remove ${getLocaleLabel(locale)}`}
										disabled={locales.length === 1}
										onClick={() => removeLocale(locale)}
										className="text-muted-foreground hover:text-destructive"
									>
										<IconTrash className="size-4" />
									</Button>
								</div>
							</div>
						))}
					</div>
					<p className="text-xs text-muted-foreground">
						Removing a language only hides it from new selections. Existing
						content is not changed or deleted.
					</p>
				</div>

				<div className="flex justify-end border-t pt-5">
					<Button onClick={save} disabled={isPending || locales.length === 0}>
						{isPending ? <IconLoader2 className="size-4 animate-spin" /> : null}
						Save languages
					</Button>
				</div>
			</div>
		</div>
	);
}
