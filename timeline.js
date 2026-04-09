const timelineList = document.getElementById("timeline-list");
const timelineMapBoard = document.getElementById("timeline-map-board");
const timelineMapFrame = document.getElementById("timeline-map-frame");

const timelineLanes = [
  { id: "ch0", label: "Chapter 0", title: "The Interview", type: "chapter" },
  { id: "ch1", label: "Chapter 1", title: "A Visitor", type: "chapter" },
];

const timelineRows = [
  {
    name: "Magi",
    group: "Doctrine",
    kind: "character",
    activities: [
      { title: "Ontology, secrecy, and political cost are articulated in direct terms", start: 1, end: 1, tone: "gold" },
      { title: "Hidden doctrine brushes against a public investigation for the first time", start: 2, end: 2, tone: "violet" },
    ],
  },
  {
    name: "Church",
    group: "Institution",
    kind: "character",
    activities: [
      { title: "Fear, use, and denial are named as the Church's operating posture toward Magi", start: 1, end: 1, tone: "slate" },
      { title: "Father Mikhail arrives before the police can classify the impossible", start: 2, end: 2, tone: "blue" },
    ],
  },
  {
    name: "Inspector Leonid",
    group: "Police",
    kind: "character",
    activities: [
      { title: "Takes control of the perimeter and presses every witness for a rational answer", start: 2, end: 2, tone: "stone" },
    ],
  },
  {
    name: "Father Mikhail",
    group: "Church Bureau",
    kind: "character",
    activities: [
      { title: "Insists on institutional caution while implying the death may not be ordinary", start: 2, end: 2, tone: "slate" },
    ],
  },
  {
    name: "Police",
    group: "Faction",
    kind: "faction",
    activities: [{ title: "Public-order procedure collides with signals of an unnatural death", start: 2, end: 2, tone: "stone" }],
  },
  {
    name: "Church",
    group: "Faction",
    kind: "faction",
    activities: [{ title: "Secrecy maintenance and institutional caution become visible at scene level", start: 2, end: 2, tone: "slate" }],
  },
];

const timelineToneClass = {
  blue: "timeline-map-bar--blue",
  rose: "timeline-map-bar--rose",
  ember: "timeline-map-bar--ember",
  violet: "timeline-map-bar--violet",
  gold: "timeline-map-bar--gold",
  slate: "timeline-map-bar--slate",
  stone: "timeline-map-bar--stone",
  teal: "timeline-map-bar--teal",
};

const timelineTrackTemplate = timelineLanes
  .map((lane) => (lane.type === "event" ? "112px" : "minmax(164px, 1fr)"))
  .join(" ");

let activeLaneIndex = null;

if (timelineList || timelineMapBoard) {
  initializeTimelinePage();
}

async function initializeTimelinePage() {
  if (timelineMapBoard) {
    renderTimelineMap();
    enableTimelineMapDragPan();
  }

  if (timelineList) {
    await renderTimelineList();
  }
}

async function renderTimelineList() {
  try {
    const { entries } = await window.DivineChamber.fetchManifest();
    const ordered = window.DivineChamber
      .byChronology(
        entries.filter(
          (entry) =>
            entry.chronology &&
            entry.chronology !== 999 &&
            ["chapter", "scene", "play", "case"].includes(entry.type)
        )
      )
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

    timelineList.innerHTML = ordered.length
      ? ordered.join("")
      : `
        <article class="empty-card">
          <p class="empty-card__copy mb-0">No timeline entries are currently registered in the manifest.</p>
        </article>
      `;
  } catch (error) {
    console.error("Unable to render story timeline list", error);
    timelineList.innerHTML = `
      <article class="empty-card">
        <p class="empty-card__copy mb-0">The chronological index could not be loaded right now.</p>
      </article>
    `;
  }
}

function createTimelineCell(className, text = "") {
  const node = document.createElement("div");
  node.className = className;
  if (text) {
    node.textContent = text;
  }
  return node;
}

function overlapsActiveLane(activity) {
  if (activeLaneIndex === null) {
    return true;
  }

  const lanePosition = activeLaneIndex + 1;
  return activity.start <= lanePosition && activity.end >= lanePosition;
}

