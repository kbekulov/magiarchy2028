const musicFeature = document.getElementById("music-feature");
const musicCollections = document.getElementById("music-collections");

const musicState = {
  library: null,
  tracks: [],
  activeId: null,
};

if (musicFeature && musicCollections) {
  initializeMusic();
}

async function initializeMusic() {
  const library = await fetchMusicLibrary();
  const tracks = normalizeTracks(library.tracks || []);

  musicState.library = library;
  musicState.tracks = tracks;
  musicState.activeId =
    library.featuredTrackId ||
    tracks.find((track) => track.hasVideo)?.id ||
    tracks[0]?.id ||
    null;

  musicCollections.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-track-id]");
    if (!trigger) {
      return;
    }

    musicState.activeId = trigger.dataset.trackId;
    renderMusicRoom();
  });

  renderMusicRoom();
}

async function fetchMusicLibrary() {
  const response = await fetch("content/music-library.json");
  if (!response.ok) {
    throw new Error(`Music library request failed with ${response.status}`);
  }

  return response.json();
}

function normalizeTracks(tracks) {
  return tracks
    .map((track, index) => {
      const youtube = String(track.youtube || track.videoId || track.url || "").trim();
      const videoId = extractYouTubeId(youtube);
      const order = Number.parseInt(track.order, 10);

      return {
        id: track.id || `track-${index + 1}`,
        title: track.title || `Track ${String(index + 1).padStart(2, "0")}`,
        facet: track.facet || "meta",
        collection: track.collection || "Listening Room",
        mood: track.mood || "",
        reading: track.reading || "",
        summary: track.summary || "No track note has been added yet.",
        note: track.note || "",
        order: Number.isFinite(order) ? order : index + 1,
        videoId,
        hasVideo: Boolean(videoId),
        watchUrl: videoId ? `https://www.youtube.com/watch?v=${videoId}` : "",
      };
    })
    .sort((left, right) => {
      if (left.order !== right.order) {
        return left.order - right.order;
      }

      return left.title.localeCompare(right.title);
    });
}

