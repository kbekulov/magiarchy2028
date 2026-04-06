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

  const utilityPages = [
    { key: "home", label: "Project Home", href: "index.html" },
    { key: "archive", label: "Archive Browser", href: "library.html" },
  ];

  const navGroups = [
    {
      label: "Start Here",
      keys: ["home", "global-prompt", "story-universe"],
    },
    {
      label: "World",
      keys: ["magic-system", "locations", "organizations"],
    },
    {
      label: "Story",
      keys: ["characters", "relationships", "events-chapters", "story-timeline"],
    },
    {
      label: "Reference",
      keys: ["music", "archive"],
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
      "Start from the global prompt or story universe, then move outward into world files, character dossiers, and chapter machinery.",
    archive:
      "The archive stays as the deep-browse layer, while the main sidebar works as the cleaner front-facing table of contents.",
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
    "global-prompt":
      "The global prompt shelf keeps the active canon pack close to the supporting writer-facing references that feed it.",
  };

  const body = document.body;
  const currentKey = body.dataset.page || "home";
  const activeKey = pageByKey[currentKey] ? currentKey : activeAliases[currentKey] || "home";
  const sidebarRoot = document.getElementById("sidebar-shell");
  const mobileRoot = document.getElementById("mobile-shell");

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
          <p class="sidebar-kicker mb-2">Hidden World Archive</p>
          <p class="sidebar-copy mt-2 mb-0">
            A quieter map through Magiarchy canon, doctrine, characters, and story structure.
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
      </div>

      <div class="offcanvas offcanvas-start mobile-drawer d-lg-none" tabindex="-1" id="mobileNav">
        <div class="offcanvas-header border-bottom">
          <div>
            <p class="drawer-kicker mb-0">Hidden World Archive</p>
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

  renderSidebar();
  renderMobile();
})();
