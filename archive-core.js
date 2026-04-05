window.DivineChamber = (() => {
  const manifestPath = "content/library-manifest.json";
  let manifestPromise;

  const TYPE_LABELS = {
    chapter: "Chapter",
    scene: "Scene",
    play: "Play",
    case: "Case File",
    dossier: "Dossier",
    world: "World File",
    note: "Note",
    theme: "Theme",
  };

  const FACET_LABELS = {
    chamber: "From the Chamber",
    bureau: "From the Bureau",
    world: "World Context",
    meta: "Development",
  };

  const STATUS_LABELS = {
    draft: "Draft",
    "in-progress": "In Progress",
    canon: "Canon",
    final: "Final",
    working: "Working",
  };

  async function fetchManifest() {
    if (!manifestPromise) {
      manifestPromise = fetch(manifestPath).then((response) => {
        if (!response.ok) {
          throw new Error(`Manifest request failed with ${response.status}`);
        }
        return response.json();
      });
    }

    return manifestPromise;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatType(type) {
    return TYPE_LABELS[type] || sentenceCase(type || "entry");
  }

  function formatFacet(facet) {
    return FACET_LABELS[facet] || sentenceCase(facet || "archive");
  }

  function formatStatus(status) {
    return STATUS_LABELS[status] || sentenceCase(status || "working");
  }

  function sentenceCase(value) {
    if (!value) {
      return "";
    }

    return String(value)
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (character) => character.toUpperCase());
  }

  function entryUrl(entry) {
    return `reader.html?id=${encodeURIComponent(entry.id)}`;
  }

  function orderLabel(entry) {
    const order = entry.chronology || entry.order;
    if (!order || order === 999) {
      return "Unordered";
    }
    return `#${String(order).padStart(2, "0")}`;
  }

  function byChronology(entries) {
    return [...entries].sort((left, right) => {
      const leftChronology = left.chronology || 999;
      const rightChronology = right.chronology || 999;

      if (leftChronology !== rightChronology) {
        return leftChronology - rightChronology;
      }

      return left.title.localeCompare(right.title);
    });
  }

  function stripFrontMatter(markdown) {
    if (!markdown.startsWith("---\n")) {
      return markdown;
    }

    const endIndex = markdown.indexOf("\n---", 4);
    if (endIndex === -1) {
      return markdown;
    }

    return markdown.slice(endIndex + 4).trimStart();
  }

  function renderInline(text) {
    const escaped = escapeHtml(text);
    return escaped
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>");
  }

  function renderMarkdown(markdown) {
    const cleaned = stripFrontMatter(markdown).replace(/\r\n/g, "\n");
    const lines = cleaned.split("\n");
    const html = [];
    let paragraph = [];
    let listType = null;

    const flushParagraph = () => {
      if (!paragraph.length) {
        return;
      }

      html.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
      paragraph = [];
    };

    const closeList = () => {
      if (!listType) {
        return;
      }

      html.push(listType === "ul" ? "</ul>" : "</ol>");
      listType = null;
    };

    lines.forEach((rawLine) => {
      const line = rawLine.trim();

      if (!line) {
        flushParagraph();
        closeList();
        return;
      }

      const headingMatch = line.match(/^(#{1,4})\s+(.*)$/);
      if (headingMatch) {
        flushParagraph();
        closeList();
        const level = headingMatch[1].length;
        html.push(`<h${level}>${renderInline(headingMatch[2])}</h${level}>`);
        return;
      }

      if (/^---+$/.test(line) || /^\*\*\*+$/.test(line)) {
        flushParagraph();
        closeList();
        html.push("<hr />");
        return;
      }

      const blockquoteMatch = line.match(/^>\s?(.*)$/);
      if (blockquoteMatch) {
        flushParagraph();
        closeList();
        html.push(`<blockquote>${renderInline(blockquoteMatch[1])}</blockquote>`);
        return;
      }

      const unorderedMatch = line.match(/^[-*]\s+(.*)$/);
      if (unorderedMatch) {
        flushParagraph();
        if (listType !== "ul") {
          closeList();
          html.push("<ul>");
          listType = "ul";
        }
        html.push(`<li>${renderInline(unorderedMatch[1])}</li>`);
        return;
      }

      const orderedMatch = line.match(/^\d+\.\s+(.*)$/);
      if (orderedMatch) {
        flushParagraph();
        if (listType !== "ol") {
          closeList();
          html.push("<ol>");
          listType = "ol";
        }
        html.push(`<li>${renderInline(orderedMatch[1])}</li>`);
        return;
      }

      closeList();
      paragraph.push(line);
    });

    flushParagraph();
    closeList();

    return html.join("");
  }

  function renderBadges(entry, options = {}) {
    const badges = [];

    if (options.showType !== false) {
      badges.push(`<span class="meta-pill">${formatType(entry.type)}</span>`);
    }
    if (options.showFacet !== false) {
      badges.push(
        `<span class="meta-pill meta-pill--facet meta-pill--${entry.facet}">${formatFacet(
          entry.facet
        )}</span>`
      );
    }
    if (options.showStatus !== false) {
      badges.push(`<span class="meta-pill">${formatStatus(entry.status)}</span>`);
    }

    return badges.join("");
  }

  function renderCharacterChips(entry, options = {}) {
    if (!entry.characters?.length) {
      return "";
    }

    const maxCharacters = options.maxCharacters ?? 3;
    const visibleCharacters = entry.characters.slice(0, maxCharacters);
    const hiddenCount = entry.characters.length - visibleCharacters.length;

    return `
      <div class="chip-row chip-row--quiet">
        ${visibleCharacters
          .map((character) => `<span class="soft-chip">${escapeHtml(character)}</span>`)
          .join("")}
        ${
          hiddenCount > 0
            ? `<span class="soft-chip">+${hiddenCount} more</span>`
            : ""
        }
      </div>
    `;
  }

  function renderEntryCard(entry, options = {}) {
    const buttonLabel = options.buttonLabel || "Open file";
    const eyebrow = options.eyebrow || "";
    const showStatus = options.showStatus ?? false;
    const metaLine = [];

    if (entry.status && !showStatus && !["canon", "final"].includes(entry.status)) {
      metaLine.push(`<span>${escapeHtml(formatStatus(entry.status))}</span>`);
    }
    if (entry.case_name) {
      metaLine.push(`<span>${escapeHtml(entry.case_name)}</span>`);
    }
    if (entry.chronology && entry.chronology !== 999) {
      metaLine.push(`<span>Chronology ${escapeHtml(orderLabel(entry))}</span>`);
    }
    if (entry.fields?.role) {
      metaLine.push(`<span>${escapeHtml(entry.fields.role)}</span>`);
    }

    return `
      <article class="archive-card archive-card--${escapeHtml(entry.template)} archive-card--${escapeHtml(
        entry.facet
      )}">
        <div class="archive-card__meta">
          <div class="chip-row">
            ${renderBadges(entry, {
              showType: options.showType,
              showFacet: options.showFacet,
              showStatus,
            })}
          </div>
          ${eyebrow ? `<p class="archive-card__eyebrow">${escapeHtml(eyebrow)}</p>` : ""}
        </div>
        <h2 class="archive-card__title">${escapeHtml(entry.title)}</h2>
        <p class="archive-card__summary">${escapeHtml(entry.summary || "No summary provided yet.")}</p>
        ${renderCharacterChips(entry, { maxCharacters: options.maxCharacterChips })}
        ${
          metaLine.length
            ? `<div class="archive-card__line">${metaLine.join("<span class=\"divider-dot\"></span>")}</div>`
            : ""
        }
        <div class="archive-card__footer">
          <a class="btn btn-outline-light btn-sm" href="${entryUrl(entry)}">${buttonLabel}</a>
        </div>
      </article>
    `;
  }

  function getRelatedEntries(entries, currentEntry, limit = 4) {
    return entries
      .filter((entry) => entry.id !== currentEntry.id)
      .map((entry) => {
        let score = 0;

        if (currentEntry.case && entry.case === currentEntry.case) {
          score += 5;
        }
        if (entry.type === currentEntry.type) {
          score += 2;
        }
        if (entry.facet === currentEntry.facet) {
          score += 1;
        }

        const currentCharacters = new Set(currentEntry.characters || []);
        const currentTags = new Set(currentEntry.tags || []);

        score += (entry.characters || []).filter((character) => currentCharacters.has(character)).length;
        score += (entry.tags || []).filter((tag) => currentTags.has(tag)).length;

        return { entry, score };
      })
      .filter((item) => item.score > 0)
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }
        return (left.entry.chronology || 999) - (right.entry.chronology || 999);
      })
      .slice(0, limit)
      .map((item) => item.entry);
  }

  function findPrevNext(entries, currentEntry) {
    const pool = byChronology(entries.filter((entry) => entry.type === currentEntry.type));
    const index = pool.findIndex((entry) => entry.id === currentEntry.id);
    return {
      previous: index > 0 ? pool[index - 1] : null,
      next: index >= 0 && index < pool.length - 1 ? pool[index + 1] : null,
    };
  }

  return {
    fetchManifest,
    escapeHtml,
    formatType,
    formatFacet,
    formatStatus,
    orderLabel,
    byChronology,
    renderMarkdown,
    renderBadges,
    renderEntryCard,
    getRelatedEntries,
    findPrevNext,
    entryUrl,
    sentenceCase,
  };
})();
