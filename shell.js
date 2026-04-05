const DC_SHELL = (() => {
  const pages = [
    { key: "overview", label: "Project Home", href: "index.html" },
    { key: "about", label: "Story Universe", href: "narrative.html" },
    { key: "cast", label: "Character Dossiers", href: "characters.html" },
    { key: "cases", label: "Crisis Files", href: "cases.html" },
    { key: "music", label: "Music Room", href: "music.html" },
    { key: "archive", label: "Archive", href: "library.html" },
    { key: "world", label: "World Doctrine", href: "world.html" },
    { key: "timeline", label: "Story Timeline", href: "timeline.html" },
    { key: "notes", label: "Notes & Toolkit", href: "notes.html" },
  ];

  const pageByKey = Object.fromEntries(pages.map((page) => [page.key, page]));

  const navGroups = [
    { label: "Orientation", keys: ["overview", "about"] },
    { label: "Browse", keys: ["cast", "cases", "music", "archive"] },
    { label: "Reference", keys: ["world", "timeline", "notes"] },
  ];

  const contextualLinks = {
    overview: ["about", "music", "archive"],
    about: ["cases", "music", "world"],
    cast: ["music", "cases", "archive"],
    cases: ["music", "archive", "world"],
    music: ["about", "cases", "archive"],
    archive: ["music", "cases", "cast"],
    world: ["archive", "timeline", "music"],
    timeline: ["archive", "music", "notes"],
    notes: ["archive", "timeline", "music"],
    reader: ["archive", "cases", "cast"],
  };

  const notes = {
    overview:
      "Start with the story universe, then move into dossiers, crisis files, or the archive depending on what kind of entry point you want.",
    about:
      "This page frames the hidden-world premise, political equilibrium, and thematic questions before you open individual files.",
    cast:
      "Character dossiers should stay readable at a glance while still carrying doctrine, pressure, and role clarity on a slower read.",
    cases:
      "Crisis files are the archive's turning points: catalytic events first, then the chapters and dossiers that gather around them.",
    music:
      "Music works best here as a restrained listening room: one active player, a few shelves, and cues aligned to story pressure or institutional motifs.",
    archive:
      "The archive should reward intentional browsing instead of forcing a reader to decode the entire world at once.",
    world:
      "World doctrine should clarify the setting's rules and power geometry without draining it of tension or mystery.",
    timeline:
      "Timeline pages should clarify progression and escalation, not turn the project into a production spreadsheet.",
    notes:
      "Writer-facing material stays accessible, but it should remain clearly distinct from canon-facing reading paths.",
    reader:
      "Reader mode should feel calm, readable, and tightly connected to related canon files.",
  };

  const body = document.body;
  const currentKey = body.dataset.page || "overview";
  const activeKey = currentKey === "reader" ? "archive" : currentKey;
  const sidebarRoot = document.getElementById("sidebar-shell");
  const mobileRoot = document.getElementById("mobile-shell");

  function renderNavGroups() {
    return navGroups
      .map(
        (group) => `
          <div class="site-nav-group">
            <p class="sidebar-section-label">${group.label}</p>
            <nav class="nav flex-column site-nav">
              ${group.keys
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
                .join("")}
            </nav>
          </div>
        `
      )
      .join("");
  }

  function renderContextLinks() {
    const keys = contextualLinks[currentKey] || contextualLinks.overview;

    return keys
      .map((key) => {
        const page = pageByKey[key];
        if (!page) {
          return "";
        }

        return `
          <a class="sidebar-mini-link" href="${page.href}">
            <span class="sidebar-mini-link__title">${page.label}</span>
            <span class="sidebar-mini-link__copy">Open ${page.label.toLowerCase()}.</span>
          </a>
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
            Magiarchy canon, crisis scaffolds, world doctrine, and writer material arranged as one readable archive.
          </p>
        </div>

        <div class="sidebar-divider"></div>

        <div class="site-nav-shell">
          ${renderNavGroups()}
        </div>

        <div class="sidebar-divider"></div>

        <div class="sidebar-utility">
          <p class="sidebar-section-label">Go Next</p>
          <div class="sidebar-link-list">
            ${renderContextLinks()}
          </div>
        </div>

        <div class="sidebar-note mt-auto">
          ${notes[currentKey] || notes.overview}
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
          <div class="sidebar-divider my-4"></div>
          <div class="sidebar-utility">
            <p class="sidebar-section-label">Go Next</p>
            <div class="sidebar-link-list">
              ${renderContextLinks()}
            </div>
          </div>
          <div class="sidebar-note mt-4">
            ${notes[currentKey] || notes.overview}
          </div>
        </div>
      </div>
    `;
  }

  renderSidebar();
  renderMobile();
})();
