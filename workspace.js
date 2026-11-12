const getValue = (id) => document.getElementById(id).value;

const defaults = {
  budget: 60, shops: 5000, cards: 50000, trials: 100,
  months: "12", segment: "Commuter", prompt: ""
};

let generateTimer;

function boundedValue(id, minimum, maximum, fallback) {
  const raw = Number(getValue(id));
  const value = Number.isFinite(raw) ? Math.min(maximum, Math.max(minimum, raw)) : fallback;
  document.getElementById(id).value = value;
  return value;
}

function generateWorkspace(persist = true) {
  const budget = boundedValue("workspace-budget", 10, 200, 60);
  const shops = boundedValue("workspace-shops", 100, 100000, 5000);
  const cards = boundedValue("workspace-cards", 1000, 1000000, 50000);
  const trials = boundedValue("workspace-trials", 10, 10000, 100);
  const segment = getValue("workspace-segment");
  const months = Number(getValue("workspace-months") || 12);
  const prompt = getValue("workspace-prompt").trim();

  const pressure = (shops / 5000 + cards / 50000 + trials / 100) / 3;
  const score = Math.max(62, Math.min(96, Math.round(92 - Math.max(0, pressure - 1) * 12)));
  const actions = {
    Commuter: "Lead with the WhatsApp Tyre Finder, mechanic rewards and local check camps.",
    "Gig worker": "Lead with Rider Cards, fixed-price fitting and pit-stops near rider hubs.",
    "Premium rider": "Lead with creator evidence, club demos and track-day trials."
  };
  const channels = segment === "Gig worker"
    ? "35% digital / 35% retail / 30% on-ground"
    : segment === "Premium rider"
      ? "45% digital / 25% retail / 30% on-ground"
      : "40% digital / 30% retail / 30% on-ground";

  document.getElementById("workspace-score").textContent = score;
  document.getElementById("workspace-headline").textContent = `${segment}-led launch model`;
  document.getElementById("workspace-summary").textContent =
    `With a ₹${budget} crore budget, target ${shops.toLocaleString("en-IN")} tyre-finder shops, ${cards.toLocaleString("en-IN")} Rider Cards and ${trials.toLocaleString("en-IN")} club trials.` +
    (prompt ? ` Constraint: “${prompt}”` : "");
  document.getElementById("workspace-action").textContent = actions[segment];
  document.getElementById("workspace-channel").textContent = channels;
  document.getElementById("workspace-kpi").textContent =
    `Track activation monthly, then reallocate if shop, card and trial conversion misses the phase target.`;

  const explanation = {
    Commuter: {
      reason: `Your plan prioritizes ${shops.toLocaleString("en-IN")} shop activations and broad access within a ₹${budget} crore budget.`,
      upside: "Local fitment support and mechanic advocacy can make the brand easier to find and trust.",
      risk: "Retail rollout can be slower than planned; validate shop activation before expanding spend."
    },
    "Gig worker": {
      reason: `The ${cards.toLocaleString("en-IN")} Rider Card target and your gig-worker priority favor uptime-led offers near rider hubs.`,
      upside: "Convenient fitting and predictable offers can help reduce downtime for high-mileage riders.",
      risk: "Hub coverage and offer economics vary by city; test repeat usage before scaling."
    },
    "Premium rider": {
      reason: `${trials.toLocaleString("en-IN")} club trials and a premium priority favor product proof and experiential activation.`,
      upside: "Track and club demonstrations can build credible performance consideration among enthusiasts.",
      risk: "Experiential reach may be narrower and costlier; measure trial-to-purchase conversion."
    }
  }[segment];
  document.getElementById("recommendation-reason").textContent = explanation.reason;
  document.getElementById("recommendation-segment").textContent =
    `${segment} riders, supported by the selected campaign targets.`;
  document.getElementById("recommendation-upside").textContent = explanation.upside;
  document.getElementById("recommendation-risk").textContent = explanation.risk;

  const forecastPressure = shops / 5000 + cards / 50000 + trials / 100;
  const monthly = [];
  for (let month = 1; month <= months; month++) {
    const ramp = month <= 3 ? 0.45 + month * 0.12 : 0.75 + (month - 3) / Math.max(months, 4) * 0.25;
    monthly.push(Math.round((shops / months) * ramp * Math.min(1.5, forecastPressure / 1.5)));
  }
  document.getElementById("forecast-value").textContent = monthly.at(-1).toLocaleString("en-IN");
  document.querySelector(".forecast").setAttribute("aria-label", `${months} month forecast`);
  document.getElementById("forecast-bars").innerHTML = monthly.slice(0, 12).map((value, index) =>
    `<i title="Month ${index + 1}: ${value.toLocaleString("en-IN")} shops" style="height:${Math.max(12, Math.min(100, value / Math.max(...monthly) * 100))}%"><span>M${index + 1}</span></i>`
  ).join("");

  if (persist) {
    localStorage.setItem("eurogrip-workspace-route", JSON.stringify({ budget, shops, cards, trials, months, segment, prompt }));
    document.getElementById("draft-status").textContent = "Saved locally";

    // Synchronize to the master cross-feature store
    if (window.EurogripStore) {
      window.EurogripStore.update({
        budget,
        kpis: { shops, cards, trials },
        prioritySegment: segment,
        months,
        projectName: document.getElementById("project-name") ? document.getElementById("project-name").value : "Eurogrip Growth Plan"
      });
    }
  }
}

