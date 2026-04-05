const readerTitle = document.getElementById("reader-title");
const readerKind = document.getElementById("reader-kind");
const readerSummary = document.getElementById("reader-summary");
const readerMeta = document.getElementById("reader-meta");
const readerRecord = document.getElementById("reader-record");
const readerBody = document.getElementById("reader-body");
const readerContext = document.getElementById("reader-context");
const relatedList = document.getElementById("related-list");
const readerNav = document.getElementById("reader-nav");
const readerSourceLink = document.getElementById("reader-source-link");
const readerCard = document.getElementById("reader-card");
const readerLayout = document.getElementById("reader-layout");

if (
  readerTitle &&
  readerKind &&
  readerSummary &&
  readerMeta &&
  readerRecord &&
  readerBody &&
  readerContext &&
  relatedList &&
  readerNav &&
  readerSourceLink &&
  readerCard &&
  readerLayout
) {
  initializeReader();
}

async function initializeReader() {
  const params = new URLSearchParams(window.location.search);
  const entryId = params.get("id");

  if (!entryId) {
    renderMissing("No archive file id was provided in the URL.");
    return;
  }

  try {
    const { entries } = await window.DivineChamber.fetchManifest();
    const entry = entries.find((item) => item.id === entryId);

    if (!entry) {
      renderMissing("This archive file could not be found in the manifest.");
      return;
    }

    const response = await fetch(entry.path);
    if (!response.ok) {
      throw new Error(`Content request failed with ${response.status}`);
    }

    const markdown = await response.text();
    const related = window.DivineChamber.getRelatedEntries(entries, entry, 4);
    const prevNext = window.DivineChamber.findPrevNext(entries, entry);
    const fields = entry.fields || {};

    document.title = `${entry.title} | Divine Chamber`;
    readerKind.textContent = window.DivineChamber.formatType(entry.type);
    readerTitle.textContent = entry.title;
    readerSummary.textContent = entry.summary || "No summary provided yet.";
    readerSourceLink.href = entry.path;
    readerCard.className = `reader-card reader-card--${entry.template} reader-card--${entry.facet}`;
    readerLayout.dataset.template = entry.template;
    readerMeta.innerHTML = window.DivineChamber.renderBadges(entry);
    readerRecord.innerHTML = [
      recordItem("Facet", window.DivineChamber.formatFacet(entry.facet)),
      recordItem("Status", window.DivineChamber.formatStatus(entry.status)),
      recordItem("Canon", window.DivineChamber.sentenceCase(entry.canon)),
      recordItem("Chronology", window.DivineChamber.orderLabel(entry)),
      recordItem("Case", entry.case_name),
      recordItem("Role", fields.role),
      recordItem("Affiliation", fields.affiliation),
      recordItem("Archetype", fields.archetype),
      recordItem("Priority", fields.priority),
      recordItem("Location", fields.location),
    ]
      .filter(Boolean)
      .join("");

    readerBody.innerHTML = window.DivineChamber.renderMarkdown(markdown);
    readerContext.innerHTML = `
      ${entry.characters?.length ? blockRow("Characters", entry.characters) : ""}
      ${entry.tags?.length ? blockRow("Tags", entry.tags) : ""}
      ${
        entry.case_name
          ? `<div class="context-block">
              <span class="context-block__label">Case Cluster</span>
              <a class="context-link" href="cases.html?case=${encodeURIComponent(entry.case)}">${window.DivineChamber.escapeHtml(
                entry.case_name
              )}</a>
            </div>`
          : ""
      }
      <div class="context-block">
        <span class="context-block__label">Type</span>
        <span class="page-copy mb-0">${window.DivineChamber.formatType(entry.type)}</span>
      </div>
    `;

    relatedList.innerHTML = related.length
      ? related
          .map((item) =>
            window.DivineChamber.renderEntryCard(item, {
              buttonLabel: "Open File",
              showStatus: false,
            })
          )
          .join("")
      : `<div class="empty-card">No related files have been identified yet.</div>`;

    readerNav.innerHTML = `
      ${navLink(prevNext.previous, "Previous")}
      ${navLink(prevNext.next, "Next")}
    `;
  } catch (error) {
    renderMissing(error.message);
  }
}

function renderMissing(message) {
  readerKind.textContent = "Reader";
  readerTitle.textContent = "Archive file unavailable";
  readerSummary.textContent = message;
  readerMeta.innerHTML = "";
  readerRecord.innerHTML = "";
  readerBody.innerHTML = `<p class="page-copy mb-0">${window.DivineChamber.escapeHtml(message)}</p>`;
  readerContext.innerHTML = `<p class="page-copy mb-0">Return to the archive and choose another file.</p>`;
  relatedList.innerHTML = `<div class="empty-card">No related files available.</div>`;
  readerNav.innerHTML = "";
  readerSourceLink.classList.add("disabled");
  readerSourceLink.removeAttribute("href");
}

function recordItem(label, value) {
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

function blockRow(label, values) {
  return `
    <div class="context-block">
      <span class="context-block__label">${window.DivineChamber.escapeHtml(label)}</span>
      <div class="chip-row chip-row--quiet">
        ${values
          .map((value) => `<span class="soft-chip">${window.DivineChamber.escapeHtml(value)}</span>`)
          .join("")}
      </div>
    </div>
  `;
}

function navLink(entry, label) {
  if (!entry) {
    return `<span class="nav-pill nav-pill--empty">${label}: none</span>`;
  }

  return `
    <a class="nav-pill" href="${window.DivineChamber.entryUrl(entry)}">
      <span class="nav-pill__label">${label}</span>
      <strong>${window.DivineChamber.escapeHtml(entry.title)}</strong>
    </a>
  `;
}
