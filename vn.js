const vnShell = document.getElementById("vn-shell");

if (vnShell) {
  initializeVNSimulator();
}

async function initializeVNSimulator() {
  const refs = getVNRefs();
  const state = {
    chapters: [],
    chapterIndex: 0,
    beatIndex: 0,
    isAnimating: false,
    skipAnimations: false,
    animationTimer: null,
    currentText: "",
    menuOpen: false,
  };

  bindVNEvents(refs, state);

  try {
    const { entries } = await window.DivineChamber.fetchManifest();
    const chapters = window.DivineChamber
      .byChronology(
        entries.filter(
          (entry) => entry.type === "chapter" && entry.chronology && entry.chronology !== 999
        )
      )
      .map((entry, index) => ({
        ...entry,
        index,
        beats: parseChapterMarkdown(entry.markdown || "", entry.title),
      }));

    state.chapters = chapters;

    if (!chapters.length) {
      renderVNEmpty(refs, "No chapter files are currently available for the VN simulator.");
      return;
    }

    const requestedChapterId = new URLSearchParams(window.location.search).get("chapter");
    const initialIndex = Math.max(
      0,
      chapters.findIndex((chapter) => chapter.id === requestedChapterId)
    );

    renderChapterMenu(refs, state);
    setSkipState(refs, state, false);
    openChapter(refs, state, initialIndex > -1 ? initialIndex : 0);
  } catch (error) {
    console.error("Unable to initialize VN simulator", error);
    renderVNEmpty(
      refs,
      "The chapter archive could not be loaded for the VN simulator right now."
    );
  }
}

function getVNRefs() {
  return {
    order: document.getElementById("vn-order"),
    title: document.getElementById("vn-chapter-title"),
    summary: document.getElementById("vn-summary"),
    stage: document.getElementById("vn-stage"),
    stageChapter: document.getElementById("vn-stage-chapter"),
    stageHint: document.getElementById("vn-stage-hint"),
    spriteLeft: document.getElementById("vn-sprite-left"),
    spriteRight: document.getElementById("vn-sprite-right"),
    mode: document.getElementById("vn-mode"),
    progress: document.getElementById("vn-progress"),
    text: document.getElementById("vn-text"),
    menuButton: document.getElementById("vn-menu-button"),
    menuClose: document.getElementById("vn-menu-close"),
    menuPanel: document.getElementById("vn-menu-panel"),
    menuBackdrop: document.getElementById("vn-menu-backdrop"),
    chapterList: document.getElementById("vn-chapter-list"),
    skipToggle: document.getElementById("vn-skip-toggle"),
    nextButton: document.getElementById("vn-next-button"),
    backButton: document.getElementById("vn-back-button"),
  };
}

