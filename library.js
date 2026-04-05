const facetFilters = document.getElementById("archive-facet-filters");
const typeSelect = document.getElementById("archive-type");
const statusSelect = document.getElementById("archive-status");
const characterSelect = document.getElementById("archive-character");
const caseSelect = document.getElementById("archive-case");
const searchInput = document.getElementById("archive-search");
const resetButton = document.getElementById("archive-reset");
const quickLinks = document.getElementById("archive-quick-links");
const archiveActive = document.getElementById("archive-active");
const archiveCount = document.getElementById("archive-count");
const archiveList = document.getElementById("library-list");

const archiveState = {
  entries: [],
  facet: "all",
  type: "all",
  status: "all",
  character: "all",
  case: "all",
  search: "",
};

if (
  facetFilters &&
  typeSelect &&
  statusSelect &&
  characterSelect &&
  caseSelect &&
  searchInput &&
  resetButton &&
  quickLinks &&
  archiveActive &&
  archiveCount &&
  archiveList
) {
  initializeArchive();
}

async function initializeArchive() {
  const manifest = await window.DivineChamber.fetchManifest();
  archiveState.entries = manifest.entries;

  const params = new URLSearchParams(window.location.search);
  archiveState.facet = params.get("facet") || "all";
  archiveState.type = params.get("type") || "all";
  archiveState.status = params.get("status") || "all";
  archiveState.character = params.get("character") || "all";
  archiveState.case = params.get("case") || "all";
  archiveState.search = params.get("search") || "";

  populateFacetFilters(manifest.collections.facets);
  populateSelect(
    typeSelect,
    "All Types",
    manifest.collections.types,
    window.DivineChamber.formatType,
    archiveState.type
  );
  populateSelect(
    statusSelect,
    "All Statuses",
    manifest.collections.statuses,
    window.DivineChamber.formatStatus,
    archiveState.status
  );
  populateSelect(
    characterSelect,
    "All Characters",
    manifest.collections.characters,
    (value) => value,
    archiveState.character
  );
  populateSelect(
    caseSelect,
    "All Cases",
    manifest.collections.cases,
    (value) =>
      archiveState.entries.find((entry) => entry.case === value)?.case_name ||
      window.DivineChamber.sentenceCase(value),
    archiveState.case
  );

  searchInput.value = archiveState.search;
  renderQuickLinks();
  wireArchiveControls();
  renderArchive();
}

function renderQuickLinks() {
  const views = [
    {
      title: "Scene files",
      copy: "Jump into the chamber-facing story material first.",
      params: { type: "scene" },
    },
    {
      title: "Case dossiers",
      copy: "Move through the bureau-facing incident structure.",
      params: { type: "case" },
    },
    {
      title: "Character records",
      copy: "Browse the chamber cast as dossiers and profiles.",
      params: { type: "dossier" },
    },
    {
      title: "World reference",
      copy: "Read city, Crown, and symbolic-system files together.",
      params: { facet: "world" },
    },
    {
      title: "Development notes",
      copy: "Separate draft thinking from canon-facing material.",
      params: { facet: "meta" },
    },
  ];

  quickLinks.innerHTML = views
    .map(
      (view) => `
        <a class="route-link" href="${buildArchiveUrl(view.params)}">
          <strong class="route-link__title">${window.DivineChamber.escapeHtml(view.title)}</strong>
          <span class="route-link__copy">${window.DivineChamber.escapeHtml(view.copy)}</span>
        </a>
      `
    )
    .join("");
}

function populateFacetFilters(facets) {
  facetFilters.innerHTML = ["all", ...facets]
    .map((facet) => {
      const isActive = archiveState.facet === facet;
      const label = facet === "all" ? "All Facets" : window.DivineChamber.formatFacet(facet);
      return `
        <button class="btn ${isActive ? "btn-brass" : "btn-outline-light"} filter-chip" type="button" data-facet="${facet}">
          ${label}
        </button>
      `;
    })
    .join("");
}

function populateSelect(select, allLabel, values, formatter, currentValue) {
  select.innerHTML = [`<option value="all">${allLabel}</option>`]
    .concat(
      values.map(
        (value) =>
          `<option value="${window.DivineChamber.escapeHtml(value)}" ${
            value === currentValue ? "selected" : ""
          }>${window.DivineChamber.escapeHtml(formatter(value))}</option>`
      )
    )
    .join("");
}

