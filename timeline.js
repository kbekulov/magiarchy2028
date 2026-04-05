const timelineList = document.getElementById("timeline-list");

if (timelineList) {
  initializeTimeline();
}

async function initializeTimeline() {
  const { entries } = await window.DivineChamber.fetchManifest();
  const ordered = window.DivineChamber
    .byChronology(entries.filter((entry) => entry.chronology && entry.chronology !== 999))
    .map(
      (entry) => `
        <article class="timeline-item">
          <div class="timeline-item__index">${window.DivineChamber.orderLabel(entry)}</div>
          <div class="timeline-item__body">
            <div class="chip-row mb-2">${window.DivineChamber.renderBadges(entry)}</div>
            <h2 class="timeline-item__title">${window.DivineChamber.escapeHtml(entry.title)}</h2>
            <p class="timeline-item__copy">${window.DivineChamber.escapeHtml(entry.summary)}</p>
            <a class="btn btn-outline-light btn-sm mt-2" href="${window.DivineChamber.entryUrl(entry)}">Open File</a>
          </div>
        </article>
      `
    );

  timelineList.innerHTML = ordered.join("");
}
