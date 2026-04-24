const homeStats = document.getElementById("home-stats");
const homeFeatured = document.getElementById("home-featured");
const homeRecent = document.getElementById("home-recent");
const homeStoryPath = document.getElementById("home-story-path");

if (homeStats && homeFeatured && homeRecent && homeStoryPath) {
  initializeHome();
}

async function initializeHome() {
  const { entries } = await window.DivineChamber.fetchManifest();
  const literaryEntries = entries.filter((entry) =>
    ["chapter", "scene", "play"].includes(entry.type)
  );
  const chapters = window.DivineChamber.byChronology(
    entries.filter((entry) => entry.type === "chapter")
  );

  homeStoryPath.innerHTML = chapters
    .map(
      (entry, index) => `
        <a class="story-path__item" href="${window.DivineChamber.entryUrl(entry)}">
          <span class="story-path__order">${String(index).padStart(2, "0")}</span>
          <span class="story-path__body">
            <strong>${window.DivineChamber.escapeHtml(entry.title)}</strong>
            <span>${window.DivineChamber.escapeHtml(entry.summary)}</span>
          </span>
          <span class="story-path__status">${window.DivineChamber.formatStatus(entry.status)}</span>
        </a>
      `
    )
    .join("");

  homeStats.innerHTML = `
    <article class="stat-card">
      <span class="stat-card__value">${entries.filter((entry) => entry.type === "dossier").length}</span>
      <span class="stat-card__label">Character Dossiers</span>
    </article>
    <article class="stat-card">
      <span class="stat-card__value">${entries.filter((entry) => entry.type === "case").length}</span>
      <span class="stat-card__label">Crisis Files</span>
    </article>
    <article class="stat-card">
      <span class="stat-card__value">${literaryEntries.length}</span>
      <span class="stat-card__label">Story Files</span>
    </article>
    <article class="stat-card">
      <span class="stat-card__value">${entries.filter((entry) => entry.type === "world").length}</span>
      <span class="stat-card__label">Doctrine Files</span>
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
