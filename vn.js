const vnShell = document.getElementById("vn-shell");
const VN_MAIN_MENU_BGM_TRACK = "media/vn_simulator/main_menu/main_menu_track_1.mp3";
const VN_CHAPTER_INTRO_VISIBLE_MS = 1700;
const VN_CHAPTER_INTRO_FADE_MS = 560;
const VN_NARRATION_PAGE_MAX_CHARS = 560;
const VN_NARRATION_PAGE_MAX_LINES = 8;
const VN_NARRATION_APPROX_CHARS_PER_LINE = 72;
const VN_SCENE_LIBRARY = {
  "chapter-chapter-01-a-visitor": {
    backdrop: "media/vn_simulator/chapter_1/bg_street_1.png",
    sprites: [
      {
        name: "Inspector Leo",
        role: "Investigator",
        src: "media/vn_simulator/chapter_1/detective_1.png",
        aliases: ["inspector leo", "leo"],
      },
      {
        name: "Father Mikhail",
        role: "Church Bureau",
        src: "media/vn_simulator/chapter_1/priest_1.png",
        aliases: ["father mikhail", "mikhail"],
      },
    ],
  },
};

function listifyField(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  return String(value || "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildSceneSpriteFromFields(fields, side) {
  const name = String(fields?.[`vn_${side}_name`] || "").trim();
  const role = String(fields?.[`vn_${side}_role`] || "").trim();
  const src = String(fields?.[`vn_${side}_sprite`] || "").trim();
  const aliases = listifyField(fields?.[`vn_${side}_aliases`]);

  if (!name && !role && !src && !aliases.length) {
    return null;
  }

  return {
    name: name || `Stage ${side[0].toUpperCase()}${side.slice(1)}`,
    role: role || "Placeholder",
    src,
    aliases,
  };
}

function getChapterSceneConfig(chapter) {
  const chapterFields = chapter?.fields || {};
  const libraryScene = VN_SCENE_LIBRARY[chapter?.id] || {};
  const chapterSprites = ["left", "right"]
    .map((side) => buildSceneSpriteFromFields(chapterFields, side))
    .filter(Boolean);

  return {
    backdrop: String(chapterFields.vn_backdrop || libraryScene.backdrop || "").trim(),
    bgmTrack: String(chapterFields.vn_bgm || libraryScene.bgmTrack || "").trim(),
    sprites: chapterSprites.length ? chapterSprites : libraryScene.sprites || [],
  };
}

if (vnShell) {
  initializeVNSimulator();
}

function readStoredBGMPreference() {
  return true;
}

function persistBGMPreference(value) {
  void value;
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
    bgmEnabled: readStoredBGMPreference(),
    menuOpen: false,
    logOpen: false,
    currentText: "",
    currentMode: "narration",
    currentTarget: null,
    narrationSteps: [],
    narrationStepIndex: 0,
    animationTimer: null,
    autoTimer: null,
    introFadeTimer: null,
    introHideTimer: null,
    introResolve: null,
    introActive: false,
    openToken: 0,
    mainMenuOpen: false,
    menuStartChapterIndex: 0,
    bgmEngine: null,
    log: [],
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
    setFullscreenButtonState(refs);
    showMainMenu(refs, state, { startChapterIndex: initialIndex });
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
    mainMenu: document.getElementById("vn-main-menu"),
    mainMenuStart: document.getElementById("vn-main-menu-start"),
    mainMenuButton: document.getElementById("vn-main-menu-button"),
    mainMenuBgmToggle: document.getElementById("vn-main-menu-bgm-toggle"),
    mainMenuFullscreenToggle: document.getElementById("vn-main-menu-fullscreen"),
    order: document.getElementById("vn-order"),
    title: document.getElementById("vn-chapter-title"),
    stage: document.getElementById("vn-stage"),
    spriteLeft: document.getElementById("vn-sprite-left"),
    spriteRight: document.getElementById("vn-sprite-right"),
    introOverlay: document.getElementById("vn-chapter-intro"),
    introOrder: document.getElementById("vn-intro-order"),
    introTitle: document.getElementById("vn-intro-title"),
    narrationOverlay: document.getElementById("vn-narration-overlay"),
    narrationText: document.getElementById("vn-narration-text"),
    cursorNarration: document.getElementById("vn-cursor-narration"),
    textbox: document.getElementById("vn-textbox"),
    textboxText: document.getElementById("vn-textbox-text"),
    nameplate: document.getElementById("vn-nameplate"),
    cursor: document.getElementById("vn-cursor"),
    progress: document.getElementById("vn-progress"),
    hint: document.getElementById("vn-hint"),
    menuButton: document.getElementById("vn-menu-button"),
    logButton: document.getElementById("vn-log-button"),
    autoToggle: document.getElementById("vn-auto-toggle"),
    bgmToggle: document.getElementById("vn-bgm-toggle"),
    skipToggle: document.getElementById("vn-skip-toggle"),
    fullscreenToggle: document.getElementById("vn-fullscreen-toggle"),
    menuClose: document.getElementById("vn-menu-close"),
    menuPanel: document.getElementById("vn-menu-panel"),
    menuBackdrop: document.getElementById("vn-menu-backdrop"),
    chapterList: document.getElementById("vn-chapter-list"),
    logClose: document.getElementById("vn-log-close"),
    logPanel: document.getElementById("vn-log-panel"),
    logBackdrop: document.getElementById("vn-log-backdrop"),
    logList: document.getElementById("vn-log-list"),
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

    const mixedSpeechBeats = decomposeMixedSpeechBlock(text);
    if (mixedSpeechBeats?.length) {
      beats.push(...mixedSpeechBeats);
      return;
    }

    const mode = inferVNBeatMode(text);

    if (mode === "narration") {
      pushNarrationBeats(beats, text);
      return;
    }

    beats.push({
      mode,
      label: vnModeLabel(mode),
      text: mode === "dialogue" ? extractDialoguePayload(text).text : text,
      sourceText: mode === "dialogue" ? text : undefined,
    });
  });

  return normalizeVNBeats(beats);
}

function buildNarrationBeat(text) {
  return {
    mode: "narration",
    label: "Narration",
    text,
  };
}

function estimateNarrationLines(text) {
  return String(text || "")
    .split(/\n\s*\n+/)
    .filter(Boolean)
    .reduce((lineCount, paragraph, index) => {
      const paragraphLines = Math.max(
        1,
        Math.ceil(paragraph.length / VN_NARRATION_APPROX_CHARS_PER_LINE)
      );
      return lineCount + paragraphLines + (index > 0 ? 1 : 0);
    }, 0);
}

