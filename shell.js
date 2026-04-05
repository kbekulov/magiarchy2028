const DC_SHELL = (() => {
  const sections = [
    { key: "story-universe", label: "Story Universe", href: "narrative.html" },
    { key: "magic-system", label: "Magic System", href: "magic.html" },
    { key: "locations", label: "Locations", href: "locations.html" },
    { key: "music", label: "Music", href: "music.html" },
    { key: "organizations", label: "Organizations", href: "organizations.html" },
    { key: "characters", label: "Characters", href: "characters.html" },
    { key: "relationships", label: "Relationships", href: "relationships.html" },
    { key: "events-chapters", label: "Events & Chapters", href: "events.html" },
    { key: "story-timeline", label: "Story Timeline", href: "timeline.html" },
    { key: "global-prompt", label: "Global Prompt", href: "notes.html" },
  ];

  const pageByKey = Object.fromEntries(sections.map((section) => [section.key, section]));
  const activeAliases = {
    about: "story-universe",
    cast: "characters",
    cases: "events-chapters",
    music: "music",
    notes: "global-prompt",
    timeline: "story-timeline",
    world: "magic-system",
  };

  const body = document.body;
  const currentKey = body.dataset.page || "home";
  const activeKey = pageByKey[currentKey] ? currentKey : activeAliases[currentKey] || null;
  const activeSection = activeKey ? pageByKey[activeKey] : null;
  const shellRoot = document.getElementById("mobile-shell");
  const sidebarRoot = document.getElementById("sidebar-shell");

  function renderDesktopNav() {
    return sections
      .map((section, index) => {
        const isActive = section.key === activeKey;

        return `
          <a
            class="section-nav__link${isActive ? " is-active" : ""}"
            ${isActive ? 'aria-current="page"' : ""}
            href="${section.href}"
          >
            ${section.label}
          </a>
          ${
            index < sections.length - 1
              ? '<span class="section-nav__divider" aria-hidden="true">|</span>'
              : ""
          }
        `;
      })
      .join("");
  }

  function renderDrawerLinks() {
    return sections
      .map((section) => {
        const isActive = section.key === activeKey;

        return `
          <a
            class="section-drawer__link${isActive ? " is-active" : ""}"
            ${isActive ? 'aria-current="page"' : ""}
            href="${section.href}"
          >
            <span class="section-drawer__title">${section.label}</span>
          </a>
        `;
      })
      .join("");
  }

  function renderShell() {
    if (!shellRoot) {
      return;
    }

    shellRoot.innerHTML = `
      <header class="section-shell">
        <div class="section-shell__inner">
          <a class="shell-home" href="index.html">
            <span class="shell-home__title">Magiarchy</span>
            <span class="shell-home__copy">Archive Home</span>
          </a>

          <nav class="section-nav d-none d-lg-flex" aria-label="Primary">
            ${renderDesktopNav()}
          </nav>

          <div class="section-shell__mobile d-lg-none">
            <span class="section-shell__current">${activeSection?.label || "Archive Home"}</span>
            <button
              class="btn btn-outline-light btn-sm"
              type="button"
              data-bs-toggle="offcanvas"
              data-bs-target="#sectionDrawer"
              aria-controls="sectionDrawer"
            >
              Sections
            </button>
          </div>
        </div>
      </header>

      <div class="offcanvas offcanvas-start section-drawer d-lg-none" tabindex="-1" id="sectionDrawer">
        <div class="offcanvas-header border-bottom">
          <div>
            <p class="drawer-kicker mb-1">Navigation</p>
            <p class="page-copy mb-0">Move through the project by story-facing section.</p>
          </div>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>
        <div class="offcanvas-body">
          <div class="section-drawer__links">
            ${renderDrawerLinks()}
          </div>
          <div class="section-drawer__utilities mt-4">
            <a class="btn btn-outline-light w-100" href="index.html">Back to Home</a>
            <a class="btn btn-brass w-100 mt-3" href="library.html">Open Archive</a>
          </div>
        </div>
      </div>
    `;
  }

  if (sidebarRoot) {
    sidebarRoot.innerHTML = "";
  }

  renderShell();
})();
