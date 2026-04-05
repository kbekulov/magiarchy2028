const caseRoster = document.getElementById("case-roster");
const caseDetail = document.getElementById("case-detail");
const caseRelated = document.getElementById("case-related");

const caseState = {
  cases: [],
  allEntries: [],
  activeId: null,
  cache: new Map(),
};

if (caseRoster && caseDetail && caseRelated) {
  initializeCases();
}

async function initializeCases() {
  const { entries } = await window.DivineChamber.fetchManifest();
  caseState.cases = window.DivineChamber.byChronology(
    entries.filter((entry) => entry.type === "case")
  );
  caseState.allEntries = entries;

  const params = new URLSearchParams(window.location.search);
  const requestedCase = params.get("case");
  const matchedByCase = caseState.cases.find((entry) => entry.case === requestedCase);
  caseState.activeId = matchedByCase?.id || params.get("id") || caseState.cases[0]?.id || null;

  renderCaseRoster();
  await renderCaseDetail();
}

function renderCaseRoster() {
  caseRoster.innerHTML = caseState.cases
    .map((entry) => {
      const isActive = entry.id === caseState.activeId;
      return `
        <button class="selector-card ${isActive ? "is-active" : ""}" type="button" data-id="${entry.id}">
          <div class="selector-card__head selector-card__head--stack">
            <span class="entry-kind">${window.DivineChamber.escapeHtml(entry.fields.case_code || window.DivineChamber.orderLabel(entry))}</span>
            <strong class="selector-card__title">${window.DivineChamber.escapeHtml(entry.title)}</strong>
            <span class="selector-card__meta">${window.DivineChamber.escapeHtml(entry.fields.location || entry.case_name || "")}</span>
          </div>
          <p class="selector-card__copy">${window.DivineChamber.escapeHtml(entry.summary)}</p>
        </button>
      `;
    })
    .join("");

  caseRoster.querySelectorAll("[data-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      caseState.activeId = button.dataset.id;
      renderCaseRoster();
      await renderCaseDetail();
    });
  });
}

async function renderCaseDetail() {
  const entry = caseState.cases.find((item) => item.id === caseState.activeId);
  if (!entry) {
    caseDetail.innerHTML = `<p class="page-copy mb-0">No case file available.</p>`;
    caseRelated.innerHTML = "";
    return;
  }

  const markdown = await getCaseMarkdown(entry);
  const fields = entry.fields || {};
  const related = caseState.allEntries.filter(
    (item) => item.id !== entry.id && item.case && item.case === entry.case
  );

  caseDetail.innerHTML = `
    <div class="detail-panel__hero detail-panel__hero--stack">
      <div class="chip-row mb-3">${window.DivineChamber.renderBadges(entry)}</div>
      <h2 class="detail-title">${window.DivineChamber.escapeHtml(entry.title)}</h2>
      <p class="detail-subtitle">${window.DivineChamber.escapeHtml(fields.case_code || "")}</p>
      <p class="page-copy mb-0">${window.DivineChamber.escapeHtml(entry.summary)}</p>
    </div>
    <div class="record-grid mt-4">
      ${renderRecordItem("Priority", fields.priority)}
      ${renderRecordItem("Location", fields.location)}
      ${renderRecordItem("Case Cluster", entry.case_name)}
      ${renderRecordItem("Status", window.DivineChamber.formatStatus(entry.status))}
    </div>
    <div class="markdown-body mt-4">${window.DivineChamber.renderMarkdown(markdown)}</div>
  `;

  caseRelated.innerHTML = related.length
    ? related
        .map((item) =>
          window.DivineChamber.renderEntryCard(item, {
            buttonLabel: "Open File",
          })
        )
        .join("")
    : `<div class="empty-card">No related files have been connected to this case yet.</div>`;
}

async function getCaseMarkdown(entry) {
  if (!caseState.cache.has(entry.path)) {
    const response = await fetch(entry.path);
    if (!response.ok) {
      throw new Error(`Content request failed with ${response.status}`);
    }
    caseState.cache.set(entry.path, await response.text());
  }

  return caseState.cache.get(entry.path);
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
