const worldSectionGroups = document.getElementById("world-section-groups");

if (worldSectionGroups) {
  initializeWorldSection();
}

const WORLD_GROUP_COPY = {
  foundations:
    "Foundational doctrine defines how reality, psyche, and hidden pressure remain structurally continuous in this setting.",
  magistry:
    "Magistry files clarify the system's leverage points: law, secrecy, governance, and what magical intervention is allowed to cost.",
  locations:
    "Locations are pressure-bearing spaces rather than postcard geography. Each one shapes visibility, control, and symbolic weight.",
  organizations:
    "Organizations carry the political geometry of the story: continuity systems, sanctioned orders, and the outside blocs pressing inward.",
  general:
    "These files hold the doctrine that does not sit cleanly inside one narrower shelf.",
};

async function initializeWorldSection() {
  const categories = (document.body.dataset.worldCategories || "")
    .split("|")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  const { entries } = await window.DivineChamber.fetchManifest();
  const worldEntries = window.DivineChamber.byChronology(
    entries.filter((entry) => entry.type === "world")
  );
  const filteredEntries = categories.length
    ? worldEntries.filter((entry) => categories.includes((entry.fields.category || "general").toLowerCase()))
    : worldEntries;
  const groups = groupBy(filteredEntries, (entry) => entry.fields.category || "general");
  const order = categories.length
    ? categories
    : ["foundations", "magistry", "locations", "organizations", "general"];

  worldSectionGroups.innerHTML = filteredEntries.length
    ? order
        .filter((key) => groups[key]?.length)
        .map((key) => renderWorldGroup(key, groups[key]))
        .join("")
    : `<div class="empty-card">No doctrine files are currently assigned to this section.</div>`;
}

function renderWorldGroup(key, entries) {
  return `
    <section class="world-group">
      <div class="section-subheader">
        <h2 class="subsection-title">${window.DivineChamber.sentenceCase(key)}</h2>
        <p class="page-copy mt-2 mb-0">${window.DivineChamber.escapeHtml(
          WORLD_GROUP_COPY[key] || WORLD_GROUP_COPY.general
        )}</p>
      </div>
      <div class="entry-grid mt-4">
        ${entries
          .map((entry) =>
            window.DivineChamber.renderEntryCard(entry, {
              buttonLabel: "Open File",
            })
          )
          .join("")}
      </div>
    </section>
  `;
}

function groupBy(entries, selector) {
  return entries.reduce((groups, entry) => {
    const key = selector(entry);
    groups[key] = groups[key] || [];
    groups[key].push(entry);
    return groups;
  }, {});
}
