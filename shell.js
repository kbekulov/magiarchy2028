const DC_SHELL = (() => {
  const sections = [
    { key: "story-universe", label: "Story", href: "narrative.html" },
    { key: "magic-system", label: "Magic", href: "magic.html" },
    { key: "locations", label: "Locations", href: "locations.html" },
    { key: "music", label: "Music", href: "music.html" },
    { key: "organizations", label: "Organizations", href: "organizations.html" },
    { key: "characters", label: "Cast", href: "characters.html" },
    { key: "relationships", label: "Relationships", href: "relationships.html" },
    { key: "events-chapters", label: "Case Files", href: "events.html" },
    { key: "story-timeline", label: "Timeline", href: "timeline.html" },
    { key: "global-prompt", label: "Writer's Desk", href: "notes.html" },
  ];

  const utilityPages = [
    { key: "home", label: "Home", href: "index.html" },
    { key: "archive", label: "Archive", href: "library.html" },
    { key: "vn-simulator", label: "VN", href: "vn.html" },
  ];

  const navGroups = [
    {
      label: "Start",
      keys: ["home", "story-universe", "vn-simulator"],
    },
    {
      label: "Story",
      keys: ["archive", "characters", "events-chapters", "story-timeline"],
    },
    {
      label: "World",
      keys: ["magic-system", "locations", "organizations", "relationships"],
    },
    {
      label: "Reference",
      keys: ["music", "global-prompt"],
    },
  ];

  const pageByKey = Object.fromEntries(
    [...sections, ...utilityPages].map((page) => [page.key, page])
  );

  const activeAliases = {
    about: "story-universe",
    cast: "characters",
    cases: "events-chapters",
    notes: "global-prompt",
    reader: "archive",
    timeline: "story-timeline",
    world: "magic-system",
  };

  const notes = {
    home:
      "Start with the chapters or VN mode, then let the archive turn the story's documents into evidence.",
    archive:
      "The archive is the deep-browse layer: canon files, partial dossiers, sealed doctrine, and working notes in one searchable record.",
    "story-universe":
      "This page frames the hidden-world premise, the political equilibrium, and the thematic pressure before you open narrower files.",
    "magic-system":
      "Magic system pages should explain law, cost, secrecy, and precision without draining the setting of atmosphere.",
    locations:
      "Locations matter here as pressure-bearing spaces, not neutral maps. Each one changes visibility, legitimacy, and symbolic weight.",
    music:
      "Music works best as a restrained listening room tied to narrative function and institutional motifs rather than pure decoration.",
    organizations:
      "Organizations define how hidden power survives, mutates, and negotiates with the visible world.",
    characters:
      "Character pages should stay dossier-like: clear enough to browse, sharp enough to carry doctrine, pressure, and role.",
    relationships:
      "Relationships in this project are structural. Trust, mirrors, rivalries, and loyalty fractures all change how power behaves.",
    "events-chapters":
      "Events and chapters are the canon's turning machinery: catalytic incidents first, then the story movement they trigger.",
    "story-timeline":
      "The timeline should clarify escalation and sequence without turning the project into a dry production sheet.",
    "vn-simulator":
      "The VN simulator turns chapter text into a playable reading lane with staged delivery, chapter jump controls, and episode pacing.",
    "global-prompt":
      "The Writer's Desk keeps the canon pack and construction notes close without making scaffolding compete with the front-facing story.",
  };

  const themeOptions = [
    { id: "light-cold", label: "Light / Cold", shortLabel: "Light" },
    { id: "dark-cold", label: "Dark / Cold", shortLabel: "Dark" },
  ].map((theme, index) => ({ ...theme, index }));

  const themeById = Object.fromEntries(themeOptions.map((theme) => [theme.id, theme]));
  const THEME_STORAGE_KEY = "magiarchy-theme";

  const body = document.body;
  const currentKey = body.dataset.page || "home";
  const activeKey = pageByKey[currentKey] ? currentKey : activeAliases[currentKey] || "home";
  const sidebarRoot = document.getElementById("sidebar-shell");
  const mobileRoot = document.getElementById("mobile-shell");
  const currentTheme = applyThemeToDocument(
    document.documentElement.dataset.theme || readStoredTheme()
  );

  function normalizeThemeId(themeId) {
    if (themeId === "light-warm") {
      return "light-cold";
    }

    if (themeId === "dark-warm") {
      return "dark-cold";
    }

    return themeId;
  }

  function readStoredTheme() {
    try {
      const storedTheme = normalizeThemeId(window.localStorage.getItem(THEME_STORAGE_KEY));
      return themeById[storedTheme] ? storedTheme : "light-cold";
    } catch (error) {
      return "light-cold";
    }
  }

  function applyThemeToDocument(themeId) {
    const validTheme = themeById[normalizeThemeId(themeId)]
      ? normalizeThemeId(themeId)
      : "light-cold";
    document.documentElement.dataset.theme = validTheme;
    document.documentElement.dataset.bsTheme = validTheme.startsWith("dark")
      ? "dark"
      : "light";
    return validTheme;
  }

  function renderThemeSwitch({ mobile = false } = {}) {
    const theme = themeById[currentTheme] || themeById["light-cold"];
    const modifierClass = mobile ? " theme-switch--mobile" : " theme-switch--corner";

    const iconByTheme = {
      "light-cold": `
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="4.2"></circle>
          <path d="M12 2.4v3.1M12 18.5v3.1M21.6 12h-3.1M5.5 12H2.4M18.8 5.2l-2.2 2.2M7.4 16.6l-2.2 2.2M18.8 18.8l-2.2-2.2M7.4 7.4 5.2 5.2"></path>
        </svg>
      `,
      "dark-cold": `
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M15.8 3.2a8.8 8.8 0 1 0 5 15.8 9.4 9.4 0 1 1-5-15.8Z"></path>
        </svg>
      `,
    };

    return `
      <div class="theme-switch${modifierClass}">
        <div
          class="theme-slider"
          data-theme-slider
          style="--theme-index: ${theme.index}"
          role="group"
          aria-label="Color scheme"
        >
          ${themeOptions
            .map((option) => {
              const isActive = option.id === theme.id;

              return `
                <button
                  class="theme-slider__option${isActive ? " is-active" : ""}"
                  type="button"
                  data-theme-option="${option.id}"
                  aria-pressed="${isActive ? "true" : "false"}"
                  aria-label="${option.label}"
                  title="${option.label}"
                >
                  <span class="theme-slider__icon">
                    ${iconByTheme[option.id]}
                  </span>
                  <span class="visually-hidden">${option.label}</span>
                </button>
              `;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  function renderNavGroups() {
    return navGroups
      .map((group) => {
        const links = group.keys
          .map((key) => {
            const page = pageByKey[key];
            if (!page) {
              return "";
            }

            const isActive = page.key === activeKey;

            return `
              <a class="nav-link${isActive ? " active" : ""}" ${
                isActive ? 'aria-current="page"' : ""
              } href="${page.href}">
                ${page.label}
              </a>
            `;
          })
          .join("");

        return `
          <div class="site-nav-group">
            <p class="sidebar-section-label">${group.label}</p>
            <nav class="nav flex-column site-nav">
              ${links}
            </nav>
          </div>
        `;
      })
      .join("");
  }

  function renderSidebar() {
    if (!sidebarRoot) {
      return;
    }

    sidebarRoot.innerHTML = `
      <div class="sidebar-panel">
        <div class="sidebar-top">
          <p class="sidebar-kicker mb-2">Magiarchy</p>
          <p class="sidebar-copy mt-2 mb-0">
            Start with the story. Use the archive when the documents begin to look back.
          </p>
        </div>

        <div class="sidebar-divider"></div>

        <div class="site-nav-shell">
          ${renderNavGroups()}
        </div>

        <div class="sidebar-context">
          <p class="sidebar-section-label sidebar-section-label--context">Page Note</p>
          <div class="sidebar-note">
            ${notes[activeKey] || notes.home}
          </div>
        </div>
      </div>
    `;
  }

  function renderMobile() {
    if (!mobileRoot) {
      return;
    }

    mobileRoot.innerHTML = `
      <div class="theme-corner d-none d-lg-block">
        ${renderThemeSwitch()}
      </div>

      <div class="mobile-topbar d-lg-none">
        <button
          class="btn btn-outline-light btn-sm"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#mobileNav"
          aria-controls="mobileNav"
        >
          Menu
        </button>
        <a class="mobile-brand" href="index.html">Magiarchy</a>
        ${renderThemeSwitch({ mobile: true })}
      </div>

      <div class="offcanvas offcanvas-start mobile-drawer d-lg-none" tabindex="-1" id="mobileNav">
        <div class="offcanvas-header border-bottom">
          <div>
            <p class="drawer-kicker mb-0">Magiarchy</p>
          </div>
          <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>
        <div class="offcanvas-body">
          <div class="site-nav-shell">
            ${renderNavGroups()}
          </div>
          <div class="sidebar-context mt-4">
            <p class="sidebar-section-label sidebar-section-label--context">Page Note</p>
            <div class="sidebar-note">
              ${notes[activeKey] || notes.home}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function updateThemeSwitches(themeId) {
    const theme = themeById[themeId] || themeById["light-cold"];

    document.querySelectorAll("[data-theme-slider]").forEach((slider) => {
      slider.style.setProperty("--theme-index", String(theme.index));
    });

    document.querySelectorAll("[data-theme-option]").forEach((button) => {
      const isActive = button.dataset.themeOption === theme.id;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  function applyTheme(themeId, { persist = true } = {}) {
    const validTheme = applyThemeToDocument(themeId);
    updateThemeSwitches(validTheme);

    if (persist) {
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, validTheme);
      } catch (error) {
        // Ignore storage failures and keep the in-memory selection.
      }
    }

    return validTheme;
  }

  function bindThemeControls() {
    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-theme-option]");
      if (!button) {
        return;
      }

      applyTheme(button.dataset.themeOption);
    });

    document.addEventListener("keydown", (event) => {
      const button = event.target.closest("[data-theme-option]");
      if (!button) {
        return;
      }

      let delta = 0;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        delta = 1;
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        delta = -1;
      } else {
        return;
      }

      event.preventDefault();

      const currentOption = themeById[button.dataset.themeOption] || themeOptions[0];
      const nextIndex = Math.max(
        0,
        Math.min(themeOptions.length - 1, currentOption.index + delta)
      );
      const nextTheme = themeOptions[nextIndex];

      applyTheme(nextTheme.id);

      const slider = button.closest("[data-theme-slider]");
      const nextButton = slider?.querySelector(`[data-theme-option="${nextTheme.id}"]`);
      nextButton?.focus();
    });
  }

  renderSidebar();
  renderMobile();
  bindThemeControls();
  applyTheme(currentTheme, { persist: false });
})();
