const relationshipRoster = document.getElementById("relationship-roster");
const relationshipDetail = document.getElementById("relationship-detail");
const relationshipRelated = document.getElementById("relationship-related");

const RELATIONSHIP_TRACKS = [
  {
    id: "lynleit-kyrien",
    title: "Lynleit & Kyrien",
    sigil: "LK",
    typeLabel: "Anchor Thread",
    statusLabel: "Active Canon",
    subtitle: "Visible authority supported by shadow contingency",
    summary:
      "This is the setting's clearest relationship engine: trust built between visible leadership and off-chart protection, where ethical authority survives only by tolerating selective opacity.",
    axis: "Transparency supported by controlled opacity",
    narrativeUse: "Defines the story's central trust structure under crisis",
    characters: ["Lynleit", "Kyrien"],
    dossierIds: ["dossier-dossier-lynleit", "dossier-dossier-kyrien"],
    relatedIds: [
      "theme-theme-visible-authority-and-shadow-capability",
      "case-case-01-fionns-assassination",
      "case-case-03-kyrien-tien-clash",
      "chapter-chapter-06-countermove",
    ],
    notes: [
      {
        label: "Core framing",
        copy: "Structural complementarity under pressure, not romance-first tension.",
      },
      {
        label: "Pressure line",
        copy: "Lynleit chooses trust without full visibility, while Kyrien protects without becoming controllable.",
      },
      {
        label: "Writer rule",
        copy: "Keep Lynleit strategic and Kyrien restrained; their power is tension, not dominance.",
      },
    ],
  },
  {
    id: "lynleit-helena",
    title: "Lynleit & Helena",
    sigil: "LH",
    typeLabel: "Legitimacy War",
    statusLabel: "Active Canon",
    subtitle: "Inheritance pressure transformed into accusation architecture",
    summary:
      "This thread turns private succession strain into open institutional weaponization. Lynleit fights to preserve legitimacy; Helena proves that continuity can be captured and repurposed.",
    axis: "Public continuity versus system capture",
    narrativeUse: "Converts grief, succession, and control into the story's main rupture",
    characters: ["Lynleit", "Helena"],
    dossierIds: ["dossier-dossier-lynleit", "dossier-dossier-helena", "dossier-dossier-fionn"],
    relatedIds: [
      "case-case-01-fionns-assassination",
      "chapter-chapter-02-accusation-vector",
      "chapter-chapter-04-hunt-architecture",
      "world-world-msf",
    ],
    notes: [
      {
        label: "Conflict mode",
        copy: "Helena does not oppose Lynleit emotionally first; she opposes her through institutional leverage.",
      },
      {
        label: "Pressure line",
        copy: "Every move in this thread asks whether visible legitimacy can survive once accusation becomes infrastructure.",
      },
      {
        label: "Writer rule",
        copy: "Keep Helena precise and system-minded rather than melodramatic.",
      },
    ],
  },
  {
    id: "kyrien-tien",
    title: "Kyrien & Tien",
    sigil: "KT",
    typeLabel: "Mirror Threat",
    statusLabel: "Active Canon",
    subtitle: "Two precise shadow actors split by doctrine",
    summary:
      "Kyrien and Tien mirror one another through secrecy, timing, and tactical precision, but they diverge on what hidden force is for: survivability on one side, coercive pressure on the other.",
    axis: "Independent contingency versus covert enforcement",
    narrativeUse: "Externalizes the hidden war beneath the visible story",
    characters: ["Kyrien", "Tien"],
    dossierIds: ["dossier-dossier-kyrien", "dossier-dossier-tien"],
    relatedIds: [
      "case-case-03-kyrien-tien-clash",
      "case-case-01-fionns-assassination",
      "chapter-chapter-07-institutional-pressure",
      "theme-theme-visible-authority-and-shadow-capability",
    ],
    notes: [
      {
        label: "Mirror logic",
        copy: "Both men are precise, quiet, and structurally literate; the split is ethical, not aesthetic.",
      },
      {
        label: "Pressure line",
        copy: "Their clash tests whether hidden protection stays moral once escalation stops being deniable.",
      },
      {
        label: "Writer rule",
        copy: "Avoid making this a simple cool-versus-cool duel. It should clarify doctrine.",
      },
    ],
  },
  {
    id: "felix-reiner",
    title: "Felix & Reiner",
    sigil: "FR",
    typeLabel: "Internal Fracture",
    statusLabel: "Working Scaffold",
    subtitle: "Support alignment and friction inside a mutating institution",
    summary:
      "Felix and Reiner carry the support-and-friction lane inside MSF, showing how loyalty behaves once accusation hardens into institutional hunt and continuity starts changing shape.",
    axis: "Alignment versus contested loyalty",
    narrativeUse: "Keeps MSF from collapsing into a story about leaders alone",
    characters: ["Felix", "Reiner"],
    dossierIds: ["dossier-dossier-felix", "dossier-dossier-reiner"],
    relatedIds: [
      "case-case-02-msf-compression",
      "chapter-chapter-05-extraction-lines",
      "chapter-chapter-07-institutional-pressure",
      "world-world-msf",
    ],
    notes: [
      {
        label: "Current canon state",
        copy: "This thread is intentionally scaffolded rather than fully resolved.",
      },
      {
        label: "Pressure line",
        copy: "One side holds alignment, the other carries friction, and both reveal the cost of continuity under mutation.",
      },
      {
        label: "Writer rule",
        copy: "Treat them as structural stress readers inside MSF, not decorative side names.",
      },
    ],
  },
  {
    id: "sherie-drake-heyk",
    title: "Sherie, Drake & Heyk",
    sigil: "SDH",
    typeLabel: "Peripheral Pressure",
    statusLabel: "Emergent Thread",
    subtitle: "Extraction, interpretation, and external leverage widening the crisis",
    summary:
      "This triad opens a side lane that proves the story's fallout is wider than MSF's immediate interior. Extraction and observation become forms of leverage in their own right.",
    axis: "Peripheral response becoming real leverage",
    narrativeUse: "Expands the canon beyond the central succession conflict",
    characters: ["Sherie", "Drake", "Heyk"],
    dossierIds: ["dossier-dossier-sherie", "dossier-dossier-drake", "dossier-dossier-heyk"],
    relatedIds: [
      "chapter-chapter-00-the-spill",
      "chapter-chapter-01-pressure-builds",
      "world-world-the-country",
      "world-world-external-power-blocs",
    ],
    notes: [
      {
        label: "Current canon state",
        copy: "This thread is active as a pressure lane but not yet fully dramatized.",
      },
      {
        label: "Pressure line",
        copy: "What starts as extraction and interpretation becomes a wider political reading of the crisis.",
      },
      {
        label: "Writer rule",
        copy: "Use this triad to widen consequence, not to distract from the core arc.",
      },
    ],
  },
];