["workspace-budget","workspace-shops","workspace-cards","workspace-trials","workspace-months","workspace-segment","workspace-prompt"].forEach((id) => {
  document.getElementById(id).addEventListener("input", () => {
    document.getElementById("draft-status").textContent = "Updating…";
    document.querySelectorAll("[data-preset]").forEach((item) => item.classList.remove("active"));
    hideGeneratedPlan();
    clearTimeout(generateTimer);
    generateTimer = setTimeout(generateWorkspace, 350);
  });
});

function buildGeneratedPlan() {
  const state = getCurrentState();
  const monthlyBudget = state.budget / Number(state.months);
  const phaseOne = Math.max(1, Math.ceil(Number(state.months) / 4));
  const phaseTwoEnd = Math.max(phaseOne, Math.ceil(Number(state.months) * 0.75));
  const prompt = state.prompt ? ` Applied constraint: ${state.prompt}.` : "";

  return [
    `Phase 1 — Prove (months 1-${phaseOne}): pilot with ${state.segment.toLowerCase()} messaging and target roughly ${(state.shops / Number(state.months)).toFixed(0)} shop activations monthly.`,
    `Phase 2 — Scale (months ${phaseOne + 1}-${phaseTwoEnd}): allocate about ₹${monthlyBudget.toFixed(1)} crore per month and expand only the strongest channel.`,
    `Phase 3 — Optimise (months ${phaseTwoEnd + 1}-${state.months}): review shop conversion, Rider Card activation and club-trial quality weekly.${prompt}`
  ];
}

function statesMatch(a, b) {
  return ["budget", "shops", "cards", "trials", "months", "segment", "prompt"].every(
    (key) => String(a[key] ?? "") === String(b[key] ?? "")
  );
}

function hideGeneratedPlan() {
  document.getElementById("generated-plan").hidden = true;
  document.getElementById("generated-plan").classList.remove("just-generated");
  document.getElementById("generated-steps").innerHTML = "";
}

function restoreGeneratedPlan() {
  try {
    const saved = JSON.parse(localStorage.getItem("eurogrip-generated-plan"));
    if (!saved || !statesMatch(saved.state, getCurrentState()) || !Array.isArray(saved.steps)) {
      hideGeneratedPlan();
      return;
    }
    document.getElementById("generated-steps").innerHTML = saved.steps.map((step) =>
      `<li>${String(step).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
      })[character])}</li>`
    ).join("");
    document.getElementById("generated-at").textContent = saved.generatedAt
      ? `Updated ${new Date(saved.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
      : "Saved plan";
    document.getElementById("generated-plan").hidden = false;
  } catch (_) {
    hideGeneratedPlan();
  }
}

document.getElementById("generate-workspace").addEventListener("click", () => {
  const button = document.getElementById("generate-workspace");
  const label = button.querySelector("span");
  clearTimeout(generateTimer);

  button.disabled = true;
  button.classList.add("is-generating");
  label.textContent = "Generating plan…";
  document.getElementById("draft-status").textContent = "Building plan…";

  setTimeout(() => {
    generateWorkspace();
    const steps = buildGeneratedPlan();
    document.getElementById("generated-steps").innerHTML = steps.map((step) =>
      `<li>${step.replace(/[&<>"']/g, (character) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
      })[character])}</li>`
    ).join("");
    document.getElementById("generated-at").textContent =
      `Updated ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    const panel = document.getElementById("generated-plan");
    panel.hidden = false;
    panel.classList.remove("just-generated");
    requestAnimationFrame(() => panel.classList.add("just-generated"));

    localStorage.setItem("eurogrip-generated-plan", JSON.stringify({
      state: getCurrentState(),
      steps,
      generatedAt: new Date().toISOString()
    }));
    document.getElementById("draft-status").textContent = "Plan generated and saved";
    label.textContent = "Generate updated plan";
    button.classList.remove("is-generating");
    button.disabled = false;
    button.querySelector("b").textContent = "✓";
    showToast("Updated campaign plan generated");
    setTimeout(() => button.querySelector("b").textContent = "→", 1800);
  }, 650);
});

