(() => {
  const THEME_STORAGE_KEY = "magiarchy-theme";
  const validThemes = new Set(["light-cold", "dark-cold"]);
  const root = document.documentElement;
  const fallbackTheme = "light-cold";

  function normalizeTheme(theme) {
    if (theme === "light-warm") {
      return "light-cold";
    }

    if (theme === "dark-warm") {
      return "dark-cold";
    }

    return theme;
  }

  let theme = normalizeTheme(root.dataset.theme);

  try {
    const storedTheme = normalizeTheme(window.localStorage.getItem(THEME_STORAGE_KEY));
    if (validThemes.has(storedTheme)) {
      theme = storedTheme;
      window.localStorage.setItem(THEME_STORAGE_KEY, storedTheme);
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
