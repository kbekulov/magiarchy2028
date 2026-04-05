const worldGroups = document.getElementById("world-groups");

if (worldGroups) {
  initializeWorld();
}

async function initializeWorld() {
  const { entries } = await window.DivineChamber.fetchManifest();
  const worldEntries = window.DivineChamber.byChronology(
    entries.filter((entry) => entry.type === "world")
  );

  const groups = groupBy(worldEntries, (entry) => entry.fields.category || "general");
  const order = ["foundations", "magistry", "locations", "organizations", "general"];

  worldGroups.innerHTML = order
    .filter((key) => groups[key]?.length)
    .map(
      (key) => `
        <section class="world-group">
          <div class="section-subheader">
            <h2 class="subsection-title">${window.DivineChamber.sentenceCase(key)}</h2>
          </div>
          <div class="entry-grid">
            ${groups[key]
              .map((entry) =>
                window.DivineChamber.renderEntryCard(entry, {
                  buttonLabel: "Open File",
                })
              )
              .join("")}
          </div>
        </section>
      `
    )
    .concat(
      Object.keys(groups)
        .filter((key) => !order.includes(key))
        .sort()
        .map(
          (key) => `
            <section class="world-group">
              <div class="section-subheader">
                <h2 class="subsection-title">${window.DivineChamber.sentenceCase(key)}</h2>
              </div>
              <div class="entry-grid">
                ${groups[key]
                  .map((entry) =>
                    window.DivineChamber.renderEntryCard(entry, {
                      buttonLabel: "Open File",
                    })
                  )
                  .join("")}
              </div>
            </section>
          `
        )
    )
    .join("");
}

function groupBy(entries, selector) {
  return entries.reduce((groups, entry) => {
    const key = selector(entry);
    groups[key] = groups[key] || [];
    groups[key].push(entry);
    return groups;
  }, {});
}