function parseChapterMarkdown(markdown, chapterTitle) {
  const normalized = String(markdown || "")
    .replace(/\r\n/g, "\n")
    .trim();

  if (!normalized) {
    return [
      {
        mode: "system",
        label: "Archive Note",
        text: "This chapter does not have readable body text yet.",
      },
    ];
  }

  const rawBlocks = normalized
    .split(/\n\s*\n+/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (
    rawBlocks[0] &&
    rawBlocks[0].match(/^#\s+/) &&
    rawBlocks[0].replace(/^#\s+/, "").trim() === chapterTitle.trim()
  ) {
    rawBlocks.shift();
  }

  const beats = [];

  rawBlocks.forEach((block) => {
    const headingMatch = block.match(/^#{1,4}\s+(.*)$/);
    if (headingMatch) {
      beats.push({
        mode: "system",
        label: "Section",
        text: headingMatch[1].trim(),
      });
      return;
    }

    if (block.startsWith(">")) {
      const quoteText = block
        .split("\n")
        .map((line) => line.replace(/^>\s?/, "").trim())
        .filter(Boolean)
        .join(" ");

      if (quoteText) {
        beats.push({
          mode: "echo",
          label: "Echo",
          text: quoteText,
        });
      }
      return;
    }

    const listLines = block
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (listLines.every((line) => /^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line))) {
      listLines.forEach((line) => {
        beats.push({
          mode: "system",
          label: "Archive Note",
          text: line.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, "").trim(),
        });
      });
      return;
    }

    const text = listLines.join(" ").trim();
    if (!text) {
      return;
    }

    const mode = inferVNBeatMode(text);
    beats.push({
      mode,
      label: vnModeLabel(mode),
      text,
    });
  });

  return beats.length
    ? beats
    : [
        {
          mode: "system",
          label: "Archive Note",
          text: "This chapter does not have readable body text yet.",
        },
      ];
}

function inferVNBeatMode(text) {
  if (/^["“][\s\S]*["”]$/.test(text) || /^'[\s\S]*'$/.test(text)) {
    return "dialogue";
  }

  if (/^[A-Z][A-Za-z\s'-]{1,36}:/.test(text)) {
    return "dialogue";
  }

  if (text.length < 90 && !/[.!?]["”']?$/.test(text)) {
    return "system";
  }

  return "narration";
}

function vnModeLabel(mode) {
  return {
    dialogue: "Dialogue",
    narration: "Narration",
    system: "Archive Note",
    echo: "Echo",
  }[mode] || "Narration";
}

function bindVNEvents(refs, state) {
  refs.nextButton?.addEventListener("click", () => advanceVN(refs, state));
  refs.backButton?.addEventListener("click", () => retreatVN(refs, state));
  refs.skipToggle?.addEventListener("click", () =>
    setSkipState(refs, state, !state.skipAnimations)
  );
  refs.menuButton?.addEventListener("click", () => openVNMenu(refs, state));
  refs.menuClose?.addEventListener("click", () => closeVNMenu(refs, state));
  refs.menuBackdrop?.addEventListener("click", () => closeVNMenu(refs, state));
  refs.text?.closest(".vn-textbox")?.addEventListener("click", (event) => {
    if (event.target.closest("button")) {
      return;
    }

    advanceVN(refs, state);
  });

  document.addEventListener("keydown", (event) => {
    if (event.target instanceof HTMLElement) {
      const interactiveTarget = event.target.closest(
        "button, a, input, textarea, select, [contenteditable='true']"
      );

      if (interactiveTarget && !event.target.closest(".vn-menu-panel")) {
        return;
      }
    }

    if (event.key === "Escape" && state.menuOpen) {
      event.preventDefault();
      closeVNMenu(refs, state);
      return;
    }

    if (state.menuOpen) {
      return;
    }

    if (event.key === " " || event.key === "Enter" || event.key === "ArrowRight") {
      event.preventDefault();
      advanceVN(refs, state);
      return;
    }

    if (event.key === "ArrowLeft" || event.key === "Backspace") {
      event.preventDefault();
      retreatVN(refs, state);
      return;
    }

    if (event.key.toLowerCase() === "m") {
      event.preventDefault();
      openVNMenu(refs, state);
      return;
    }

    if (event.key.toLowerCase() === "s") {
      event.preventDefault();
      setSkipState(refs, state, !state.skipAnimations);
    }
  });
}

function renderVNEmpty(refs, message) {
  refs.title.textContent = "VN Simulator unavailable";
  refs.summary.textContent = message;
  refs.stageChapter.textContent = "Archive unavailable";
  refs.stageHint.textContent = message;
  refs.mode.textContent = "Archive Note";
  refs.mode.dataset.mode = "system";
  refs.progress.textContent = "0 / 0";
  refs.text.textContent = message;
  refs.text.dataset.mode = "system";
  refs.backButton.disabled = true;
  refs.nextButton.disabled = true;
  refs.menuButton.disabled = true;
}

function openChapter(refs, state, chapterIndex, beatIndex = 0) {
  const boundedChapterIndex = Math.max(0, Math.min(state.chapters.length - 1, chapterIndex));
  const chapter = state.chapters[boundedChapterIndex];
  if (!chapter) {
    return;
  }

  clearVNAnimation(state);
  state.chapterIndex = boundedChapterIndex;
  state.beatIndex = Math.max(0, Math.min(chapter.beats.length - 1, beatIndex));

  updateChapterScene(refs, chapter);
  updateChapterMenuSelection(refs, state);
  updateChapterUrl(chapter.id);
  renderCurrentBeat(refs, state);
}

function updateChapterScene(refs, chapter) {
  refs.order.textContent = `Chronology ${window.DivineChamber.orderLabel(chapter)}`;
  refs.title.textContent = chapter.title;
  refs.summary.textContent = chapter.summary || "No summary has been registered for this chapter yet.";
  refs.stageChapter.textContent = chapter.title;
  refs.stageHint.textContent =
    chapter.summary || "Placeholder background and sprite direction can be replaced once art arrives.";

  const hue = 200 + (chapter.index * 19) % 60;
  refs.stage.style.setProperty("--vn-accent", `hsla(${hue}, 78%, 62%, 0.28)`);
  refs.stage.style.setProperty("--vn-accent-strong", `hsla(${hue}, 82%, 58%, 0.46)`);
  refs.stage.style.setProperty("--vn-accent-soft", `hsla(${hue}, 80%, 72%, 0.12)`);

  const spriteNames = chapter.characters?.length
    ? chapter.characters.slice(0, 2)
    : chapter.beats.some((beat) => beat.mode === "dialogue")
      ? ["Speaker A", "Speaker B"]
      : ["Stage Left", "Stage Right"];

  setSpriteSlot(refs.spriteLeft, spriteNames[0] || "Stage Left", "Sprite Slot");
  setSpriteSlot(refs.spriteRight, spriteNames[1] || "Sprite Slot", "Sprite Slot");
}

function setSpriteSlot(node, name, label) {
  if (!node) {
    return;
  }

  const labelNode = node.querySelector(".vn-sprite-slot__label");
  const nameNode = node.querySelector(".vn-sprite-slot__name");
  if (labelNode) {
    labelNode.textContent = label;
  }
  if (nameNode) {
    nameNode.textContent = name;
  }
}

function renderCurrentBeat(refs, state) {
  const chapter = state.chapters[state.chapterIndex];
  const beat = chapter?.beats?.[state.beatIndex];
  if (!chapter || !beat) {
    return;
  }

  refs.mode.textContent = beat.label || vnModeLabel(beat.mode);
  refs.mode.dataset.mode = beat.mode;
  refs.progress.textContent = `${state.beatIndex + 1} / ${chapter.beats.length}`;
  refs.text.dataset.mode = beat.mode;
  refs.text.textContent = "";
  playVNBeatText(refs, state, beat.text);
}

function playVNBeatText(refs, state, text) {
  clearVNAnimation(state);
  state.currentText = text;

  if (state.skipAnimations) {
    refs.text.textContent = text;
    state.isAnimating = false;
    updateVNActionLabels(refs, state);
    return;
  }

  state.isAnimating = true;
  updateVNActionLabels(refs, state);
  let index = 0;

  const tick = () => {
    refs.text.textContent = text.slice(0, index + 1);
    index += 1;

    if (index >= text.length) {
      state.isAnimating = false;
      state.animationTimer = null;
      updateVNActionLabels(refs, state);
      return;
    }

    const previousCharacter = text[index - 1];
    const delay = /[.!?…]/.test(previousCharacter)
      ? 52
      : /[,;:]/.test(previousCharacter)
        ? 34
        : 17;

    state.animationTimer = window.setTimeout(tick, delay);
  };

  tick();
}

function clearVNAnimation(state) {
  if (state.animationTimer) {
    window.clearTimeout(state.animationTimer);
    state.animationTimer = null;
  }

  state.isAnimating = false;
}

function advanceVN(refs, state) {
  if (!state.chapters.length) {
    return;
  }

  if (state.isAnimating) {
    clearVNAnimation(state);
    refs.text.textContent = state.currentText;
    updateVNActionLabels(refs, state);
    return;
  }

  const chapter = state.chapters[state.chapterIndex];
  if (state.beatIndex < chapter.beats.length - 1) {
    state.beatIndex += 1;
    renderCurrentBeat(refs, state);
    return;
  }

  if (state.chapterIndex < state.chapters.length - 1) {
    openChapter(refs, state, state.chapterIndex + 1, 0);
    return;
  }

  refs.mode.textContent = "Archive End";
  refs.mode.dataset.mode = "system";
  refs.progress.textContent = `${chapter.beats.length} / ${chapter.beats.length}`;
  refs.text.textContent =
    "End of the currently loaded chapter archive. Add more chapter text and the simulator will continue from here.";
  refs.text.dataset.mode = "system";
  updateVNActionLabels(refs, state, true);
}

function retreatVN(refs, state) {
  if (!state.chapters.length) {
    return;
  }

  if (state.isAnimating) {
    clearVNAnimation(state);
    refs.text.textContent = state.currentText;
    updateVNActionLabels(refs, state);
    return;
  }

  if (state.beatIndex > 0) {
    state.beatIndex -= 1;
    renderCurrentBeat(refs, state);
    return;
  }

  if (state.chapterIndex > 0) {
    const previousChapter = state.chapters[state.chapterIndex - 1];
    openChapter(refs, state, state.chapterIndex - 1, previousChapter.beats.length - 1);
  }
}

function updateVNActionLabels(refs, state, isArchiveEnd = false) {
  const chapter = state.chapters[state.chapterIndex];
  if (!chapter) {
    return;
  }

  refs.backButton.disabled = state.chapterIndex === 0 && state.beatIndex === 0;

  if (isArchiveEnd) {
    refs.nextButton.textContent = "Archive End";
    refs.nextButton.disabled = true;
    return;
  }

  refs.nextButton.disabled = false;

  if (state.isAnimating) {
    refs.nextButton.textContent = "Finish Line";
    return;
  }

  if (state.beatIndex < chapter.beats.length - 1) {
    refs.nextButton.textContent = "Advance";
    return;
  }

  refs.nextButton.textContent =
    state.chapterIndex < state.chapters.length - 1 ? "Next Chapter" : "Finish";
}

function setSkipState(refs, state, value) {
  state.skipAnimations = Boolean(value);
  refs.skipToggle.setAttribute("aria-pressed", String(state.skipAnimations));
  refs.skipToggle.classList.toggle("is-active", state.skipAnimations);
  refs.skipToggle.textContent = state.skipAnimations ? "Skip On" : "Skip Anim";

  if (state.isAnimating && state.skipAnimations) {
    clearVNAnimation(state);
    refs.text.textContent = state.currentText;
    updateVNActionLabels(refs, state);
  }
}

function renderChapterMenu(refs, state) {
  refs.chapterList.innerHTML = state.chapters
    .map((chapter, index) => {
      const version = chapter.fields?.draft_version
        ? `<span>${window.DivineChamber.escapeHtml(`v${chapter.fields.draft_version}`)}</span>`
        : "";

      return `
        <button
          class="vn-chapter-jump"
          type="button"
          data-vn-chapter-index="${index}"
        >
          <span class="vn-chapter-jump__meta">
            <span>${window.DivineChamber.escapeHtml(window.DivineChamber.orderLabel(chapter))}</span>
            <span>${window.DivineChamber.escapeHtml(window.DivineChamber.formatStatus(chapter.status))}</span>
            ${version}
          </span>
          <strong class="vn-chapter-jump__title">${window.DivineChamber.escapeHtml(chapter.title)}</strong>
          <span class="vn-chapter-jump__summary">${window.DivineChamber.escapeHtml(chapter.summary || "No summary yet.")}</span>
        </button>
      `;
    })
    .join("");

  refs.chapterList.querySelectorAll("[data-vn-chapter-index]").forEach((button) => {
    button.addEventListener("click", () => {
      const chapterIndex = Number(button.dataset.vnChapterIndex);
      openChapter(refs, state, chapterIndex, 0);
      closeVNMenu(refs, state);
    });
  });
}

function updateChapterMenuSelection(refs, state) {
  refs.chapterList.querySelectorAll("[data-vn-chapter-index]").forEach((button) => {
    const isActive = Number(button.dataset.vnChapterIndex) === state.chapterIndex;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function openVNMenu(refs, state) {
  state.menuOpen = true;
  refs.menuPanel.hidden = false;
  refs.menuBackdrop.hidden = false;
  document.body.classList.add("vn-menu-open");
  refs.menuClose?.focus();
}

function closeVNMenu(refs, state) {
  state.menuOpen = false;
  refs.menuPanel.hidden = true;
  refs.menuBackdrop.hidden = true;
  document.body.classList.remove("vn-menu-open");
  refs.menuButton?.focus();
}

function updateChapterUrl(chapterId) {
  const url = new URL(window.location.href);
  url.searchParams.set("chapter", chapterId);
  window.history.replaceState({}, "", url);
}
