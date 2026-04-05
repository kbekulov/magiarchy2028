const homeStats = document.getElementById("home-stats");
const homeFeatured = document.getElementById("home-featured");
const homeRecent = document.getElementById("home-recent");

if (homeStats && homeFeatured && homeRecent) {
  initializeHome();
}

async function initializeHome() {
  const { entries } = await window.DivineChamber.fetchManifest();
  const literaryEntries = entries.filter((entry) =>
    ["chapter", "scene", "play"].includes(entry.type)
  );

  homeStats.innerHTML = `
    <article class="stat-card">
      <span class="stat-card__value">${entries.filter((entry) => entry.type === "dossier").length}</span>
      <span class="stat-card__label">Cast Dossiers</span>
    </article>
    <article class="stat-card">
      <span class="stat-card__value">${entries.filter((entry) => entry.type === "case").length}</span>
      <span class="stat-card__label">Bureau Cases</span>
    </article>
    <article class="stat-card">
      <span class="stat-card__value">${literaryEntries.length}</span>
      <span class="stat-card__label">Literary Files</span>
    </article>
    <article class="stat-card">
      <span class="stat-card__value">${entries.filter((entry) => entry.type === "world").length}</span>
      <span class="stat-card__label">World Files</span>
    </article>
  `;

  const featuredPool = entries.filter((entry) => entry.featured);
  const featured = window.DivineChamber
    .byChronology(featuredPool.length ? featuredPool : literaryEntries)
    .slice(0, 3);

  homeFeatured.innerHTML = featured
    .map((entry) =>
      window.DivineChamber.renderEntryCard(entry, {
        buttonLabel: "Read file",
      })
    )
    .join("");

  const recent = [...window.DivineChamber.byChronology(entries)].reverse().slice(0, 4);
  homeRecent.innerHTML = recent
    .map(
      (entry) => `
        <a class="stack-link" href="${window.DivineChamber.entryUrl(entry)}">
          <span class="stack-link__meta">${window.DivineChamber.formatType(entry.type)}<span class="divider-dot"></span>${window.DivineChamber.orderLabel(entry)}</span>
          <strong class="stack-link__title">${window.DivineChamber.escapeHtml(entry.title)}</strong>
          <span class="stack-link__copy">${window.DivineChamber.escapeHtml(entry.summary)}</span>
        </a>
      `
    )
    .join("");
}