function initialsFor(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function createAvatarShell(row) {
  const shell = document.createElement("div");
  shell.className = `timeline-map-avatar-shell${row.kind === "faction" ? " timeline-map-avatar-shell--faction" : ""}`;

  const fallback = document.createElement("span");
  fallback.className = `timeline-map-avatar-fallback${row.kind === "faction" ? " timeline-map-avatar-fallback--faction" : ""}`;
  fallback.textContent = initialsFor(row.name);
  shell.appendChild(fallback);

  if (row.avatar) {
    const image = document.createElement("img");
    image.className = "timeline-map-avatar-image";
    image.src = row.avatar;
    image.alt = `${row.name} avatar`;
    image.loading = "lazy";
    image.addEventListener("error", () => image.remove(), { once: true });
    shell.appendChild(image);
  }

  return shell;
}

function createNameCell(row) {
  const cell = createTimelineCell(
    `timeline-map-cell timeline-map-sticky timeline-map-sticky-name timeline-map-row-name${
      row.kind === "faction" ? " timeline-map-row-name--faction" : ""
    }`
  );

  const title = document.createElement("strong");
  title.className = "timeline-map-row-title";
  title.textContent = row.name;

  const meta = document.createElement("span");
  meta.className = "timeline-map-row-meta";
  meta.textContent = row.group;

  cell.append(title, meta);
  return cell;
}

function buildTimelineMapHeader() {
  const avatarHeader = createTimelineCell(
    "timeline-map-cell timeline-map-sticky timeline-map-sticky-avatar timeline-map-header-meta timeline-map-avatar-header"
  );
  const nameHeader = createTimelineCell(
    "timeline-map-cell timeline-map-sticky timeline-map-sticky-name timeline-map-header-meta timeline-map-header-name",
    "Actor / Bloc"
  );

  const headerTrack = document.createElement("div");
  headerTrack.className = "timeline-map-track timeline-map-header-track";
  headerTrack.style.gridTemplateColumns = timelineTrackTemplate;

  timelineLanes.forEach((lane, index) => {
    const laneButton = document.createElement("button");
    laneButton.type = "button";
    laneButton.className = `timeline-map-lane-head timeline-map-lane-head--${lane.type}`;
    laneButton.setAttribute("aria-pressed", String(activeLaneIndex === index));

    if (activeLaneIndex !== null) {
      laneButton.classList.add(
        activeLaneIndex === index ? "timeline-map-lane-head--active" : "timeline-map-lane-head--muted"
      );
    }

    const label = document.createElement("span");
    label.className = "timeline-map-lane-label";
    label.textContent = lane.label;

    const title = document.createElement("strong");
    title.className = "timeline-map-lane-title";
    title.textContent = lane.title;

    laneButton.append(label, title);
    laneButton.addEventListener("click", () => {
      activeLaneIndex = activeLaneIndex === index ? null : index;
      renderTimelineMap();
    });

    headerTrack.appendChild(laneButton);
  });

  timelineMapBoard.append(avatarHeader, nameHeader, headerTrack);
}

function buildTimelineMapRow(row) {
  const visibleActivities = row.activities.filter(overlapsActiveLane);
  if (!visibleActivities.length) {
    return;
  }

  const avatarCell = createTimelineCell(
    `timeline-map-cell timeline-map-sticky timeline-map-sticky-avatar timeline-map-row-avatar${
      row.kind === "faction" ? " timeline-map-row-avatar--faction" : ""
    }`
  );
  avatarCell.appendChild(createAvatarShell(row));

  const nameCell = createNameCell(row);

  const track = document.createElement("div");
  track.className = "timeline-map-track timeline-map-row-track";
  track.style.gridTemplateColumns = timelineTrackTemplate;

  timelineLanes.forEach((lane) => {
    const laneCell = document.createElement("div");
    laneCell.className = `timeline-map-lane timeline-map-lane--${lane.type}`;
    track.appendChild(laneCell);
  });

  visibleActivities.forEach((activity) => {
    const bar = document.createElement("article");
    bar.className = `timeline-map-bar ${timelineToneClass[activity.tone] || "timeline-map-bar--blue"}`;
    bar.style.gridColumn = `${activity.start} / ${activity.end + 1}`;

    const title = document.createElement("strong");
    title.className = "timeline-map-bar__title";
    title.textContent = activity.title;

    const meta = document.createElement("span");
    meta.className = "timeline-map-bar__meta";
    meta.textContent = `${timelineLanes[activity.start - 1].label} - ${timelineLanes[activity.end - 1].label}`;

    bar.append(title, meta);
    track.appendChild(bar);
  });

  timelineMapBoard.append(avatarCell, nameCell, track);
}

function renderTimelineMap() {
  timelineMapBoard.innerHTML = "";
  buildTimelineMapHeader();
  timelineRows.forEach(buildTimelineMapRow);
}

function enableTimelineMapDragPan() {
  if (!timelineMapFrame || timelineMapFrame.dataset.dragPanBound === "true") {
    return;
  }

  timelineMapFrame.dataset.dragPanBound = "true";

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let startScrollLeft = 0;
  let startScrollTop = 0;

  timelineMapFrame.addEventListener("mousedown", (event) => {
    if (event.button !== 0) {
      return;
    }

    if (event.target instanceof HTMLElement && event.target.closest(".timeline-map-lane-head")) {
      return;
    }

    isDragging = true;
    startX = event.clientX;
    startY = event.clientY;
    startScrollLeft = timelineMapFrame.scrollLeft;
    startScrollTop = timelineMapFrame.scrollTop;
    timelineMapFrame.classList.add("is-dragging");
    event.preventDefault();
  });

  window.addEventListener("mousemove", (event) => {
    if (!isDragging) {
      return;
    }

    timelineMapFrame.scrollLeft = startScrollLeft - (event.clientX - startX);
    timelineMapFrame.scrollTop = startScrollTop - (event.clientY - startY);
  });

  window.addEventListener("mouseup", () => {
    if (!isDragging) {
      return;
    }

    isDragging = false;
    timelineMapFrame.classList.remove("is-dragging");
  });

  timelineMapFrame.addEventListener("mouseleave", () => {
    if (!isDragging) {
      return;
    }

    isDragging = false;
    timelineMapFrame.classList.remove("is-dragging");
  });
}