function setPreset(name) {
  const presets = {
    base: { budget:60, shops:5000, cards:50000, trials:100, months:"12", segment:"Commuter", prompt:"" },
    reach: { budget:75, shops:8000, cards:75000, trials:120, months:"12", segment:"Gig worker", prompt:"Expand shop reach while protecting the retail channel." },
    performance: { budget:60, shops:4000, cards:40000, trials:200, months:"12", segment:"Premium rider", prompt:"Prioritize track proof and club-led demonstrations after pilot validation." },
    "ai-opt": { budget:60, shops:6200, cards:64000, trials:140, months:"12", segment:"Gig worker", prompt:"AI-optimized allocation derived via Marketing Mix Model Gradient Descent on Hill response curves." }
  };
  const preset = presets[name];
  document.getElementById("workspace-budget").value = preset.budget;
  document.getElementById("workspace-shops").value = preset.shops;
  document.getElementById("workspace-cards").value = preset.cards;
  document.getElementById("workspace-trials").value = preset.trials;
  document.getElementById("workspace-months").value = preset.months;
  document.getElementById("workspace-segment").value = preset.segment;
  document.getElementById("workspace-prompt").value = preset.prompt;
  generateWorkspace(false);
  localStorage.setItem("eurogrip-workspace-route", JSON.stringify({
    budget: preset.budget, shops: preset.shops, cards: preset.cards, trials: preset.trials,
    months: preset.months, segment: preset.segment, prompt: preset.prompt
  }));
  hideGeneratedPlan();
}

document.querySelectorAll("[data-preset]").forEach((button) => button.addEventListener("click", () => {
  document.querySelectorAll("[data-preset]").forEach((item) => item.classList.remove("active"));
  button.classList.add("active");
  setPreset(button.dataset.preset);
}));

document.querySelectorAll("[data-constraint]").forEach((button) => button.addEventListener("click", () => {
  const prompt = document.getElementById("workspace-prompt");
  prompt.value = prompt.value ? `${prompt.value}; ${button.dataset.constraint}` : button.dataset.constraint;
  hideGeneratedPlan();
  generateWorkspace();
}));

document.getElementById("reset-workspace").addEventListener("click", () => {
  localStorage.removeItem("eurogrip-workspace-route");
  localStorage.removeItem("eurogrip-generated-plan");
  setPreset("base");
  localStorage.removeItem("eurogrip-workspace-route");
  document.getElementById("draft-status").textContent = "Reset to source strategy";
  document.querySelectorAll("[data-preset]").forEach((item) => item.classList.toggle("active", item.dataset.preset === "base"));
});
document.getElementById("export-workspace").addEventListener("click", () => {
  const text = [
    "EUROGRIP CAMPAIGN WORKSPACE",
    document.getElementById("workspace-headline").textContent,
    document.getElementById("workspace-summary").textContent,
    document.getElementById("workspace-action").textContent,
    document.getElementById("workspace-channel").textContent,
    document.getElementById("workspace-kpi").textContent,
    "GENERATED ACTION PLAN",
    ...Array.from(document.querySelectorAll("#generated-steps li")).map((step) => step.textContent)
  ].join("\n\n");
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "Eurogrip-Workspace-Brief.txt";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  document.getElementById("draft-status").textContent = "Plan exported";
});

const scenarioKey = "eurogrip-scenarios";

function getCurrentState() {
  return {
    budget: boundedValue("workspace-budget", 10, 200, 60),
    shops: boundedValue("workspace-shops", 100, 100000, 5000),
    cards: boundedValue("workspace-cards", 1000, 1000000, 50000),
    trials: boundedValue("workspace-trials", 10, 10000, 100),
    months: getValue("workspace-months"),
    segment: getValue("workspace-segment"),
    prompt: getValue("workspace-prompt").trim()
  };
}

function showToast(message) {
  let toast = document.querySelector(".product-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "product-toast";
    toast.setAttribute("role", "status");
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("visible"), 2600);
}

function loadSavedScenarios() {
  try { return JSON.parse(localStorage.getItem(scenarioKey)) || []; }
  catch (_) { return []; }
}

function escapeHtml(value) {
  const element = document.createElement("span");
  element.textContent = value;
  return element.innerHTML;
}