function wireArchiveControls() {
  facetFilters.querySelectorAll("[data-facet]").forEach((button) => {
    button.addEventListener("click", () => {
      archiveState.facet = button.dataset.facet;
      populateFacetFilters([...new Set(archiveState.entries.map((entry) => entry.facet))]);
      renderArchive();
    });
  });

  typeSelect.addEventListener("change", () => {
    archiveState.type = typeSelect.value;
    renderArchive();
  });

  statusSelect.addEventListener("change", () => {
    archiveState.status = statusSelect.value;
    renderArchive();
  });

  characterSelect.addEventListener("change", () => {
    archiveState.character = characterSelect.value;
    renderArchive();
  });

  caseSelect.addEventListener("change", () => {
    archiveState.case = caseSelect.value;
    renderArchive();
  });

  searchInput.addEventListener("input", () => {
    archiveState.search = searchInput.value.trim();
    renderArchive();
  });

  resetButton.addEventListener("click", () => {
    archiveState.facet = "all";
    archiveState.type = "all";
    archiveState.status = "all";
    archiveState.character = "all";
    archiveState.case = "all";
    archiveState.search = "";

    typeSelect.value = "all";
    statusSelect.value = "all";
    characterSelect.value = "all";
    caseSelect.value = "all";
    searchInput.value = "";

    populateFacetFilters([...new Set(archiveState.entries.map((entry) => entry.facet))]);
    renderArchive();
  });
}

function getFilteredEntries() {
  return archiveState.entries.filter((entry) => {
    if (archiveState.facet !== "all" && entry.facet !== archiveState.facet) {
      return false;
    }
    if (archiveState.type !== "all" && entry.type !== archiveState.type) {
      return false;
    }
    if (archiveState.status !== "all" && entry.status !== archiveState.status) {
      return false;
    }
    if (
      archiveState.character !== "all" &&
      !(entry.characters || []).includes(archiveState.character)
    ) {
      return false;
    }
    if (archiveState.case !== "all" && entry.case !== archiveState.case) {
      return false;
    }
    if (archiveState.search && !matchesSearch(entry, archiveState.search)) {
      return false;
    }

    return true;
  });
}

function matchesSearch(entry, search) {
  const haystack = [
    entry.title,
    entry.summary,
    entry.case_name,
    entry.type,
    entry.facet,
    entry.status,
    ...(entry.characters || []),
    ...(entry.tags || []),
    ...Object.values(entry.fields || {}),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(search.toLowerCase());
}

function renderActiveFilters() {
  const chips = [];

  if (archiveState.search) {
    chips.push(renderActiveChip(`Search: ${archiveState.search}`));
  }
  if (archiveState.facet !== "all") {
    chips.push(renderActiveChip(window.DivineChamber.formatFacet(archiveState.facet)));
  }
  if (archiveState.type !== "all") {
    chips.push(renderActiveChip(window.DivineChamber.formatType(archiveState.type)));
  }
  if (archiveState.status !== "all") {
    chips.push(renderActiveChip(window.DivineChamber.formatStatus(archiveState.status)));
  }
  if (archiveState.character !== "all") {
    chips.push(renderActiveChip(archiveState.character));
  }
  if (archiveState.case !== "all") {
    chips.push(
      renderActiveChip(
        archiveState.entries.find((entry) => entry.case === archiveState.case)?.case_name ||
          archiveState.case
      )
    );
  }

  archiveActive.innerHTML = chips.length
    ? chips.join("")
    : `<span class="active-filter-chip">Showing all files</span>`;
}

function renderActiveChip(label) {
  return `<span class="active-filter-chip">${window.DivineChamber.escapeHtml(label)}</span>`;
}

function syncArchiveUrl() {
  const params = new URLSearchParams();

  if (archiveState.facet !== "all") {
    params.set("facet", archiveState.facet);
  }
  if (archiveState.type !== "all") {
    params.set("type", archiveState.type);
  }
  if (archiveState.status !== "all") {
    params.set("status", archiveState.status);
  }
  if (archiveState.character !== "all") {
    params.set("character", archiveState.character);
  }
  if (archiveState.case !== "all") {
    params.set("case", archiveState.case);
  }
  if (archiveState.search) {
    params.set("search", archiveState.search);
  }

  const query = params.toString();
  const nextUrl = query ? `library.html?${query}` : "library.html";
  window.history.replaceState({}, "", nextUrl);
}

function buildArchiveUrl(params = {}) {
  const nextParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value && value !== "all") {
      nextParams.set(key, value);
    }
  });

  const query = nextParams.toString();
  return query ? `library.html?${query}` : "library.html";
}

function renderArchive() {
  const filtered = window.DivineChamber.byChronology(getFilteredEntries());

  renderActiveFilters();
  syncArchiveUrl();

  archiveCount.innerHTML = `
    <span class="archive-result-line__count">${filtered.length}</span>
    <span class="archive-result-line__label">${
      filtered.length === 1 ? "matching file in the archive" : "matching files in the archive"
    }</span>
  `;

  archiveList.innerHTML = filtered.length
    ? filtered
        .map((entry) =>
          window.DivineChamber.renderEntryCard(entry, {
            buttonLabel: "Read file",
          })
        )
        .join("")
    : `<div class="empty-card">No archive files match the current filters. Clear the filters or widen the search terms.</div>`;
}
