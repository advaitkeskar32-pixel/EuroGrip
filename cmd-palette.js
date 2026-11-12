/**
 * Universal Command Palette (⌘K / Ctrl+K)
 * Startup-grade keyboard-first navigation and rapid action runner.
 */

(function () {
  const COMMANDS = [
    { title: "AI Lab — K-Means Rider Clustering", cat: "Machine Learning", url: "intelligence.html#clustering", hint: "Unsupervised cohort grouping" },
    { title: "AI Lab — Gradient Descent Budget MMM", cat: "Machine Learning", url: "intelligence.html#optimizer", hint: "Hill saturation solver" },
    { title: "AI Lab — Fleet Wear & Puncture Risk", cat: "Machine Learning", url: "intelligence.html#risk", hint: "Logistic RUL predictor" },
    { title: "AI Lab — Neural Fit Vector Recommender", cat: "Machine Learning", url: "intelligence.html#recommender", hint: "Cosine similarity fit" },
    { title: "Campaign Control Room & Workspace", cat: "Planning", url: "workspace.html", hint: "Scenario modeling & forecasting" },
    { title: "Rider Segments Deep Dive", cat: "Strategy", url: "segments.html", hint: "Commuter, Gig worker, Premium" },
    { title: "Annual Investment & Budget Mix", cat: "Finance", url: "budget.html", hint: "₹60 Cr allocation breakdown" },
    { title: "12-Month Rollout Roadmap", cat: "Execution", url: "roadmap.html", hint: "Chennai, Bengaluru & 10 cities" },
    { title: "The Strategic Challenge", cat: "Strategy", url: "challenge.html", hint: "One brand, three roads" },
    { title: "Executive Home / Pitch Deck", cat: "Overview", url: "index.html", hint: "Executive summary" },
    { title: "Export Campaign Brief", cat: "Action", action: "exportBrief", hint: "Download text summary" },
    { title: "Open Sources & Methodology", cat: "Action", action: "openSources", hint: "NSE release, Storyboard18" }
  ];

  let selectedIndex = 0;
  let filteredCommands = [...COMMANDS];

  function createPaletteDOM() {
    if (document.getElementById("command-palette")) return;

    const dialog = document.createElement("dialog");
    dialog.className = "palette-dialog";
    dialog.id = "command-palette";
    dialog.setAttribute("aria-labelledby", "palette-input");
    dialog.innerHTML = `
      <div class="palette-box">
        <div class="palette-search-row">
          <span class="search-icon">✦</span>
          <input type="text" id="palette-input" placeholder="What would you like to do? Search tools, pages, or prompts…" autocomplete="off" spellcheck="false">
          <kbd class="esc-kbd">ESC</kbd>
        </div>
        <div class="palette-results" id="palette-results" role="listbox"></div>
        <div class="palette-footer">
          <span>Use <b>↑</b> <b>↓</b> to navigate</span>
          <span><b>↵</b> to execute</span>
          <span><b>ESC</b> to close</span>
        </div>
      </div>
    `;
    document.body.appendChild(dialog);

    // Event listeners
    const input = dialog.querySelector("#palette-input");
    input.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase().trim();
      filteredCommands = COMMANDS.filter((c) =>
        c.title.toLowerCase().includes(q) ||
        c.cat.toLowerCase().includes(q) ||
        c.hint.toLowerCase().includes(q)
      );
      selectedIndex = 0;
      renderResults();
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        selectedIndex = (selectedIndex + 1) % Math.max(1, filteredCommands.length);
        renderResults();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        selectedIndex = (selectedIndex - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length);
        renderResults();
      } else if (e.key === "Enter") {
        e.preventDefault();
        executeSelected();
      }
    });

    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) closePalette();
    });
  }

  function renderResults() {
    const list = document.getElementById("palette-results");
    if (!list) return;

    if (filteredCommands.length === 0) {
      list.innerHTML = `<div class="palette-empty">No matching actions or pages found.</div>`;
      return;
    }

    list.innerHTML = filteredCommands.map((cmd, idx) => `
      <div class="palette-item ${idx === selectedIndex ? "active" : ""}" data-idx="${idx}" role="option">
        <div class="item-main">
          <strong>${cmd.title}</strong>
          <small>${cmd.hint}</small>
        </div>
        <span class="item-cat">${cmd.cat}</span>
      </div>
    `).join("");

    list.querySelectorAll(".palette-item").forEach((item) => {
      item.addEventListener("click", () => {
        selectedIndex = Number(item.dataset.idx);
        executeSelected();
      });
    });

    // Ensure active item is scrolled into view
    const activeEl = list.querySelector(".palette-item.active");
    if (activeEl) activeEl.scrollIntoView({ block: "nearest" });
  }

  function executeSelected() {
    const cmd = filteredCommands[selectedIndex];
    if (!cmd) return;
    closePalette();

    if (cmd.url) {
      window.location.href = cmd.url;
    } else if (cmd.action === "openSources") {
      const modal = document.querySelector(".sources-modal");
      if (modal) modal.showModal();
      else window.location.href = "index.html#sources";
    } else if (cmd.action === "exportBrief") {
      const exportBtn = document.getElementById("export-plan") || document.getElementById("export-workspace");
      if (exportBtn) exportBtn.click();
      else alert("Eurogrip Campaign Strategy: ₹60 Cr Investment across Commuter, Gig Worker & Premium segments.");
    }
  }

  function openPalette() {
    createPaletteDOM();
    const dialog = document.getElementById("command-palette");
    const input = document.getElementById("palette-input");
    filteredCommands = [...COMMANDS];
    selectedIndex = 0;
    input.value = "";
    renderResults();
    dialog.showModal();
    input.focus();
  }

  function closePalette() {
    const dialog = document.getElementById("command-palette");
    if (dialog && dialog.open) dialog.close();
  }

  // Keyboard shortcut binding (⌘K / Ctrl+K)
  window.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      const dialog = document.getElementById("command-palette");
      if (dialog && dialog.open) closePalette();
      else openPalette();
    }
  });

  function initializePalette() {
    createPaletteDOM();
    document.querySelectorAll(".palette-trigger, [data-open-palette]").forEach((btn) => {
      btn.addEventListener("click", openPalette);
    });
  }

  // The shared navigation may load this file after DOMContentLoaded.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializePalette, { once: true });
  } else {
    initializePalette();
  }

  // Expose global helper
  window.EurogripPalette = { open: openPalette, close: closePalette };
})();