function extractYouTubeId(value) {
  if (!value) {
    return "";
  }

  const raw = value.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(raw)) {
    return raw;
  }

  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      return url.pathname.split("/").filter(Boolean)[0] || "";
    }

    if (
      host.endsWith("youtube.com") ||
      host.endsWith("youtube-nocookie.com")
    ) {
      const fromQuery = url.searchParams.get("v");
      if (fromQuery) {
        return fromQuery;
      }

      const segments = url.pathname.split("/").filter(Boolean);
      if (["embed", "shorts", "live"].includes(segments[0])) {
        return segments[1] || "";
      }
    }
  } catch (_error) {
    // Ignore parse errors and fall back to pattern matching.
  }

  const matchedId = raw.match(/(?:v=|\/)([A-Za-z0-9_-]{11})(?:[?&/#]|$)/);
  return matchedId ? matchedId[1] : "";
}

function renderMusicRoom() {
  renderMusicFeature();
  renderMusicCollections();
}

function renderMusicFeature() {
  const track = getActiveTrack();
  if (!track) {
    musicFeature.innerHTML = `
      <div class="empty-card">
        The music room is ready, but no tracks have been assigned yet.
      </div>
    `;
    return;
  }

  const escapeHtml = window.DivineChamber.escapeHtml;
  const formatFacet = window.DivineChamber.formatFacet;
  const overview = musicState.library?.overview || "";

  musicFeature.innerHTML = `
    <article class="music-stage">
      <div class="music-stage__media">
        ${renderFeaturedMedia(track)}
      </div>
      <div class="music-stage__body">
        <p class="card-kicker">Listening Room</p>
        <h2 class="detail-title">${escapeHtml(track.title)}</h2>
        <p class="detail-subtitle">${escapeHtml(track.collection)}</p>
        <p class="page-copy mb-0">${escapeHtml(track.summary)}</p>
        <div class="record-grid mt-4">
          ${renderTrackRecord("Facet", formatFacet(track.facet))}
          ${renderTrackRecord("Mood", track.mood)}
          ${renderTrackRecord("Use", track.reading)}
          ${renderTrackRecord("Shelf", track.collection)}
        </div>
        ${
          track.note
            ? `
              <div class="music-stage__note mt-4">
                <p class="page-copy mb-0">${escapeHtml(track.note)}</p>
              </div>
            `
            : ""
        }
        ${
          overview
            ? `<p class="music-stage__overview mt-4 mb-0">${escapeHtml(overview)}</p>`
            : ""
        }
        <div class="hero-actions mt-4">
          ${
            track.hasVideo
              ? `
                <a class="btn btn-brass" href="${track.watchUrl}" target="_blank" rel="noreferrer">
                  Watch on YouTube
                </a>
              `
              : `
                <span class="music-stage__status">
                  This shelf is ready for a public YouTube upload.
                </span>
              `
          }
          <a class="btn btn-outline-light" href="library.html">Open writing archive</a>
        </div>
      </div>
    </article>
  `;
}

function renderFeaturedMedia(track) {
  const escapeHtml = window.DivineChamber.escapeHtml;

  if (!track.hasVideo) {
    return `
      <div class="music-embed music-embed--placeholder">
        <div class="music-placeholder">
          <span class="music-placeholder__eyebrow">Awaiting Upload</span>
          <strong class="music-placeholder__title">${escapeHtml(track.title)}</strong>
          <span class="music-placeholder__copy">
            Paste a public YouTube link into this slot and it will appear here.
          </span>
        </div>
      </div>
    `;
  }

  const embedUrl = `https://www.youtube-nocookie.com/embed/${track.videoId}?rel=0`;

  return `
    <div class="music-embed">
      <iframe
        src="${embedUrl}"
        title="${escapeHtml(track.title)}"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
      ></iframe>
    </div>
  `;
}

function renderMusicCollections() {
  if (!musicState.tracks.length) {
    musicCollections.innerHTML = `
      <div class="empty-card">
        Add track metadata to <code>content/music-library.json</code> and the shelves will populate automatically.
      </div>
    `;
    return;
  }

  const collectionNotes = musicState.library?.collectionNotes || {};
  const groupedTracks = groupTracksByCollection(musicState.tracks);

  musicCollections.innerHTML = groupedTracks
    .map(([collection, tracks]) => {
      const note = collectionNotes[collection];

      return `
        <section class="music-shelf">
          <div class="music-shelf__head">
            <div>
              <h3 class="music-shelf__title">${window.DivineChamber.escapeHtml(collection)}</h3>
              ${
                note
                  ? `<p class="music-shelf__copy mb-0">${window.DivineChamber.escapeHtml(note)}</p>`
                  : ""
              }
            </div>
          </div>
          <div class="music-shelf__grid">
            ${tracks.map((track) => renderTrackCard(track)).join("")}
          </div>
        </section>
      `;
    })
    .join("");
}

function renderTrackCard(track) {
  const escapeHtml = window.DivineChamber.escapeHtml;
  const formatFacet = window.DivineChamber.formatFacet;
  const isActive = track.id === musicState.activeId;

  return `
    <article class="music-track-card ${isActive ? "is-active" : ""}">
      <button
        class="music-track-card__media"
        type="button"
        data-track-id="${escapeHtml(track.id)}"
        aria-label="Load ${escapeHtml(track.title)} in player"
      >
        ${renderTrackThumbnail(track)}
      </button>
      <div class="music-track-card__body">
        <div class="archive-card__meta">
          <div class="chip-row">
            <span class="meta-pill meta-pill--facet meta-pill--${escapeHtml(track.facet)}">${escapeHtml(
              formatFacet(track.facet)
            )}</span>
            <span class="meta-pill">${track.hasVideo ? "YouTube" : "Reserved slot"}</span>
          </div>
        </div>
        <h3 class="archive-card__title">${escapeHtml(track.title)}</h3>
        <p class="archive-card__summary">${escapeHtml(track.summary)}</p>
        ${
          track.mood || track.reading
            ? `
              <div class="archive-card__line">
                ${track.mood ? `<span>${escapeHtml(track.mood)}</span>` : ""}
                ${
                  track.mood && track.reading
                    ? `<span class="divider-dot"></span>`
                    : ""
                }
                ${track.reading ? `<span>${escapeHtml(track.reading)}</span>` : ""}
              </div>
            `
            : ""
        }
        <div class="music-track-card__actions">
          <button class="btn btn-outline-light btn-sm" type="button" data-track-id="${escapeHtml(
            track.id
          )}">
            ${track.hasVideo ? "Load in player" : "View slot"}
          </button>
          ${
            track.hasVideo
              ? `
                <a class="music-text-link" href="${track.watchUrl}" target="_blank" rel="noreferrer">
                  Open on YouTube
                </a>
              `
              : ""
          }
        </div>
      </div>
    </article>
  `;
}

function renderTrackThumbnail(track) {
  const escapeHtml = window.DivineChamber.escapeHtml;

  if (!track.hasVideo) {
    return `
      <div class="music-thumb music-thumb--placeholder">
        <div class="music-thumb__overlay">
          <span class="music-play-badge">Slot</span>
        </div>
      </div>
    `;
  }

  const thumbnailUrl = `https://i.ytimg.com/vi/${track.videoId}/hqdefault.jpg`;

  return `
    <div class="music-thumb">
      <img src="${thumbnailUrl}" alt="${escapeHtml(track.title)} thumbnail" loading="lazy" />
      <div class="music-thumb__overlay">
        <span class="music-play-badge">Play</span>
      </div>
    </div>
  `;
}

function groupTracksByCollection(tracks) {
  const grouped = new Map();

  tracks.forEach((track) => {
    if (!grouped.has(track.collection)) {
      grouped.set(track.collection, []);
    }

    grouped.get(track.collection).push(track);
  });

  return [...grouped.entries()];
}

function getActiveTrack() {
  return (
    musicState.tracks.find((track) => track.id === musicState.activeId) ||
    musicState.tracks[0] ||
    null
  );
}

function renderTrackRecord(label, value) {
  if (!value) {
    return "";
  }

  return `
    <div class="record-item">
      <span class="record-item__label">${window.DivineChamber.escapeHtml(label)}</span>
      <span class="record-item__value">${window.DivineChamber.escapeHtml(value)}</span>
    </div>
  `;
}