function renderScenarios() {
  const container = document.getElementById("scenario-history");
  const scenarios = loadSavedScenarios();
  container.innerHTML = `<span>${scenarios.length} SAVED SCENARIOS</span>` + scenarios.map((scenario, index) =>
    `<button type="button" class="scenario-card" data-scenario="${index}">
      <strong>${escapeHtml(scenario.name)}</strong><small>${escapeHtml(scenario.state.segment)}</small>
    </button>`
  ).join("");
  container.querySelectorAll("[data-scenario]").forEach((button) => button.addEventListener("click", () => {
    const scenario = scenarios[Number(button.dataset.scenario)];
    const state = scenario.state;
    document.getElementById("workspace-budget").value = state.budget;
    document.getElementById("workspace-shops").value = state.shops;
    document.getElementById("workspace-cards").value = state.cards;
    document.getElementById("workspace-trials").value = state.trials;
    document.getElementById("workspace-months").value = state.months;
    document.getElementById("workspace-segment").value = state.segment;
    document.getElementById("workspace-prompt").value = state.prompt || "";
    hideGeneratedPlan();
    generateWorkspace();
    showToast(`${scenario.name} loaded`);
  }));
}

document.getElementById("save-scenario").addEventListener("click", () => {
  const scenarios = loadSavedScenarios();
  const name = document.getElementById("project-name").value.trim() || "Campaign plan";
  scenarios.unshift({ name, state: getCurrentState(), savedAt: new Date().toISOString() });
  localStorage.setItem(scenarioKey, JSON.stringify(scenarios.slice(0, 8)));
  renderScenarios();
  document.getElementById("draft-status").textContent = "Scenario saved";
  showToast("Scenario saved to this browser");
});

document.getElementById("share-workspace").addEventListener("click", async () => {
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(getCurrentState()))));
  const url = `${location.origin}${location.pathname}#plan=${encoded}`;
  try {
    await navigator.clipboard.writeText(url);
    showToast("Share link copied");
  } catch (_) {
    prompt("Copy this share link:", url);
  }
});

document.getElementById("project-name").addEventListener("input", () => {
  localStorage.setItem("eurogrip-project-name", getValue("project-name"));
});
const savedProjectName = localStorage.getItem("eurogrip-project-name");
if (savedProjectName) document.getElementById("project-name").value = savedProjectName;

try {
  if (window.EurogripStore) {
    const master = window.EurogripStore.get();
    if (master && master.budget) {
      document.getElementById("workspace-budget").value = master.budget;
      document.getElementById("workspace-shops").value = master.kpis.shops;
      document.getElementById("workspace-cards").value = master.kpis.cards;
      document.getElementById("workspace-trials").value = master.kpis.trials;
      document.getElementById("workspace-segment").value = master.prioritySegment || "Gig worker";
      if (master.appliedOptimization) {
        document.getElementById("draft-status").textContent = `Synced: ${master.appliedOptimization}`;
      }
    }
  } else {
    const saved = JSON.parse(localStorage.getItem("eurogrip-workspace-route"));
    if (saved) {
      document.getElementById("workspace-budget").value = saved.budget;
      document.getElementById("workspace-shops").value = saved.shops;
      document.getElementById("workspace-cards").value = saved.cards;
      document.getElementById("workspace-trials").value = saved.trials;
      document.getElementById("workspace-months").value = saved.months || "12";
      document.getElementById("workspace-segment").value = saved.segment;
      document.getElementById("workspace-prompt").value = saved.prompt || "";
    }
  }
} catch (_) {}
try {
  const seed = JSON.parse(localStorage.getItem("eurogrip-workspace-seed") || "null");
  if (seed) {
    document.getElementById("workspace-budget").value = seed.budget;
    document.getElementById("workspace-shops").value = seed.shops;
    document.getElementById("workspace-cards").value = seed.cards;
    document.getElementById("workspace-trials").value = seed.trials;
    document.getElementById("workspace-months").value = seed.months || "12";
    document.getElementById("workspace-segment").value = seed.segment;
    document.getElementById("workspace-prompt").value = seed.prompt || "";
    localStorage.removeItem("eurogrip-workspace-seed");
  }
} catch (error) {
  console.warn("Could not load the campaign brief into the workspace.", error);
}
if (location.hash.startsWith("#plan=")) {
  try {
    const shared = JSON.parse(decodeURIComponent(escape(atob(location.hash.slice(6)))));
    document.getElementById("workspace-budget").value = shared.budget;
    document.getElementById("workspace-shops").value = shared.shops;
    document.getElementById("workspace-cards").value = shared.cards;
    document.getElementById("workspace-trials").value = shared.trials;
    document.getElementById("workspace-months").value = shared.months;
    document.getElementById("workspace-segment").value = shared.segment;
    document.getElementById("workspace-prompt").value = shared.prompt || "";
    showToast("Shared plan loaded");
  } catch (_) {
    showToast("This share link is invalid");
  }
}
renderScenarios();
generateWorkspace();
restoreGeneratedPlan();