function canFitNarrationText(text) {
  return (
    String(text || "").length <= VN_NARRATION_PAGE_MAX_CHARS &&
    estimateNarrationLines(text) <= VN_NARRATION_PAGE_MAX_LINES
  );
}

function paginateLongNarrationText(text) {
  const cleaned = cleanNarrativeFragment(text);
  if (!cleaned) {
    return [];
  }

  const sentences = splitIntoSentenceBeats(cleaned);
  if (!sentences.length) {
    return [];
  }

  const pages = [];
  let currentPage = "";

  sentences.forEach((sentence) => {
    const nextPage = currentPage ? `${currentPage}\n\n${sentence}` : sentence;
    if (!currentPage || canFitNarrationText(nextPage)) {
      currentPage = nextPage;
      return;
    }

    pages.push(currentPage);
    currentPage = sentence;
  });

  if (currentPage) {
    pages.push(currentPage);
  }

  return pages;
}

function paginateNarrationBeats(beats) {
  const paginatedBeats = [];
  let narrationBuffer = [];

  const flushNarrationBuffer = () => {
    if (!narrationBuffer.length) {
      return;
    }

    paginatedBeats.push(buildNarrationBeat(narrationBuffer.join("\n\n")));
    narrationBuffer = [];
  };

  beats.forEach((beat) => {
    if (beat.mode !== "narration") {
      flushNarrationBuffer();
      paginatedBeats.push(beat);
      return;
    }

    const candidateText = narrationBuffer.length
      ? `${narrationBuffer.join("\n\n")}\n\n${beat.text}`
      : beat.text;

    if (!narrationBuffer.length || canFitNarrationText(candidateText)) {
      narrationBuffer.push(beat.text);
      return;
    }

    flushNarrationBuffer();
    narrationBuffer.push(beat.text);
  });

  flushNarrationBuffer();
  return paginatedBeats;
}

function fallbackVNBeats() {
  return [
    {
      mode: "system",
      label: "Archive Note",
      text: "This chapter does not have readable body text yet.",
    },
  ];
}

