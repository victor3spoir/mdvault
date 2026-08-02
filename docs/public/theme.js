/**
 * Theme switching for the documentation site.
 *
 * Loaded synchronously from <head> so the stored choice is applied before the
 * first paint. Without that, the page would flash the operating system's theme
 * before switching to the chosen one.
 */
(function () {
	var STORAGE_KEY = "mdvault-theme";
	var THEMES = ["light", "dark", "auto"];
	var root = document.documentElement;

	function readStoredTheme() {
		try {
			var stored = localStorage.getItem(STORAGE_KEY);
			return THEMES.indexOf(stored) === -1 ? "auto" : stored;
		} catch (error) {
			// Private browsing or blocked storage: fall back to following the OS.
			return "auto";
		}
	}

	function applyTheme(theme) {
		root.dataset.theme = theme;

		try {
			localStorage.setItem(STORAGE_KEY, theme);
		} catch (error) {
			/* Not being able to persist the choice must not break the toggle. */
		}
	}

	applyTheme(readStoredTheme());

	function describe(theme) {
		if (theme === "auto") {
			return "Theme: automatic";
		}
		return theme === "dark" ? "Theme: dark" : "Theme: light";
	}

	function ready() {
		var button = document.querySelector("[data-theme-toggle]");
		if (!button) {
			return;
		}

		function sync() {
			var label = describe(root.dataset.theme);
			button.setAttribute("aria-label", label + ". Click to change.");
			button.setAttribute("title", label + ". Click to change.");
		}

		button.hidden = false;
		sync();

		button.addEventListener("click", function () {
			var next = THEMES[(THEMES.indexOf(root.dataset.theme) + 1) % THEMES.length];
			applyTheme(next);
			sync();
		});
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", ready);
	} else {
		ready();
	}
})();
