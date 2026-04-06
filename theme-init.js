(() => {
  const THEME_STORAGE_KEY = "magiarchy-theme";
  const validThemes = new Set([
    "light-warm",
    "light-cold",
    "dark-warm",
    "dark-cold",
  ]);
  const root = document.documentElement;
  const fallbackTheme = "light-cold";

  let theme = root.dataset.theme;

  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (validThemes.has(storedTheme)) {
      theme = storedTheme;
    }
  } catch (error) {
    // Ignore storage failures and keep the fallback.
  }

  if (!validThemes.has(theme)) {
    theme = fallbackTheme;
  }

  root.dataset.theme = theme;
  root.dataset.bsTheme = theme.startsWith("dark") ? "dark" : "light";
})();
