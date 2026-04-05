const aboutThemes = document.getElementById("about-themes");

if (aboutThemes) {
  initializeAbout();
}

async function initializeAbout() {
  const { entries } = await window.DivineChamber.fetchManifest();
  const themes = window.DivineChamber.byChronology(
    entries.filter((entry) => entry.type === "theme")
  );

  aboutThemes.innerHTML = themes
    .map((entry) =>
      window.DivineChamber.renderEntryCard(entry, {
        buttonLabel: "Read Theme",
      })
    )
    .join("");
}
