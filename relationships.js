const relationshipGrid = document.getElementById("relationship-grid");

if (relationshipGrid) {
  initializeRelationships();
}

const RELATIONSHIP_TRACKS = [
  {
    title: "Lynleit & Kyrien",
    summary:
      "Visible authority and shadow contingency hold the story's central trust structure together. Their relationship is less romance-first than governance, protection, and ethical opacity under stress.",
    characters: ["Lynleit", "Kyrien"],
  },
  {
    title: "Lynleit & Helena",
    summary:
      "This is the legitimacy war at the story's center: public continuity versus accusation architecture, inheritance pressure converted into system capture.",
    characters: ["Lynleit", "Helena"],
  },
  {
    title: "Kyrien & Tien",
    summary:
      "Kyrien and Tien mirror each other through method, secrecy, and precision, but split on doctrine. One protects survivability; the other enforces pressure.",
    characters: ["Kyrien", "Tien"],
  },
  {
    title: "Felix & Reiner",
    summary:
      "Felix and Reiner hold the contested-loyalty lane inside MSF, showing how alignment shifts once institutional continuity starts mutating under threat.",
    characters: ["Felix", "Reiner"],
  },
  {
    title: "Sherie, Drake & Heyk",
    summary:
      "The Spill opens a peripheral pressure lane where extraction, interpretation, and Duchy-side leverage become part of the wider canon rather than side material.",
    characters: ["Sherie", "Drake", "Heyk"],
  },
];

async function initializeRelationships() {
  const { entries } = await window.DivineChamber.fetchManifest();
  const dossiers = entries.filter((entry) => entry.type === "dossier");

  relationshipGrid.innerHTML = RELATIONSHIP_TRACKS.map((track) => {
    const sharedEntries = window.DivineChamber
      .byChronology(
        entries.filter(
          (entry) =>
            entry.type !== "dossier" &&
            track.characters.every((character) => (entry.characters || []).includes(character))
        )
      )
      .slice(0, 4);

    const directDossiers = track.characters
      .map((character) => dossiers.find((entry) => entry.title === `Dossier - ${character}`))
      .filter(Boolean);

    return `
      <article class="paper-panel">
        <p class="card-kicker">Relationship Thread</p>
        <h2 class="subsection-title">${window.DivineChamber.escapeHtml(track.title)}</h2>
        <p class="page-copy mt-3 mb-0">${window.DivineChamber.escapeHtml(track.summary)}</p>

        <div class="chip-row mt-3">
          ${track.characters
            .map(
              (character) =>
                `<span class="soft-chip">${window.DivineChamber.escapeHtml(character)}</span>`
            )
            .join("")}
        </div>

        <div class="row g-4 mt-1">
          <div class="col-xl-5">
            <div class="section-subheader mb-3">
              <h3 class="subsection-title">Core Dossiers</h3>
            </div>
            <div class="route-list route-list--compact">
              ${directDossiers.map(renderCompactLink).join("")}
            </div>
          </div>
          <div class="col-xl-7">
            <div class="section-subheader mb-3">
              <h3 class="subsection-title">Shared Story Material</h3>
            </div>
            <div class="stack-list">
              ${
                sharedEntries.length
                  ? sharedEntries.map(renderSharedEntry).join("")
                  : `<div class="empty-card">This thread is still mostly carried by dossiers and future scene work.</div>`
              }
            </div>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function renderCompactLink(entry) {
  return `
    <a class="route-link" href="${window.DivineChamber.entryUrl(entry)}">
      <strong class="route-link__title">${window.DivineChamber.escapeHtml(entry.title)}</strong>
      <span class="route-link__copy">${window.DivineChamber.escapeHtml(entry.summary)}</span>
    </a>
  `;
}

function renderSharedEntry(entry) {
  return `
    <a class="stack-link" href="${window.DivineChamber.entryUrl(entry)}">
      <span class="stack-link__meta">
        ${window.DivineChamber.formatType(entry.type)}
        <span class="divider-dot"></span>
        ${window.DivineChamber.orderLabel(entry)}
      </span>
      <strong class="stack-link__title">${window.DivineChamber.escapeHtml(entry.title)}</strong>
      <span class="stack-link__copy">${window.DivineChamber.escapeHtml(entry.summary)}</span>
    </a>
  `;
}
