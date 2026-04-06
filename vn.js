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
    archiveEnded: false,
    isAnimating: false,
    skipAnimations: false,
    autoAdvance: false,
    bgmEnabled: false,
    menuOpen: false,
    currentText: "",
    currentMode: "narration",
    currentTarget: null,
    animationTimer: null,
    autoTimer: null,
    bgmEngine: null,
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
    const requestedIndex = chapters.findIndex((chapter) => chapter.id === requestedChapterId);
    const initialIndex = requestedIndex >= 0 ? requestedIndex : 0;

    renderChapterMenu(refs, state);
    setSkipState(refs, state, false);
    setAutoState(refs, state, false);
    setBGMButtonState(refs, state);
    setFullscreenButtonState(refs);
    openChapter(refs, state, initialIndex, 0);
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
    shell: document.getElementById("vn-shell"),
    order: document.getElementById("vn-order"),
    title: document.getElementById("vn-chapter-title"),
    summary: document.getElementById("vn-summary"),
    stage: document.getElementById("vn-stage"),
    stageChapter: document.getElementById("vn-stage-chapter"),
    stageHint: document.getElementById("vn-stage-hint"),
    spriteLeft: document.getElementById("vn-sprite-left"),
    spriteRight: document.getElementById("vn-sprite-right"),
    narrationBox: document.getElementById("vn-narration-box"),
    narrationMode: document.getElementById("vn-mode-narration"),
    narrationProgress: document.getElementById("vn-progress-narration"),
    narrationText: document.getElementById("vn-narration-text"),
    dialogueBox: document.getElementById("vn-dialogue-box"),
    dialogueMode: document.getElementById("vn-mode-dialogue"),
    dialogueProgress: document.getElementById("vn-progress-dialogue"),
    dialogueText: document.getElementById("vn-dialogue-text"),
    speaker: document.getElementById("vn-speaker"),
    hint: document.getElementById("vn-hint"),
    menuButton: document.getElementById("vn-menu-button"),
    autoToggle: document.getElementById("vn-auto-toggle"),
    skipToggle: document.getElementById("vn-skip-toggle"),
    bgmToggle: document.getElementById("vn-bgm-toggle"),
    fullscreenToggle: document.getElementById("vn-fullscreen-toggle"),
    menuClose: document.getElementById("vn-menu-close"),
    menuPanel: document.getElementById("vn-menu-panel"),
    menuBackdrop: document.getElementById("vn-menu-backdrop"),
    chapterList: document.getElementById("vn-chapter-list"),
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

  if (/^[A-Z][A-Za-z\s'’-]{1,36}:\s+/.test(text)) {
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

function splitSpeakerFromText(text) {
  const speakerMatch = text.match(/^([A-Z][A-Za-z\s'’-]{1,36}):\s+([\s\S]+)$/);
  if (speakerMatch) {
    return {
      speaker: speakerMatch[1].trim(),
      text: speakerMatch[2].trim(),
    };
  }

  return {
    speaker: "",
    text,
  };
}

function bindVNEvents(refs, state) {
  refs.nextButton?.addEventListener("click", () => {
    pauseAutoForManualInteraction(refs, state);
    advanceVN(refs, state);
  });
  refs.backButton?.addEventListener("click", () => {
    pauseAutoForManualInteraction(refs, state);
    retreatVN(refs, state);
  });
  refs.skipToggle?.addEventListener("click", () =>
    setSkipState(refs, state, !state.skipAnimations)
  );
  refs.autoToggle?.addEventListener("click", () =>
    setAutoState(refs, state, !state.autoAdvance)
  );
  refs.bgmToggle?.addEventListener("click", () => toggleBGM(refs, state));
  refs.fullscreenToggle?.addEventListener("click", () => toggleFullscreen(refs));
  refs.menuButton?.addEventListener("click", () => openVNMenu(refs, state));
  refs.menuClose?.addEventListener("click", () => closeVNMenu(refs, state));
  refs.menuBackdrop?.addEventListener("click", () => closeVNMenu(refs, state));

  refs.stage?.addEventListener("click", (event) => {
    if (event.target.closest("button")) {
      return;
    }

    if (event.target.closest(".vn-controlbar__actions")) {
      return;
    }

    pauseAutoForManualInteraction(refs, state);
    advanceVN(refs, state);
  });

  document.addEventListener("fullscreenchange", () => {
    setFullscreenButtonState(refs);
  });

  document.addEventListener("keydown", (event) => {
    if (state.menuOpen) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeVNMenu(refs, state);
      }
      return;
    }

    if (event.target instanceof HTMLElement) {
      const interactiveTarget = event.target.closest(
        "button, a, input, textarea, select, [contenteditable='true']"
      );

      if (interactiveTarget) {
        return;
      }
    }

    if (event.key === " " || event.key === "Enter" || event.key === "ArrowRight") {
      event.preventDefault();
      pauseAutoForManualInteraction(refs, state);
      advanceVN(refs, state);
      return;
    }

    if (event.key === "ArrowLeft" || event.key === "Backspace") {
      event.preventDefault();
      pauseAutoForManualInteraction(refs, state);
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
      return;
    }

    if (event.key.toLowerCase() === "a") {
      event.preventDefault();
      setAutoState(refs, state, !state.autoAdvance);
      return;
    }

    if (event.key.toLowerCase() === "b") {
      event.preventDefault();
      toggleBGM(refs, state);
      return;
    }

    if (event.key.toLowerCase() === "f") {
      event.preventDefault();
      toggleFullscreen(refs);
    }
  });
}

function renderVNEmpty(refs, message) {
  refs.title.textContent = "VN Simulator unavailable";
  refs.summary.textContent = message;
  refs.stageChapter.textContent = "Archive unavailable";
  refs.stageHint.textContent = message;
  refs.narrationBox.hidden = false;
  refs.dialogueBox.hidden = true;
  refs.narrationMode.textContent = "Archive Note";
  refs.narrationMode.dataset.mode = "system";
  refs.narrationProgress.textContent = "0 / 0";
  refs.narrationText.textContent = message;
  refs.narrationText.dataset.mode = "system";
  refs.hint.innerHTML = "The VN simulator could not load chapter text.";
  refs.backButton.disabled = true;
  refs.nextButton.disabled = true;
  refs.menuButton.disabled = true;
  refs.autoToggle.disabled = true;
  refs.skipToggle.disabled = true;
  refs.bgmToggle.disabled = true;
}

function openChapter(refs, state, chapterIndex, beatIndex = 0) {
  const boundedChapterIndex = Math.max(0, Math.min(state.chapters.length - 1, chapterIndex));
  const chapter = state.chapters[boundedChapterIndex];
  if (!chapter) {
    return;
  }

  clearVNAnimation(state);
  clearAutoAdvance(state);
  state.archiveEnded = false;
  state.chapterIndex = boundedChapterIndex;
  state.beatIndex = Math.max(0, Math.min(chapter.beats.length - 1, beatIndex));

  updateChapterScene(refs, chapter);
  updateChapterMenuSelection(refs, state);
  updateChapterUrl(chapter.id);
  syncBGMToChapter(state);
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

  clearAutoAdvance(state);
  state.archiveEnded = false;
  const speakerData = beat.mode === "dialogue" ? splitSpeakerFromText(beat.text) : null;
  const displayText = speakerData ? speakerData.text : beat.text;
  const progressLabel = `${state.beatIndex + 1} / ${chapter.beats.length}`;

  state.currentMode = beat.mode;
  state.currentText = displayText;

  if (beat.mode === "dialogue") {
    refs.narrationBox.hidden = true;
    refs.dialogueBox.hidden = false;
    refs.dialogueMode.textContent = beat.label || vnModeLabel(beat.mode);
    refs.dialogueMode.dataset.mode = beat.mode;
    refs.dialogueProgress.textContent = progressLabel;
    refs.dialogueText.dataset.mode = beat.mode;
    refs.dialogueText.textContent = "";

    if (speakerData?.speaker) {
      refs.speaker.hidden = false;
      refs.speaker.textContent = speakerData.speaker;
    } else {
      refs.speaker.hidden = true;
      refs.speaker.textContent = "";
    }

    state.currentTarget = refs.dialogueText;
  } else {
    refs.dialogueBox.hidden = true;
    refs.narrationBox.hidden = false;
    refs.narrationMode.textContent = beat.label || vnModeLabel(beat.mode);
    refs.narrationMode.dataset.mode = beat.mode;
    refs.narrationProgress.textContent = progressLabel;
    refs.narrationText.dataset.mode = beat.mode;
    refs.narrationText.textContent = "";
    refs.speaker.hidden = true;
    refs.speaker.textContent = "";
    state.currentTarget = refs.narrationText;
  }

  updateHint(refs, state);
  playVNBeatText(refs, state, displayText);
}

function playVNBeatText(refs, state, text) {
  clearVNAnimation(state);
  state.currentText = text;

  if (state.skipAnimations) {
    if (state.currentTarget) {
      state.currentTarget.textContent = text;
    }
    state.isAnimating = false;
    updateVNActionLabels(refs, state);
    queueAutoAdvance(refs, state);
    return;
  }

  state.isAnimating = true;
  updateVNActionLabels(refs, state);
  let index = 0;

  const tick = () => {
    if (state.currentTarget) {
      state.currentTarget.textContent = text.slice(0, index + 1);
    }
    index += 1;

    if (index >= text.length) {
      state.isAnimating = false;
      state.animationTimer = null;
      updateVNActionLabels(refs, state);
      queueAutoAdvance(refs, state);
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

function queueAutoAdvance(refs, state) {
  clearAutoAdvance(state);

  if (!state.autoAdvance || state.menuOpen || !state.chapters.length) {
    return;
  }

  const chapter = state.chapters[state.chapterIndex];
  const beat = chapter?.beats?.[state.beatIndex];
  if (!beat) {
    return;
  }

  const baseDelay = beat.mode === "dialogue" ? 900 : 1200;
  const perCharacterDelay = beat.mode === "dialogue" ? 34 : 38;
  const delay = Math.max(1400, Math.min(6200, baseDelay + state.currentText.length * perCharacterDelay));

  state.autoTimer = window.setTimeout(() => {
    state.autoTimer = null;
    advanceVN(refs, state, { automated: true });
  }, delay);
}

function clearAutoAdvance(state) {
  if (state.autoTimer) {
    window.clearTimeout(state.autoTimer);
    state.autoTimer = null;
  }
}

function advanceVN(refs, state, options = {}) {
  if (!state.chapters.length) {
    return;
  }

  clearAutoAdvance(state);

  if (state.isAnimating) {
    clearVNAnimation(state);
    if (state.currentTarget) {
      state.currentTarget.textContent = state.currentText;
    }
    updateVNActionLabels(refs, state);
    if (state.autoAdvance && !options.automated) {
      queueAutoAdvance(refs, state);
    }
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

  refs.dialogueBox.hidden = true;
  refs.narrationBox.hidden = false;
  state.archiveEnded = true;
  refs.narrationMode.textContent = "Archive End";
  refs.narrationMode.dataset.mode = "system";
  refs.narrationProgress.textContent = `${chapter.beats.length} / ${chapter.beats.length}`;
  refs.narrationText.textContent =
    "End of the currently loaded chapter archive. Add more chapter text and the simulator will continue from here.";
  refs.narrationText.dataset.mode = "system";
  refs.speaker.hidden = true;
  refs.speaker.textContent = "";
  refs.hint.innerHTML =
    "Reached the end of the loaded archive. Use <kbd>Chapters</kbd> to jump elsewhere or add more text.";
  updateVNActionLabels(refs, state, true);
}

function retreatVN(refs, state) {
  if (!state.chapters.length) {
    return;
  }

  clearAutoAdvance(state);

  if (state.isAnimating) {
    clearVNAnimation(state);
    if (state.currentTarget) {
      state.currentTarget.textContent = state.currentText;
    }
    updateVNActionLabels(refs, state);
    return;
  }

  if (state.archiveEnded) {
    state.archiveEnded = false;
    renderCurrentBeat(refs, state);
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
    refs.nextButton.textContent = state.skipAnimations ? "Advance" : "Finish Line";
    return;
  }

  if (state.beatIndex < chapter.beats.length - 1) {
    refs.nextButton.textContent = "Advance";
    return;
  }

  refs.nextButton.textContent =
    state.chapterIndex < state.chapters.length - 1 ? "Next Chapter" : "Finish";
}

function updateHint(refs, state) {
  if (state.autoAdvance) {
    refs.hint.innerHTML =
      'Auto mode is active. Press <kbd>A</kbd> to pause, <kbd>S</kbd> to skip typing, or click to take over manually.';
    return;
  }

  refs.hint.innerHTML =
    'Click the stage or press <kbd>Space</kbd> to advance. Use <kbd>A</kbd> for auto, <kbd>B</kbd> for BGM, and <kbd>F</kbd> for fullscreen.';
}

function pauseAutoForManualInteraction(refs, state) {
  if (!state.autoAdvance) {
    return;
  }

  setAutoState(refs, state, false);
}

function setSkipState(refs, state, value) {
  state.skipAnimations = Boolean(value);
  refs.skipToggle.setAttribute("aria-pressed", String(state.skipAnimations));
  refs.skipToggle.classList.toggle("is-active", state.skipAnimations);
  refs.skipToggle.textContent = state.skipAnimations ? "Skip On" : "Skip Type";

  if (state.isAnimating && state.skipAnimations) {
    clearVNAnimation(state);
    if (state.currentTarget) {
      state.currentTarget.textContent = state.currentText;
    }
    updateVNActionLabels(refs, state);
    queueAutoAdvance(refs, state);
  }
}

function setAutoState(refs, state, value) {
  state.autoAdvance = Boolean(value);
  refs.autoToggle.setAttribute("aria-pressed", String(state.autoAdvance));
  refs.autoToggle.classList.toggle("is-active", state.autoAdvance);
  refs.autoToggle.textContent = state.autoAdvance ? "Auto On" : "Auto";
  updateHint(refs, state);

  if (!state.autoAdvance) {
    clearAutoAdvance(state);
    return;
  }

  if (!state.isAnimating) {
    queueAutoAdvance(refs, state);
  }
}

async function toggleBGM(refs, state) {
  const nextValue = !state.bgmEnabled;
  state.bgmEnabled = nextValue;
  setBGMButtonState(refs, state);

  if (!nextValue) {
    fadeOutBGM(state);
    return;
  }

  const engine = await ensureBGMAudio(state);
  if (!engine) {
    state.bgmEnabled = false;
    refs.bgmToggle.disabled = true;
    refs.bgmToggle.textContent = "BGM N/A";
    refs.bgmToggle.classList.remove("is-active");
    return;
  }

  await engine.context.resume();
  syncBGMToChapter(state);
  fadeInBGM(state);
}

function setBGMButtonState(refs, state) {
  refs.bgmToggle.setAttribute("aria-pressed", String(state.bgmEnabled));
  refs.bgmToggle.classList.toggle("is-active", state.bgmEnabled);
  refs.bgmToggle.textContent = state.bgmEnabled ? "BGM On" : "BGM";
}

async function ensureBGMAudio(state) {
  if (state.bgmEngine) {
    return state.bgmEngine;
  }

  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) {
    return null;
  }

  const context = new AudioContextCtor();
  const masterGain = context.createGain();
  masterGain.gain.value = 0.0001;

  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 760;
  filter.Q.value = 0.55;

  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = -30;
  compressor.knee.value = 16;
  compressor.ratio.value = 4;
  compressor.attack.value = 0.02;
  compressor.release.value = 0.28;

  masterGain.connect(filter);
  filter.connect(compressor);
  compressor.connect(context.destination);

  const lfo = context.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = 0.065;

  const lfoGain = context.createGain();
  lfoGain.gain.value = 85;
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);
  lfo.start();

  const voiceSpecs = [
    { type: "triangle", gain: 0.03 },
    { type: "sine", gain: 0.018 },
    { type: "sine", gain: 0.013 },
  ];

  const voices = voiceSpecs.map((spec) => {
    const oscillator = context.createOscillator();
    oscillator.type = spec.type;
    oscillator.frequency.value = 110;

    const gain = context.createGain();
    gain.gain.value = spec.gain;

    oscillator.connect(gain);
    gain.connect(masterGain);
    oscillator.start();

    return { oscillator, gain };
  });

  state.bgmEngine = {
    context,
    masterGain,
    filter,
    voices,
  };

  return state.bgmEngine;
}

function syncBGMToChapter(state) {
  if (!state.bgmEnabled || !state.bgmEngine || !state.chapters.length) {
    return;
  }

  const chapter = state.chapters[state.chapterIndex];
  const engine = state.bgmEngine;
  const rootSequence = [110, 123.47, 130.81, 146.83, 164.81, 174.61, 196, 220];
  const chordSetSequence = [
    [1, 6 / 5, 3 / 2],
    [1, 5 / 4, 3 / 2],
    [1, 4 / 3, 5 / 3],
    [1, 6 / 5, 8 / 5],
  ];
  const root = rootSequence[chapter.index % rootSequence.length];
  const chord = chordSetSequence[chapter.index % chordSetSequence.length];
  const now = engine.context.currentTime;

  engine.voices.forEach((voice, index) => {
    voice.oscillator.frequency.cancelScheduledValues(now);
    voice.oscillator.frequency.linearRampToValueAtTime(root * chord[index], now + 2.2);
  });

  engine.filter.frequency.cancelScheduledValues(now);
  engine.filter.frequency.linearRampToValueAtTime(620 + chapter.index * 28, now + 2.2);
}

function fadeInBGM(state) {
  if (!state.bgmEngine) {
    return;
  }

  const now = state.bgmEngine.context.currentTime;
  state.bgmEngine.masterGain.gain.cancelScheduledValues(now);
  state.bgmEngine.masterGain.gain.setValueAtTime(state.bgmEngine.masterGain.gain.value, now);
  state.bgmEngine.masterGain.gain.linearRampToValueAtTime(0.055, now + 1.2);
}

function fadeOutBGM(state) {
  if (!state.bgmEngine) {
    return;
  }

  const now = state.bgmEngine.context.currentTime;
  state.bgmEngine.masterGain.gain.cancelScheduledValues(now);
  state.bgmEngine.masterGain.gain.setValueAtTime(state.bgmEngine.masterGain.gain.value, now);
  state.bgmEngine.masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.7);
}

async function toggleFullscreen(refs) {
  const fullscreenTarget = refs.shell;
  if (!fullscreenTarget) {
    return;
  }

  try {
    if (document.fullscreenElement === fullscreenTarget) {
      await document.exitFullscreen();
    } else if (!document.fullscreenElement) {
      await fullscreenTarget.requestFullscreen();
    }
  } catch (error) {
    console.error("Unable to toggle fullscreen for VN simulator", error);
  }
}

function setFullscreenButtonState(refs) {
  const isFullscreen = document.fullscreenElement === refs.shell;
  refs.fullscreenToggle.setAttribute("aria-pressed", String(isFullscreen));
  refs.fullscreenToggle.classList.toggle("is-active", isFullscreen);
  refs.fullscreenToggle.textContent = isFullscreen ? "Exit Fullscreen" : "Fullscreen";
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
  clearAutoAdvance(state);
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

  if (state.autoAdvance && !state.isAnimating) {
    queueAutoAdvance(refs, state);
  }
}

function updateChapterUrl(chapterId) {
  const url = new URL(window.location.href);
  url.searchParams.set("chapter", chapterId);
  window.history.replaceState({}, "", url);
}
