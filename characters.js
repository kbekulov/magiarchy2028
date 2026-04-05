const castRoster = document.getElementById("cast-roster");
const castDetail = document.getElementById("cast-detail");
const castRelated = document.getElementById("cast-related");
const castFilters = document.getElementById("cast-filters");

const castState = {
  entries: [],
  allEntries: [],
  activeId: null,
  facet: "all",
  cache: new Map(),
};

if (castRoster && castDetail && castRelated && castFilters) {
  initializeCast();
}

async function initializeCast() {
  const { entries } = await window.DivineChamber.fetchManifest();
  const dossiers = window.DivineChamber.byChronology(
    entries.filter((entry) => entry.type === "dossier")
  );

  castState.entries = dossiers;
  castState.allEntries = entries;

  const params = new URLSearchParams(window.location.search);
  castState.facet = params.get("facet") || "all";
  castState.activeId = params.get("id") || getVisibleDossiers()[0]?.id || null;

  renderCastFilters();
  renderCastRoster();
  await renderCastDetail();
}

function getVisibleDossiers() {
  if (castState.facet === "all") {
    return castState.entries;
  }

  return castState.entries.filter((entry) => entry.facet === castState.facet);
}

function renderCastFilters() {
  const facets = ["all", ...new Set(castState.entries.map((entry) => entry.facet))];

  castFilters.innerHTML = facets
    .map((facet) => {
      const isActive = facet === castState.facet;
      const label = facet === "all" ? "All Presences" : window.DivineChamber.formatFacet(facet);
      return `
        <button class="btn ${isActive ? "btn-brass" : "btn-outline-light"} filter-chip" type="button" data-facet="${facet}">
          ${label}
        </button>
      `;
    })
    .join("");

  castFilters.querySelectorAll("[data-facet]").forEach((button) => {
    button.addEventListener("click", async () => {
      castState.facet = button.dataset.facet;
      const visible = getVisibleDossiers();
      if (!visible.some((entry) => entry.id === castState.activeId)) {
        castState.activeId = visible[0]?.id || null;
      }
      renderCastFilters();
      renderCastRoster();
      await renderCastDetail();
    });
  });
}

function renderCastRoster() {
  const visible = getVisibleDossiers();

  castRoster.innerHTML = visible
    .map((entry) => {
      const fields = entry.fields || {};
      const isActive = entry.id === castState.activeId;
      return `
        <button class="selector-card ${isActive ? "is-active" : ""}" type="button" data-id="${entry.id}">
          <div class="selector-card__head">
            <span class="sigil">${window.DivineChamber.escapeHtml(fields.sigil || "DC")}</span>
            <div>
              <strong class="selector-card__title">${window.DivineChamber.escapeHtml(entry.title.replace(/^Dossier - /, ""))}</strong>
              <span class="selector-card__meta">${window.DivineChamber.escapeHtml(fields.role || window.DivineChamber.formatType(entry.type))}</span>
            </div>
          </div>
          <p class="selector-card__copy">${window.DivineChamber.escapeHtml(entry.summary)}</p>
        </button>
      `;
    })
    .join("");

  castRoster.querySelectorAll("[data-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      castState.activeId = button.dataset.id;
      renderCastRoster();
      await renderCastDetail();
    });
  });
}

async function renderCastDetail() {
  const entry = castState.entries.find((item) => item.id === castState.activeId);
  if (!entry) {
    castDetail.innerHTML = `<p class="page-copy mb-0">No dossier available for this filter.</p>`;
    castRelated.innerHTML = "";
    return;
  }

  const markdown = await getMarkdown(entry);
  const fields = entry.fields || {};

  castDetail.innerHTML = `
    <div class="detail-panel__hero">
      <div class="portrait-sigil">${window.DivineChamber.escapeHtml(fields.sigil || "DC")}</div>
      <div>
        <div class="chip-row mb-3">${window.DivineChamber.renderBadges(entry)}</div>
        <h2 class="detail-title">${window.DivineChamber.escapeHtml(entry.title.replace(/^Dossier - /, ""))}</h2>
        <p class="detail-subtitle">${window.DivineChamber.escapeHtml(fields.role || "")}</p>
        <p class="page-copy mb-0">${window.DivineChamber.escapeHtml(entry.summary)}</p>
      </div>
    </div>
    <div class="record-grid mt-4">
      ${renderRecordItem("Affiliation", fields.affiliation)}
      ${renderRecordItem("Archetype", fields.archetype)}
      ${renderRecordItem("Facet", window.DivineChamber.formatFacet(entry.facet))}
      ${renderRecordItem("Canon", window.DivineChamber.sentenceCase(entry.canon))}
    </div>
    <div class="markdown-body mt-4">${window.DivineChamber.renderMarkdown(markdown)}</div>
  `;

  const related = window.DivineChamber
    .getRelatedEntries(
      castState.allEntries.filter((item) => item.type !== "dossier"),
      entry,
      4
    )
    .slice(0, 4);

  castRelated.innerHTML = related.length
    ? related
        .map((item) =>
          window.DivineChamber.renderEntryCard(item, {
            buttonLabel: "Open File",
          })
        )
        .join("")
    : `<div class="empty-card">No linked files yet for this presence.</div>`;
}

async function getMarkdown(entry) {
  if (!castState.cache.has(entry.path)) {
    const response = await fetch(entry.path);
    if (!response.ok) {
      throw new Error(`Content request failed with ${response.status}`);
    }
    castState.cache.set(entry.path, await response.text());
  }

  return castState.cache.get(entry.path);
}

function renderRecordItem(label, value) {
  if (!value) {
    return "";
  }

  return `
    <div class="record-item">
      <span class="record-item__label">${window.DivineChamber.escapeHtml(label)}</span>
      <span class="record-item__value">${window.DivineChamber.escapeHtml(value)}</span>
    </div>
  `;
}
