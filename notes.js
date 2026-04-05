const notesFeatured = document.getElementById("notes-featured");
const notesList = document.getElementById("notes-list");

if (notesFeatured && notesList) {
  initializeNotes();
}

async function initializeNotes() {
  const { entries } = await window.DivineChamber.fetchManifest();
  const notes = window.DivineChamber.byChronology(entries.filter((entry) => entry.type === "note"));
  const featured = notes.find((entry) => entry.featured) || notes[0];

  if (featured) {
    const response = await fetch(featured.path);
    const markdown = response.ok ? await response.text() : "";
    notesFeatured.innerHTML = `
      <div class="detail-panel__hero detail-panel__hero--stack">
        <div class="chip-row mb-3">${window.DivineChamber.renderBadges(featured)}</div>
        <h2 class="detail-title">${window.DivineChamber.escapeHtml(featured.title)}</h2>
        <p class="page-copy mb-0">${window.DivineChamber.escapeHtml(featured.summary)}</p>
      </div>
      <div class="markdown-body mt-4">${window.DivineChamber.renderMarkdown(markdown)}</div>
    `;
  }

  notesList.innerHTML = notes
    .filter((entry) => entry.id !== featured?.id)
    .map((entry) =>
      window.DivineChamber.renderEntryCard(entry, {
        buttonLabel: "Read Note",
      })
    )
    .join("");
}