function normalizeVNBeats(beats) {
  const paginatedBeats = paginateNarrationBeats(beats);
  return paginatedBeats.length ? paginatedBeats : fallbackVNBeats();
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

function splitIntoSentenceBeats(text) {
  // Split at sentence boundaries: punctuation followed by whitespace + capital letter (or closing quote + capital)
  // Keeps fragments and short declaratives as individual beats
  const parts = text.split(/(?<=[.!?]['""\u2019\u201d]?)\s+(?=[A-Z\u201c"'])/);
  const cleaned = parts.map((s) => s.trim()).filter(Boolean);
  return cleaned.length > 1 ? cleaned : [text];
}

function splitNarrationSentences(text) {
  return String(text || "")
    .split(/\n\s*\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .flatMap((paragraph) => splitIntoSentenceBeats(paragraph));
}

function buildNarrationStepTexts(text) {
  const sentences = splitNarrationSentences(text);
  if (!sentences.length) {
    return [];
  }

  return sentences.map((_, index) => sentences.slice(0, index + 1).join("\n\n"));
}

function cleanNarrativeFragment(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .replace(/^[,;:\s]+/, "")
    .replace(/[,;:\s]+$/, "")
    .trim();
}

function isLikelySpeechAttribution(text) {
  const cleaned = normalizeSpeakerKey(text);
  if (!cleaned) {
    return true;
  }

  const tokens = cleaned.split(" ").filter(Boolean);
  const speechVerbs = new Set([
    "said",
    "asked",
    "replied",
    "answered",
    "repeated",
    "added",
    "murmured",
    "whispered",
    "shouted",
    "snapped",
    "continued",
    "called",
    "told",
  ]);

  return tokens.length <= 8 && tokens.some((token) => speechVerbs.has(token));
}

function pushNarrationBeats(beats, text) {
  const cleaned = cleanNarrativeFragment(text);
  if (!cleaned) {
    return;
  }

  paginateLongNarrationText(cleaned).forEach((page) => {
    beats.push(buildNarrationBeat(page));
  });
}

function decomposeMixedSpeechBlock(text) {
  if (/^[A-Z][A-Za-z\s'’-]{1,36}:\s+/.test(text) || !beatContainsSpeech(text)) {
    return null;
  }

  const quoteMatches = Array.from(text.matchAll(/["“]([\s\S]*?)["”]/g));
  if (!quoteMatches.length) {
    return null;
  }

  const firstQuote = quoteMatches[0];
  const lastQuote = quoteMatches[quoteMatches.length - 1];
  const leadingFragment = cleanNarrativeFragment(text.slice(0, firstQuote.index));
  const trailingFragment = cleanNarrativeFragment(
    text.slice(lastQuote.index + lastQuote[0].length)
  );

  const hasLeadingNarration = leadingFragment && !isLikelySpeechAttribution(leadingFragment);
  const hasTrailingNarration = trailingFragment && !isLikelySpeechAttribution(trailingFragment);

  if (!hasLeadingNarration && !hasTrailingNarration) {
    return null;
  }

  const beats = [];

  if (hasLeadingNarration) {
    pushNarrationBeats(beats, leadingFragment);
  }

  beats.push({
    mode: "dialogue",
    label: "Dialogue",
    text: extractDialoguePayload(text).text,
    sourceText: text,
  });

  if (hasTrailingNarration) {
    pushNarrationBeats(beats, trailingFragment);
  }

  return beats;
}

function vnModeLabel(mode) {
  return {
    dialogue: "Dialogue",
    narration: "Narration",
    system: "Archive Note",
    echo: "Echo",
  }[mode] || "Narration";
}

function extractDialoguePayload(text) {
  const speakerMatch = text.match(/^([A-Z][A-Za-z\s'’-]{1,36}):\s+([\s\S]+)$/);
  if (speakerMatch) {
    return {
      speaker: speakerMatch[1].trim(),
      text: speakerMatch[2].trim(),
    };
  }

  const quotedFragments = Array.from(text.matchAll(/["“]([\s\S]*?)["”]/g))
    .map((match) => match[1].replace(/\s+/g, " ").trim())
    .filter(Boolean);

  if (quotedFragments.length) {
    return {
      speaker: "",
      text: quotedFragments.join(" ").replace(/\s+([,.;!?])/g, "$1").trim(),
    };
  }

  return {
    speaker: "",
    text: String(text || "").trim(),
  };
}

function formatDialogueDisplayText(text) {
  const cleaned = String(text || "").trim();
  if (!cleaned) {
    return "";
  }

  if (/^["“].*["”]$/.test(cleaned) || /^'.*'$/.test(cleaned)) {
    return cleaned;
  }

  return `“${cleaned}”`;
}

function beatContainsSpeech(text) {
  return /^([A-Z][A-Za-z\s'’-]{1,36}):\s+/.test(text) || /["“][\s\S]*["”]/.test(text);
}

function beatUsesAttributedDialogue(text, dialoguePayload) {
  const normalizedSource = String(text || "").trim();
  const normalizedDialogue = String(dialoguePayload?.text || "").trim();
  return Boolean(normalizedDialogue) && normalizedSource !== normalizedDialogue;
}

function getChapterFieldEntries(chapter, fieldPrefix) {
  return Object.entries(chapter?.fields || {})
    .filter(([key]) => key === fieldPrefix || key.startsWith(`${fieldPrefix}_`))
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .flatMap(([, value]) => listifyField(value));
}

function getSceneSpritesForChapter(chapter) {
  return getChapterSceneConfig(chapter).sprites || [];
}

function resolveSceneSpeakerName(sceneSprites, value) {
  const normalizedValue = normalizeSpeakerKey(value);
  if (!normalizedValue) {
    return "";
  }

  const matchedSprite = sceneSprites.find((sprite) =>
    buildSpeakerKeys(sprite.name || "")
      .concat((sprite.aliases || []).flatMap((alias) => buildSpeakerKeys(alias)))
      .includes(normalizedValue)
  );

  return matchedSprite?.name || String(value || "").trim();
}

function resolveSpeakerSideOverride(chapter, speakerName) {
  const speakerKey = normalizeSpeakerKey(speakerName);
  if (!speakerKey) {
    return "";
  }

  const sideEntries = getChapterFieldEntries(chapter, "vn_speaker_side_overrides");
  for (const entry of sideEntries) {
    const [fromSpeaker, sideValue] = entry.split("=>").map((part) => part?.trim() || "");
    if (!fromSpeaker || !sideValue) {
      continue;
    }

    const candidateKeys = buildSpeakerKeys(fromSpeaker);
    const normalizedSide = sideValue.toLowerCase();
    if (!candidateKeys.includes(speakerKey)) {
      continue;
    }

    if (normalizedSide === "left" || normalizedSide === "right") {
      return normalizedSide;
    }
  }

  return "";
}

function normalizeDialogueKey(value) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/[“”"]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function getDialogueOccurrence(chapter, beatIndex, dialogueText) {
  const dialogueKey = normalizeDialogueKey(dialogueText);
  if (!dialogueKey) {
    return 0;
  }

  let occurrence = 0;

  for (let index = 0; index <= beatIndex; index += 1) {
    const candidateBeat = chapter?.beats?.[index];
    if (candidateBeat?.mode !== "dialogue") {
      continue;
    }

    if (normalizeDialogueKey(candidateBeat.text) === dialogueKey) {
      occurrence += 1;
    }
  }

  return occurrence;
}

function resolveSpeakerOverride(chapter, beatIndex, dialogueText, sceneSprites) {
  const overrideEntries = getChapterFieldEntries(chapter, "vn_speaker_overrides");
  const dialogueKey = normalizeDialogueKey(dialogueText);
  const dialogueOccurrence = getDialogueOccurrence(chapter, beatIndex, dialogueText);

  if (!overrideEntries.length || !dialogueKey) {
    return "";
  }

  for (const entry of overrideEntries) {
    const [fromText, speakerName] = entry.split("=>").map((part) => part?.trim() || "");
    if (!fromText || !speakerName) {
      continue;
    }

    const occurrenceMatch = fromText.match(/^(.*?)(?:#(\d+))?$/);
    const sourceText = occurrenceMatch?.[1]?.trim() || fromText;
    const sourceOccurrence = Number(occurrenceMatch?.[2] || 1);

    if (
      normalizeDialogueKey(sourceText) === dialogueKey &&
      sourceOccurrence === dialogueOccurrence
    ) {
      return resolveSceneSpeakerName(sceneSprites, speakerName);
    }
  }

  return "";
}

function buildSpeakerKeys(value) {
  const normalized = normalizeSpeakerKey(value);
  if (!normalized) {
    return [];
  }

  const tokens = normalized.split(" ").filter(Boolean);
  const keys = new Set([normalized]);

  if (tokens.length >= 2) {
    keys.add(tokens.slice(-2).join(" "));
    keys.add(tokens[tokens.length - 1]);
  }

  if (tokens.length >= 3) {
    keys.add(`${tokens[0]} ${tokens[tokens.length - 1]}`);
  }

  return Array.from(keys).filter(Boolean);
}

function getSceneSpeakerMentions(text, sceneSprites) {
  const normalizedText = ` ${normalizeSpeakerKey(text)} `;

  return sceneSprites.filter((sprite) => {
    const keys = [sprite.name || "", ...(sprite.aliases || [])].flatMap((value) =>
      buildSpeakerKeys(value)
    );

    return keys.some((key) => normalizedText.includes(` ${key} `));
  });
}

function resolveUniqueSceneSpeaker(text, sceneSprites) {
  const matches = getSceneSpeakerMentions(text, sceneSprites);
  return matches.length === 1 ? matches[0].name : "";
}

function containsNonSceneCharacterMention(chapter, text, sceneSprites) {
  const normalizedText = ` ${normalizeSpeakerKey(text)} `;
  const sceneKeys = new Set(
    sceneSprites.flatMap((sprite) => [sprite.name || "", ...(sprite.aliases || [])]).flatMap(
      (value) => buildSpeakerKeys(value)
    )
  );

  return (chapter.characters || []).some((characterName) => {
    const characterKeys = buildSpeakerKeys(characterName).filter((key) => !sceneKeys.has(key));
    return characterKeys.some((key) => normalizedText.includes(` ${key} `));
  });
}

function resolveBeatSpeaker(chapter, beatIndex) {
  const beat = chapter?.beats?.[beatIndex];
  if (!chapter || !beat) {
    return "";
  }

  const sceneSprites = getSceneSpritesForChapter(chapter);
  const sourceText = beat.sourceText || beat.text;
  const dialoguePayload = extractDialoguePayload(sourceText);
  if (dialoguePayload.speaker) {
    return resolveSceneSpeakerName(sceneSprites, dialoguePayload.speaker);
  }

  if (!sceneSprites.length || !beatContainsSpeech(sourceText)) {
    return "";
  }

  const overrideSpeaker = resolveSpeakerOverride(chapter, beatIndex, beat.text, sceneSprites);
  if (overrideSpeaker) {
    return overrideSpeaker;
  }

  const currentSpeaker = resolveUniqueSceneSpeaker(sourceText, sceneSprites);
  if (currentSpeaker) {
    return currentSpeaker;
  }

  if (containsNonSceneCharacterMention(chapter, sourceText, sceneSprites)) {
    return "";
  }

  const offsets = beatUsesAttributedDialogue(sourceText, dialoguePayload)
    ? [-1, -2, 1, 2]
    : [-1, 1];

  for (const offset of offsets) {
    const nearbyBeat = chapter.beats[beatIndex + offset];
    if (!nearbyBeat || beatContainsSpeech(nearbyBeat.text)) {
      continue;
    }

    const nearbySpeaker = resolveUniqueSceneSpeaker(nearbyBeat.text, sceneSprites);
    if (nearbySpeaker) {
      return nearbySpeaker;
    }
  }

  return "";
}

function bindVNEvents(refs, state) {
  const resumeBGMIfEnabled = () => {
    if (!state.bgmEnabled) {
      return;
    }

    syncBGMToChapter(refs, state);
  };

  refs.mainMenuStart?.addEventListener("click", () => {
    startVNFromMainMenu(refs, state);
  });
  refs.mainMenuBgmToggle?.addEventListener("click", () => toggleBGM(refs, state));
  refs.mainMenuButton?.addEventListener("click", () => {
    showMainMenu(refs, state, { startChapterIndex: state.chapterIndex });
  });
  refs.mainMenuFullscreenToggle?.addEventListener("click", () => toggleFullscreen(refs));

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
  refs.logButton?.addEventListener("click", () => openVNLog(refs, state));
  refs.logClose?.addEventListener("click", () => closeVNLog(refs, state));
  refs.logBackdrop?.addEventListener("click", () => closeVNLog(refs, state));

  refs.stage?.addEventListener("click", (event) => {
    if (state.mainMenuOpen) {
      return;
    }

    if (event.target.closest("button")) {
      return;
    }

    if (state.introActive) {
      dismissChapterIntro(refs, state);
      return;
    }

    if (event.target.closest(".vn-controlbar__actions")) {
      return;
    }

    pauseAutoForManualInteraction(refs, state);
    advanceVN(refs, state);
  });

  document.addEventListener(
    "pointerdown",
    (event) => {
      if (
        event.target instanceof Element &&
        event.target.closest("#vn-bgm-toggle, #vn-main-menu-bgm-toggle")
      ) {
        return;
      }

      resumeBGMIfEnabled();
    },
    { passive: true }
  );

  document.addEventListener("fullscreenchange", () => {
    setFullscreenButtonState(refs);
  });

  document.addEventListener("keydown", (event) => {
    if (state.mainMenuOpen) {
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        startVNFromMainMenu(refs, state);
      }
      return;
    }

    if (state.introActive) {
      if (
        event.key === " " ||
        event.key === "Enter" ||
        event.key === "ArrowRight" ||
        event.key === "Escape"
      ) {
        event.preventDefault();
        dismissChapterIntro(refs, state);
      }
      return;
    }

    if (state.menuOpen) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeVNMenu(refs, state);
      }
      return;
    }

    if (state.logOpen) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeVNLog(refs, state);
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
      resumeBGMIfEnabled();
      pauseAutoForManualInteraction(refs, state);
      advanceVN(refs, state);
      return;
    }

    if (event.key === "ArrowLeft" || event.key === "Backspace") {
      event.preventDefault();
      resumeBGMIfEnabled();
      pauseAutoForManualInteraction(refs, state);
      retreatVN(refs, state);
      return;
    }

    if (event.key.toLowerCase() === "m") {
      event.preventDefault();
      resumeBGMIfEnabled();
      openVNMenu(refs, state);
      return;
    }

    if (event.key.toLowerCase() === "l") {
      event.preventDefault();
      resumeBGMIfEnabled();
      openVNLog(refs, state);
      return;
    }

    if (event.key.toLowerCase() === "s") {
      event.preventDefault();
      resumeBGMIfEnabled();
      setSkipState(refs, state, !state.skipAnimations);
      return;
    }

    if (event.key.toLowerCase() === "a") {
      event.preventDefault();
      resumeBGMIfEnabled();
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
  if (refs.mainMenu) {
    refs.mainMenu.hidden = true;
  }
  refs.shell?.classList.remove("is-main-menu");
  if (refs.introOverlay) {
    refs.introOverlay.classList.remove("is-visible");
    refs.introOverlay.hidden = true;
  }
  refs.title.textContent = "VN Simulator unavailable";
  refs.order.textContent = "Archive";
  applyTextboxSpeakerSide(refs, "");
  refs.textbox.hidden = true;
  refs.nameplate.hidden = true;
  refs.cursor.hidden = true;
  refs.narrationOverlay.hidden = false;
  refs.narrationText.dataset.mode = "system";
  refs.narrationText.textContent = message;
  refs.cursorNarration.hidden = true;
  updateActiveSpriteSpeaker(refs, "");
  refs.hint.innerHTML = "The VN simulator could not load chapter text.";
  refs.backButton.disabled = true;
  refs.nextButton.disabled = true;
  refs.mainMenuButton.disabled = true;
  refs.menuButton.disabled = true;
  refs.autoToggle.disabled = true;
  refs.bgmToggle.disabled = true;
  refs.skipToggle.disabled = true;
}

function forceCloseVNOverlays(refs, state) {
  state.menuOpen = false;
  state.logOpen = false;
  refs.menuPanel.hidden = true;
  refs.menuBackdrop.hidden = true;
  refs.logPanel.hidden = true;
  refs.logBackdrop.hidden = true;
  document.body.classList.remove("vn-menu-open");
}

function showMainMenu(refs, state, options = {}) {
  if (!state.chapters.length || !refs.mainMenu) {
    return;
  }

  clearVNAnimation(state);
  clearAutoAdvance(state);
  dismissChapterIntro(refs, state, true);
  forceCloseVNOverlays(refs, state);
  updateActiveSpriteSpeaker(refs, "");

  if (Number.isInteger(options.startChapterIndex)) {
    state.menuStartChapterIndex = Math.max(
      0,
      Math.min(state.chapters.length - 1, Number(options.startChapterIndex))
    );
  } else if (state.chapterIndex < state.chapters.length) {
    state.menuStartChapterIndex = state.chapterIndex;
  }

  state.mainMenuOpen = true;
  refs.shell?.classList.add("is-main-menu");
  refs.mainMenu.hidden = false;
  refs.mainMenu.classList.remove("is-visible");
  window.requestAnimationFrame(() => {
    refs.mainMenu?.classList.add("is-visible");
  });

  refs.textbox.hidden = true;
  refs.nameplate.hidden = true;
  refs.cursor.hidden = true;
  refs.narrationOverlay.hidden = true;
  refs.cursorNarration.hidden = true;
  refs.mainMenuStart?.focus();
  updateBGMButtonState(refs, state);
  if (state.bgmEnabled) {
    void syncBGMToChapter(refs, state);
  } else {
    fadeOutBGM(state, { pauseOnComplete: true });
  }
}

function hideMainMenu(refs, state) {
  state.mainMenuOpen = false;
  refs.shell?.classList.remove("is-main-menu");
  refs.mainMenu?.classList.remove("is-visible");
  if (refs.mainMenu) {
    refs.mainMenu.hidden = true;
  }
}

function startVNFromMainMenu(refs, state) {
  if (!state.chapters.length) {
    return;
  }

  const chapterIndex = Math.max(
    0,
    Math.min(state.chapters.length - 1, Number(state.menuStartChapterIndex) || 0)
  );
  hideMainMenu(refs, state);
  openChapter(refs, state, chapterIndex, 0);
}

function clearChapterIntroTimers(state) {
  if (state.introFadeTimer) {
    window.clearTimeout(state.introFadeTimer);
    state.introFadeTimer = null;
  }

  if (state.introHideTimer) {
    window.clearTimeout(state.introHideTimer);
    state.introHideTimer = null;
  }
}

function finishChapterIntro(refs, state) {
  clearChapterIntroTimers(state);

  if (refs.introOverlay) {
    refs.introOverlay.classList.remove("is-visible");
    refs.introOverlay.hidden = true;
  }

  state.introActive = false;
  const resolve = state.introResolve;
  state.introResolve = null;
  if (typeof resolve === "function") {
    resolve();
  }
}

function dismissChapterIntro(refs, state, immediate = false) {
  if (!refs.introOverlay) {
    return;
  }

  if (!state.introActive && refs.introOverlay.hidden) {
    return;
  }

  clearChapterIntroTimers(state);

  if (immediate || state.skipAnimations) {
    finishChapterIntro(refs, state);
    return;
  }

  refs.introOverlay.classList.remove("is-visible");
  state.introHideTimer = window.setTimeout(() => {
    finishChapterIntro(refs, state);
  }, VN_CHAPTER_INTRO_FADE_MS);
}

function playChapterIntro(refs, state, chapter) {
  if (!refs.introOverlay || !refs.introOrder || !refs.introTitle) {
    return Promise.resolve();
  }

  dismissChapterIntro(refs, state, true);

  refs.introOrder.textContent = `Chronology ${window.DivineChamber.orderLabel(chapter)}`;
  refs.introTitle.textContent = chapter.title;
  refs.textbox.hidden = true;
  refs.nameplate.hidden = true;
  refs.cursor.hidden = true;
  refs.narrationOverlay.hidden = true;
  refs.cursorNarration.hidden = true;
  updateActiveSpriteSpeaker(refs, "");
  refs.introOverlay.hidden = false;
  refs.introOverlay.classList.remove("is-visible");
  state.introActive = true;

  return new Promise((resolve) => {
    state.introResolve = resolve;

    window.requestAnimationFrame(() => {
      refs.introOverlay?.classList.add("is-visible");
    });

    state.introFadeTimer = window.setTimeout(() => {
      dismissChapterIntro(refs, state);
    }, state.skipAnimations ? 360 : VN_CHAPTER_INTRO_VISIBLE_MS);
  });
}

async function openChapter(refs, state, chapterIndex, beatIndex = 0) {
  const boundedChapterIndex = Math.max(0, Math.min(state.chapters.length - 1, chapterIndex));
  const chapter = state.chapters[boundedChapterIndex];
  if (!chapter) {
    return;
  }

  hideMainMenu(refs, state);
  const openToken = ++state.openToken;
  clearVNAnimation(state);
  clearAutoAdvance(state);
  dismissChapterIntro(refs, state, true);

  const isChapterChange = boundedChapterIndex !== state.chapterIndex;

  state.archiveEnded = false;
  state.chapterIndex = boundedChapterIndex;
  state.beatIndex = Math.max(0, Math.min(chapter.beats.length - 1, beatIndex));
  const shouldShowIntro = state.beatIndex === 0;

  const finalizeOpen = async () => {
    updateChapterScene(refs, chapter);
    updateChapterMenuSelection(refs, state);
    updateChapterUrl(chapter.id);
    await syncBGMToChapter(refs, state);

    if (state.openToken !== openToken) {
      return;
    }

    if (shouldShowIntro) {
      await playChapterIntro(refs, state, chapter);
      if (state.openToken !== openToken) {
        return;
      }
    }

    renderCurrentBeat(refs, state);
  };

  if (isChapterChange && refs.stage) {
    refs.stage.classList.add("is-transitioning");
    window.setTimeout(async () => {
      if (state.openToken !== openToken) {
        refs.stage.classList.remove("is-transitioning");
        return;
      }

      refs.stage.classList.remove("is-transitioning");
      await finalizeOpen();
    }, 280);
  } else {
    await finalizeOpen();
  }
}

function updateChapterScene(refs, chapter) {
  refs.order.textContent = `Chronology ${window.DivineChamber.orderLabel(chapter)}`;
  refs.title.textContent = chapter.title;

  const hue = 200 + (chapter.index * 19) % 60;
  refs.stage.style.setProperty("--vn-accent", `hsla(${hue}, 78%, 62%, 0.28)`);
  refs.stage.style.setProperty("--vn-accent-strong", `hsla(${hue}, 82%, 58%, 0.46)`);
  refs.stage.style.setProperty("--vn-accent-soft", `hsla(${hue}, 80%, 72%, 0.12)`);
  applyChapterSceneArt(refs, chapter);
  const configuredScene = getChapterSceneConfig(chapter);

  const spriteNames = chapter.characters?.length
    ? chapter.characters.slice(0, 2)
    : chapter.beats.some((beat) => beat.mode === "dialogue")
      ? ["Speaker A", "Speaker B"]
      : ["Stage Left", "Stage Right"];

  if (configuredScene?.sprites?.length) {
    setSpriteSlot(refs.spriteLeft, configuredScene.sprites[0] || null);
    setSpriteSlot(refs.spriteRight, configuredScene.sprites[1] || null);
    return;
  }

  setSpriteSlot(refs.spriteLeft, {
    name: spriteNames[0] || "Stage Left",
    role: "Placeholder",
    src: "",
  });
  setSpriteSlot(refs.spriteRight, {
    name: spriteNames[1] || "Stage Right",
    role: "Placeholder",
    src: "",
  });
}

function applyChapterSceneArt(refs, chapter) {
  const configuredScene = getChapterSceneConfig(chapter);
  const backdrop = configuredScene?.backdrop || "media/bg.png";
  const opacity = configuredScene?.backdrop ? "0.76" : "0.5";
  refs.stage.style.setProperty("--vn-stage-art", `url("${backdrop}")`);
  refs.stage.style.setProperty("--vn-stage-art-opacity", opacity);
}

function setSpriteSlot(node, sprite) {
  if (!node) {
    return;
  }

  const normalizedSprite = sprite || {};
  const artNode = node.querySelector(".vn-sprite__art");
  const hasArt = Boolean(normalizedSprite.src);

  node.classList.toggle("has-art", hasArt);
  node.classList.remove("is-speaking");
  node.dataset.spriteKeys = (normalizedSprite.aliases || [normalizedSprite.name || ""])
    .map((value) => normalizeSpeakerKey(value))
    .filter(Boolean)
    .join("|");

  if (artNode) {
    if (hasArt) {
      artNode.hidden = false;
      artNode.src = normalizedSprite.src;
      artNode.alt = normalizedSprite.name || "";
    } else {
      artNode.hidden = true;
      artNode.removeAttribute("src");
      artNode.alt = "";
    }
  }
}

function normalizeSpeakerKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveSpeakerSide(chapter, refs, speakerName) {
  const speakerKey = normalizeSpeakerKey(speakerName);
  if (!speakerKey) {
    return "";
  }

  const overrideSide = resolveSpeakerSideOverride(chapter, speakerName);
  if (overrideSide) {
    return overrideSide;
  }

  const leftKeys = (refs.spriteLeft?.dataset.spriteKeys || "").split("|").filter(Boolean);
  if (leftKeys.includes(speakerKey)) {
    return "left";
  }

  const rightKeys = (refs.spriteRight?.dataset.spriteKeys || "").split("|").filter(Boolean);
  if (rightKeys.includes(speakerKey)) {
    return "right";
  }

  return "";
}

function applyTextboxSpeakerSide(refs, side) {
  if (!refs.textbox) {
    return;
  }

  refs.textbox.classList.toggle("is-speaker-left", side === "left");
  refs.textbox.classList.toggle("is-speaker-right", side === "right");
}

function updateActiveSpriteSpeaker(refs, speakerName) {
  const speakerKey = normalizeSpeakerKey(speakerName);

  [refs.spriteLeft, refs.spriteRight].forEach((node) => {
    if (!node) {
      return;
    }

    const spriteKeys = (node.dataset.spriteKeys || "").split("|").filter(Boolean);
    const isSpeaking = Boolean(speakerKey) && spriteKeys.includes(speakerKey);
    node.classList.toggle("is-speaking", isSpeaking);
  });
}

function renderCurrentBeat(refs, state) {
  const chapter = state.chapters[state.chapterIndex];
  const beat = chapter?.beats?.[state.beatIndex];
  if (!chapter || !beat) {
    return;
  }

  clearAutoAdvance(state);
  state.archiveEnded = false;
  const dialoguePayload = beat.mode === "dialogue" ? extractDialoguePayload(beat.text) : null;
  const resolvedSpeaker = resolveBeatSpeaker(chapter, state.beatIndex);
  const displayText = dialoguePayload ? formatDialogueDisplayText(dialoguePayload.text) : beat.text;
  const narrationSteps = beat.mode === "narration" ? buildNarrationStepTexts(displayText) : [];
  const visibleText = narrationSteps[0] || displayText;
  const progressLabel = `${state.beatIndex + 1} / ${chapter.beats.length}`;

  state.currentMode = beat.mode;
  state.currentText = visibleText;
  state.narrationSteps = narrationSteps;
  state.narrationStepIndex = 0;

  // For unattributed dialogue (e.g. The Interview's anonymous voices), show a generic "Voice" label
  const displaySpeaker = resolvedSpeaker || (beat.mode === "dialogue" ? "Voice" : "");
  const speakerSide = resolveSpeakerSide(chapter, refs, displaySpeaker);

  // Push to log (keep last 60 entries)
  state.log.unshift({ mode: beat.mode, speaker: displaySpeaker, text: visibleText });
  if (state.log.length > 60) {
    state.log.length = 60;
  }

  if (refs.progress) {
    refs.progress.textContent = progressLabel;
  }

  if (beat.mode === "dialogue") {
    // Bottom panel for dialogue
    refs.narrationOverlay.hidden = true;
    refs.narrationText.textContent = "";
    refs.cursorNarration.hidden = true;
    refs.textbox.hidden = false;
    refs.textboxText.dataset.mode = beat.mode;
    refs.textboxText.textContent = "";
    refs.cursor.hidden = true;
    if (displaySpeaker) {
      refs.nameplate.hidden = false;
      refs.nameplate.textContent = displaySpeaker;
    } else {
      refs.nameplate.hidden = true;
      refs.nameplate.textContent = "";
    }
    applyTextboxSpeakerSide(refs, speakerSide);
    state.currentTarget = refs.textboxText;
  } else {
    // Narration overlay for narration/system/echo
    applyTextboxSpeakerSide(refs, "");
    refs.textbox.hidden = true;
    refs.textboxText.textContent = "";
    refs.cursor.hidden = true;
    refs.nameplate.hidden = true;
    refs.narrationOverlay.hidden = false;
    refs.narrationText.dataset.mode = beat.mode;
    refs.narrationText.textContent = "";
    refs.cursorNarration.hidden = true;
    state.currentTarget = refs.narrationText;
  }

  updateActiveSpriteSpeaker(refs, resolvedSpeaker);
  updateHint(refs, state);
  playVNBeatText(refs, state, visibleText);
}

function playVNBeatText(refs, state, text, options = {}) {
  clearVNAnimation(state);
  state.currentText = text;

  const activeCursor = state.currentMode === "dialogue" ? refs.cursor : refs.cursorNarration;
  const startIndex = Math.max(0, Math.min(Number(options.startIndex) || 0, text.length));

  if (state.skipAnimations) {
    renderCurrentText(refs, state, text);
    state.isAnimating = false;
    if (activeCursor) activeCursor.hidden = false;
    updateVNActionLabels(refs, state);
    queueAutoAdvance(refs, state);
    return;
  }

  state.isAnimating = true;
  if (activeCursor) activeCursor.hidden = true;
  updateVNActionLabels(refs, state);
  let index = startIndex;

  if (startIndex > 0) {
    renderCurrentText(refs, state, text.slice(0, startIndex));
  }

  const tick = () => {
    renderCurrentText(refs, state, text.slice(0, index + 1));
    index += 1;

    if (index >= text.length) {
      state.isAnimating = false;
      state.animationTimer = null;
      if (activeCursor) activeCursor.hidden = false;
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
  const maxDelay = beat.mode === "dialogue" ? 6200 : 12000;
  const delay = Math.max(
    1400,
    Math.min(maxDelay, baseDelay + state.currentText.length * perCharacterDelay)
  );

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

function hasMoreNarrationSteps(state) {
  return (
    state.currentMode === "narration" &&
    Array.isArray(state.narrationSteps) &&
    state.narrationStepIndex < state.narrationSteps.length - 1
  );
}

function advanceNarrationStep(refs, state) {
  if (!hasMoreNarrationSteps(state)) {
    return false;
  }

  const previousText = state.currentText || "";
  state.narrationStepIndex += 1;
  const nextText = state.narrationSteps[state.narrationStepIndex] || "";

  if (state.log[0]?.mode === "narration") {
    state.log[0].text = nextText;
  }

  playVNBeatText(refs, state, nextText, { startIndex: previousText.length });
  return true;
}

function retreatNarrationStep(refs, state) {
  if (
    state.currentMode !== "narration" ||
    !Array.isArray(state.narrationSteps) ||
    state.narrationStepIndex <= 0
  ) {
    return false;
  }

  state.narrationStepIndex -= 1;
  state.currentText = state.narrationSteps[state.narrationStepIndex] || "";
  renderCurrentText(refs, state, state.currentText);

  if (state.log[0]?.mode === "narration") {
    state.log[0].text = state.currentText;
  }

  updateVNActionLabels(refs, state);
  return true;
}

function advanceVN(refs, state, options = {}) {
  if (!state.chapters.length) {
    return;
  }

  clearAutoAdvance(state);

  if (state.isAnimating) {
    clearVNAnimation(state);
    renderCurrentText(refs, state, state.currentText);
    const activeCursor = state.currentMode === "dialogue" ? refs.cursor : refs.cursorNarration;
    if (activeCursor) activeCursor.hidden = false;
    updateVNActionLabels(refs, state);
    if (state.autoAdvance && !options.automated) {
      queueAutoAdvance(refs, state);
    }
    return;
  }

  if (advanceNarrationStep(refs, state)) {
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

  state.archiveEnded = true;
  applyTextboxSpeakerSide(refs, "");
  refs.textbox.hidden = true;
  refs.nameplate.hidden = true;
  refs.cursor.hidden = true;
  refs.narrationOverlay.hidden = false;
  refs.narrationText.dataset.mode = "system";
  refs.narrationText.textContent =
    "End of the currently loaded chapter archive. Add more chapter text and the simulator will continue from here.";
  refs.cursorNarration.hidden = true;
  if (refs.progress) {
    refs.progress.textContent = `${chapter.beats.length} / ${chapter.beats.length}`;
  }
  updateActiveSpriteSpeaker(refs, "");
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
    renderCurrentText(refs, state, state.currentText);
    updateVNActionLabels(refs, state);
    return;
  }

  if (state.archiveEnded) {
    state.archiveEnded = false;
    renderCurrentBeat(refs, state);
    return;
  }

  if (retreatNarrationStep(refs, state)) {
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

  refs.backButton.disabled =
    state.chapterIndex === 0 &&
    state.beatIndex === 0 &&
    !(state.currentMode === "narration" && state.narrationStepIndex > 0);

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

  if (hasMoreNarrationSteps(state)) {
    refs.nextButton.textContent = "Advance";
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
      'Auto mode is active. Press <kbd>A</kbd> to pause, <kbd>B</kbd> for music, <kbd>S</kbd> to skip typing, or click to take over manually.';
    return;
  }

  refs.hint.innerHTML =
    'Click or press <kbd>Space</kbd> to advance. <kbd>A</kbd> auto · <kbd>B</kbd> bgm · <kbd>L</kbd> log · <kbd>F</kbd> fullscreen.';
}

function renderCurrentText(refs, state, text) {
  if (!state.currentTarget) {
    return;
  }

  if (state.currentTarget === refs.narrationText && state.currentMode === "narration") {
    renderNarrationText(state.currentTarget, text);
    return;
  }

  state.currentTarget.textContent = text;
}

function renderNarrationText(target, text) {
  if (!target) {
    return;
  }

  const normalized = String(text || "").replace(/\r\n/g, "\n").trim();
  target.innerHTML = "";

  if (!normalized) {
    return;
  }

  const paragraphs = normalized.split(/\n\s*\n+/).filter(Boolean);
  const sourceParagraphs = paragraphs.length ? paragraphs : [normalized];

  sourceParagraphs.forEach((paragraph) => {
    const paragraphNode = document.createElement("p");
    paragraphNode.className = "vn-text__paragraph";
    paragraphNode.textContent = paragraph.replace(/\n+/g, " ").trim();
    target.appendChild(paragraphNode);
  });
}

// fitNarrationText is no longer needed — narration box is now bottom-anchored and flows naturally.
function fitNarrationText() {}

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
    renderCurrentText(refs, state, state.currentText);
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
  const hasTrack = Boolean(resolveCurrentBGMTrack(state));
  const audio = state.bgmEngine?.audio || null;

  if (state.bgmEnabled && hasTrack && (!audio || audio.paused)) {
    await syncBGMToChapter(refs, state);
    return;
  }

  const nextValue = !state.bgmEnabled;
  state.bgmEnabled = nextValue;
  persistBGMPreference(nextValue);
  updateBGMButtonState(refs, state);

  if (!nextValue) {
    fadeOutBGM(state, { pauseOnComplete: true });
    return;
  }

  const engine = await ensureBGMAudio(state);
  if (!engine) {
    state.bgmEnabled = false;
    persistBGMPreference(false);
    updateBGMButtonState(refs, state);
    return;
  }

  await syncBGMToChapter(refs, state);
}

async function ensureBGMAudio(state) {
  if (state.bgmEngine) {
    return state.bgmEngine;
  }

  const audio = new Audio();
  audio.loop = true;
  audio.preload = "auto";
  audio.volume = 0.0001;

  state.bgmEngine = {
    audio,
    currentTrack: "",
    fadeFrame: null,
  };

  return state.bgmEngine;
}

function resolveChapterBGM(chapter) {
  return getChapterSceneConfig(chapter).bgmTrack || "";
}

function resolveCurrentBGMTrack(state) {
  if (state.mainMenuOpen) {
    return VN_MAIN_MENU_BGM_TRACK;
  }

  const chapter = state.chapters[state.chapterIndex];
  return chapter ? resolveChapterBGM(chapter) : "";
}

function updateBGMButtonState(refs, state) {
  if (!refs.bgmToggle && !refs.mainMenuBgmToggle) {
    return;
  }

  const hasTrack = Boolean(resolveCurrentBGMTrack(state));
  const label = !state.bgmEnabled ? "BGM" : hasTrack ? "BGM On" : "BGM Ready";
  const title = state.mainMenuOpen
    ? hasTrack
      ? "Toggle main menu background music"
      : "No track is assigned to the main menu yet."
    : hasTrack
      ? "Toggle chapter background music"
      : "No track is assigned to this chapter yet. Leaving BGM on will resume playback when a chapter track exists.";

  [refs.bgmToggle, refs.mainMenuBgmToggle].forEach((button) => {
    if (!button) {
      return;
    }

    button.disabled = !state.chapters.length && !state.mainMenuOpen;
    button.setAttribute("aria-pressed", String(state.bgmEnabled));
    button.classList.toggle("is-active", state.bgmEnabled);
    button.textContent = label;
    button.title = title;
  });
}

async function syncBGMToChapter(refs, state) {
  updateBGMButtonState(refs, state);

  if (!state.bgmEnabled) {
    return;
  }

  const track = resolveCurrentBGMTrack(state);
  const engine = await ensureBGMAudio(state);
  if (!engine) {
    return;
  }

  const { audio } = engine;
  if (!track) {
    fadeOutBGM(state, { pauseOnComplete: true });
    return;
  }

  const trackUrl = new URL(track, window.location.href).href;
  if (engine.currentTrack !== trackUrl) {
    clearBGMFade(state);
    audio.pause();
    audio.src = track;
    audio.currentTime = 0;
    audio.volume = 0.0001;
    engine.currentTrack = trackUrl;
  }

  try {
    await audio.play();
    fadeInBGM(state);
  } catch (error) {
    console.warn("Unable to start VN chapter music", error);
  }
}

function clearBGMFade(state) {
  if (!state.bgmEngine) {
    return;
  }

  if (state.bgmEngine.fadeFrame) {
    window.cancelAnimationFrame(state.bgmEngine.fadeFrame);
    state.bgmEngine.fadeFrame = null;
  }
}

function fadeBGMVolume(state, targetVolume, duration, options = {}) {
  if (!state.bgmEngine) {
    return;
  }

  const { audio } = state.bgmEngine;
  clearBGMFade(state);

  const startVolume = Number.isFinite(audio.volume) ? audio.volume : 0.0001;
  const startedAt = performance.now();

  const tick = (timestamp) => {
    const progress = Math.min(1, (timestamp - startedAt) / duration);
    audio.volume = startVolume + (targetVolume - startVolume) * progress;

    if (progress >= 1) {
      state.bgmEngine.fadeFrame = null;
      audio.volume = targetVolume;

      if (options.pauseOnComplete) {
        audio.pause();
      }
      return;
    }

    state.bgmEngine.fadeFrame = window.requestAnimationFrame(tick);
  };

  state.bgmEngine.fadeFrame = window.requestAnimationFrame(tick);
}

function fadeInBGM(state) {
  fadeBGMVolume(state, 0.18, 1200);
}

function fadeOutBGM(state, options = {}) {
  fadeBGMVolume(state, 0.0001, 700, options);
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
  [refs.fullscreenToggle, refs.mainMenuFullscreenToggle].forEach((button) => {
    if (!button) {
      return;
    }

    button.setAttribute("aria-pressed", String(isFullscreen));
    button.classList.toggle("is-active", isFullscreen);
    button.textContent = isFullscreen ? "Exit Fullscreen" : "Fullscreen";
  });
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

function openVNLog(refs, state) {
  clearAutoAdvance(state);
  state.logOpen = true;
  renderLogPanel(refs, state);
  refs.logPanel.hidden = false;
  refs.logBackdrop.hidden = false;
  document.body.classList.add("vn-menu-open");
  refs.logClose?.focus();
}

function closeVNLog(refs, state) {
  state.logOpen = false;
  refs.logPanel.hidden = true;
  refs.logBackdrop.hidden = true;
  document.body.classList.remove("vn-menu-open");
  refs.logButton?.focus();

  if (state.autoAdvance && !state.isAnimating) {
    queueAutoAdvance(refs, state);
  }
}

function renderLogPanel(refs, state) {
  if (!refs.logList) {
    return;
  }

  if (!state.log.length) {
    refs.logList.innerHTML =
      '<p class="page-copy" style="color:var(--ink-soft);margin:0">No beats recorded yet.</p>';
    return;
  }

  refs.logList.innerHTML = state.log
    .map((entry) => {
      const modePill = `<span class="vn-mode-pill" data-mode="${window.DivineChamber.escapeHtml(entry.mode)}">${window.DivineChamber.escapeHtml(entry.mode === "dialogue" ? "Dialogue" : entry.mode === "echo" ? "Echo" : entry.mode === "system" ? "Note" : "Narration")}</span>`;
      const speaker = entry.speaker
        ? `<span class="vn-log-entry__speaker">${window.DivineChamber.escapeHtml(entry.speaker)}</span>`
        : "";
      return `
        <div class="vn-log-entry">
          <div class="vn-log-entry__meta">${modePill}${speaker}</div>
          <p class="vn-log-entry__text">${window.DivineChamber.escapeHtml(entry.text)}</p>
        </div>`;
    })
    .join("");
}

function updateChapterUrl(chapterId) {
  const url = new URL(window.location.href);
  url.searchParams.set("chapter", chapterId);
  window.history.replaceState({}, "", url);
}