const relationshipState = {
  activeId: RELATIONSHIP_TRACKS[0]?.id || null,
  entriesById: new Map(),
};

if (relationshipRoster && relationshipDetail && relationshipRelated) {
  initializeRelationships();
}

async function initializeRelationships() {
  const { entries } = await window.DivineChamber.fetchManifest();
  relationshipState.entriesById = new Map(entries.map((entry) => [entry.id, entry]));

  const params = new URLSearchParams(window.location.search);
  const requestedId = params.get("id");
  if (requestedId && RELATIONSHIP_TRACKS.some((track) => track.id === requestedId)) {
    relationshipState.activeId = requestedId;
  }

  renderRelationshipRoster();
  renderRelationshipDetail();
}

function renderRelationshipRoster() {
  relationshipRoster.innerHTML = RELATIONSHIP_TRACKS.map((track) => {
    const isActive = track.id === relationshipState.activeId;

    return `
      <button class="selector-card ${isActive ? "is-active" : ""}" type="button" data-id="${track.id}">
        <div class="selector-card__head">
          <span class="sigil">${window.DivineChamber.escapeHtml(track.sigil)}</span>
          <div>
            <strong class="selector-card__title">${window.DivineChamber.escapeHtml(track.title)}</strong>
            <span class="selector-card__meta">${window.DivineChamber.escapeHtml(
              `${track.typeLabel} • ${track.statusLabel}`
            )}</span>
          </div>
        </div>
        <p class="selector-card__copy">${window.DivineChamber.escapeHtml(track.summary)}</p>
        <div class="chip-row mt-3">
          ${track.characters
            .map(
              (character) =>
                `<span class="soft-chip">${window.DivineChamber.escapeHtml(character)}</span>`
            )
            .join("")}
        </div>
      </button>
    `;
  }).join("");

  relationshipRoster.querySelectorAll("[data-id]").forEach((button) => {
    button.addEventListener("click", () => {
      relationshipState.activeId = button.dataset.id;
      syncRelationshipUrl();
      renderRelationshipRoster();
      renderRelationshipDetail();
    });
  });
}

