const eventsFeatured = document.getElementById("events-featured");
const eventsCases = document.getElementById("events-cases");
const eventsChapters = document.getElementById("events-chapters");

if (eventsFeatured && eventsCases && eventsChapters) {
  initializeEvents();
}

async function initializeEvents() {
  const { entries } = await window.DivineChamber.fetchManifest();
  const eventFiles = window.DivineChamber.byChronology(
    entries.filter((entry) => entry.type === "case")
  );
  const chapterFiles = window.DivineChamber.byChronology(
    entries.filter((entry) => ["chapter", "scene", "play"].includes(entry.type))
  );
  const featured = window.DivineChamber
    .byChronology([...eventFiles, ...chapterFiles].filter((entry) => entry.featured))
    .slice(0, 4);

  eventsFeatured.innerHTML = featured.length
    ? featured
        .map((entry) =>
          window.DivineChamber.renderEntryCard(entry, {
            buttonLabel: entry.type === "case" ? "Open Event" : "Open Chapter",
          })
        )
        .join("")
    : `<div class="empty-card">Featured entries have not been assigned yet.</div>`;

  eventsCases.innerHTML = eventFiles
    .map((entry) =>
      window.DivineChamber.renderEntryCard(entry, {
        buttonLabel: "Open Event",
      })
    )
    .join("");

  eventsChapters.innerHTML = chapterFiles
    .map((entry) =>
      window.DivineChamber.renderEntryCard(entry, {
        buttonLabel: "Open Chapter",
      })
    )
    .join("");
}