function renderRelationshipDetail() {
  const track = RELATIONSHIP_TRACKS.find((item) => item.id === relationshipState.activeId);
  if (!track) {
    relationshipDetail.innerHTML = `<p class="page-copy mb-0">No relationship thread is available.</p>`;
    relationshipRelated.innerHTML = "";
    return;
  }

  const dossiers = track.dossierIds
    .map((id) => relationshipState.entriesById.get(id))
    .filter(Boolean);
  const relatedEntries = dedupeEntries(
    track.relatedIds
      .map((id) => relationshipState.entriesById.get(id))
      .filter(Boolean)
  );

  relationshipDetail.innerHTML = `
    <div class="detail-panel__hero">
      <div class="portrait-sigil">${window.DivineChamber.escapeHtml(track.sigil)}</div>
      <div>
        <div class="chip-row mb-3">
          <span class="meta-pill">${window.DivineChamber.escapeHtml(track.typeLabel)}</span>
          <span class="meta-pill">${window.DivineChamber.escapeHtml(track.statusLabel)}</span>
          ${track.characters
            .map(
              (character) =>
                `<span class="soft-chip">${window.DivineChamber.escapeHtml(character)}</span>`
            )
            .join("")}
        </div>
        <h2 class="detail-title">${window.DivineChamber.escapeHtml(track.title)}</h2>
        <p class="detail-subtitle">${window.DivineChamber.escapeHtml(track.subtitle)}</p>
        <p class="page-copy mb-0">${window.DivineChamber.escapeHtml(track.summary)}</p>
      </div>
    </div>

    <div class="record-grid mt-4">
      ${renderRecordItem("Thread Type", track.typeLabel)}
      ${renderRecordItem("Status", track.statusLabel)}
      ${renderRecordItem("Core Axis", track.axis)}
      ${renderRecordItem("Narrative Use", track.narrativeUse)}
    </div>

    <div class="row g-4 mt-1">
      <div class="col-lg-5">
        <div class="section-subheader mb-3">
          <h3 class="subsection-title">Core Dossiers</h3>
        </div>
        <div class="route-list route-list--compact">
          ${
            dossiers.length
              ? dossiers.map(renderCompactLink).join("")
              : `<div class="empty-card">No dossiers are linked to this thread yet.</div>`
          }
        </div>
      </div>
      <div class="col-lg-7">
        <div class="section-subheader mb-3">
          <h3 class="subsection-title">Thread Notes</h3>
        </div>
        <div class="relationship-note-list">
          ${track.notes.map(renderRelationshipNote).join("")}
        </div>
      </div>
    </div>
  `;

  relationshipRelated.innerHTML = relatedEntries.length
    ? relatedEntries
        .map((entry) =>
          window.DivineChamber.renderEntryCard(entry, {
            buttonLabel: relationshipButtonLabel(entry),
          })
        )
        .join("")
    : `<div class="empty-card">No supporting files have been assigned to this thread yet.</div>`;
}

function renderCompactLink(entry) {
  return `
    <a class="route-link" href="${window.DivineChamber.entryUrl(entry)}">
      <strong class="route-link__title">${window.DivineChamber.escapeHtml(cleanEntryTitle(entry))}</strong>
      <span class="route-link__copy">${window.DivineChamber.escapeHtml(entry.summary)}</span>
    </a>
  `;
}

function renderRelationshipNote(note) {
  return `
    <article class="relationship-note">
      <p class="card-kicker mb-2">${window.DivineChamber.escapeHtml(note.label)}</p>
      <p class="page-copy mb-0">${window.DivineChamber.escapeHtml(note.copy)}</p>
    </article>
  `;
}

function cleanEntryTitle(entry) {
  return entry.title
    .replace(/^Dossier - /, "")
    .replace(/^Event File - /, "")
    .replace(/^Theme - /, "")
    .replace(/^World File - /, "");
}

function relationshipButtonLabel(entry) {
  if (entry.type === "case") {
    return "Open Event";
  }
  if (["chapter", "scene", "play"].includes(entry.type)) {
    return "Open Chapter";
  }
  if (entry.type === "theme") {
    return "Open Theme";
  }
  return "Open File";
}

function renderRecordItem(label, value) {
  return `
    <div class="record-item">
      <span class="record-item__label">${window.DivineChamber.escapeHtml(label)}</span>
      <span class="record-item__value">${window.DivineChamber.escapeHtml(value)}</span>
    </div>
  `;
}

function dedupeEntries(entries) {
  const seen = new Set();
  return entries.filter((entry) => {
    if (seen.has(entry.id)) {
      return false;
    }
    seen.add(entry.id);
    return true;
  });
}

function syncRelationshipUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set("id", relationshipState.activeId);
  window.history.replaceState({}, "", url);
}
