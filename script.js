const segments = {
  commuter: {
    role: "DEFEND / RELIABILITY",
    promise: "Made for<br>your bike.",
    description: "The right tyre is more than a product. It is confidence that fits, functions and lasts for the ride ahead.",
    budget: "₹15 CR",
    word: "RANGE",
    color: "#d9ff43",
    activations: [
      ["DIGITAL", "Tyre finder on WhatsApp"],
      ["RETAIL", "Finder in every shop + mechanic rewards"],
      ["ON-GROUND", "Free tyre check camps"]
    ]
  },
  gig: {
    role: "OPEN SEGMENT / UPTIME",
    promise: "Never lose<br>a shift.",
    description: "For riders whose income depends on keeping moving, durability and rapid repairs turn tyres into livelihood protection.",
    budget: "₹18 CR",
    word: "UPTIME",
    color: "#ff5a2a",
    activations: [
      ["DIGITAL", "Hindi, Kannada + Tamil videos; Rider Card"],
      ["RETAIL", "Fixed-price fitting at partner shops"],
      ["ON-GROUND", "Pit-Stops where riders gather"]
    ]
  },
  premium: {
    role: "WIN / PERFORMANCE",
    promise: "Proven on<br>the track.",
    description: "Eurogrip makes performance credible through exacting tests, creator evidence and the riders' own peer community.",
    budget: "₹18 CR",
    word: "PROOF",
    color: "#4f62ff",
    activations: [
      ["DIGITAL", "Creator reviews and product tests"],
      ["RETAIL", "19 Eurogrip stores to see the product"],
      ["ON-GROUND", "Club demos and track days"]
    ]
  }
};

const tabs = document.querySelectorAll(".segment-tab");
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const key = tab.dataset.segment;
    const data = segments[key];
    tabs.forEach((item) => {
      item.classList.remove("active");
      item.setAttribute("aria-selected", "false");
    });
    tab.classList.add("active");
    tab.setAttribute("aria-selected", "true");

    document.getElementById("segment-role").textContent = data.role;
    document.getElementById("segment-promise").innerHTML = data.promise;
    document.getElementById("segment-description").textContent = data.description;
    document.getElementById("segment-budget").textContent = data.budget;
    document.getElementById("segment-word").textContent = data.word;

    const visual = document.querySelector(".visual-product div");
    visual.style.background = data.color;
    document.getElementById("activation-list").innerHTML = data.activations.map((item, index) =>
      `<article><span>0${index + 1}</span><div><small>${item[0]}</small><strong>${item[1]}</strong></div></article>`
    ).join("");
  });
});

const menuButton = document.querySelector(".menu-button");
const nav = document.querySelector(".nav");
menuButton.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("menu-open");
  menuButton.setAttribute("aria-expanded", String(isOpen));
});
document.querySelectorAll(".nav nav a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("menu-open");
    menuButton.setAttribute("aria-expanded", "false");
  });
});

const modal = document.querySelector(".sources-modal");
document.querySelectorAll("[data-open-sources]").forEach((button) => {
  button.addEventListener("click", () => modal.showModal());
});
document.querySelector(".modal-close").addEventListener("click", () => modal.close());
modal.addEventListener("click", (event) => {
  if (event.target === modal) modal.close();
});
modal.addEventListener("close", () => {
  if (window.location.hash === "#sources") {
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  }
});
if (window.location.hash === "#sources") modal.showModal();

const plannerDefaults = { commuter: 25, gig: 30, premium: 30, shared: 15 };
const allocationRanges = document.querySelectorAll(".allocation-range");
const totalBudget = document.getElementById("total-budget");

function updatePlanner() {
  let total = 0;
  allocationRanges.forEach((range) => {
    const value = Number(range.value);
    total += value;
    document.getElementById(`${range.dataset.key}-output`).textContent = `${value}%`;
  });
  const status = document.getElementById("allocation-status");
  status.classList.toggle("over", total !== 100);
  status.innerHTML = `<span>${total}%</span> ${total === 100 ? "allocated" : total > 100 ? "over allocation" : "remaining"}`;
  if (document.getElementById("scenario-label")) updateSimulator();
}

allocationRanges.forEach((range) => range.addEventListener("input", updatePlanner));
totalBudget.addEventListener("input", updateSimulator);

let activeScenario = "balanced";
const scenarioMix = {
  balanced: [40, 30, 30, "Balanced channel mix"],
  retail: [30, 45, 25, "Retail-led channel mix"],
  digital: [55, 25, 20, "Digital-led channel mix"]
};

function updateSimulator() {
  const [digital, retail, ground, label] = scenarioMix[activeScenario];
  const marketFactor = document.getElementById("city-select").value === "pilot" ? 0.82 : document.getElementById("city-select").value === "scale" ? 1 : 1.12;
  const budgetFactor = Math.max(0.5, Number(totalBudget.value || 60) / 60);
  const factor = marketFactor * budgetFactor;
  const shops = Math.round(5000 * factor * (1 + (digital - 40) / 500));
  const cards = Math.round(50000 * factor * (1 + (retail - 30) / 500));
  const trials = Math.round(100 * factor * (1 + (ground - 30) / 400));

  document.getElementById("kpi-shops").textContent = shops.toLocaleString("en-IN");
  document.getElementById("kpi-cards").textContent = `${(cards / 1000).toFixed(cards >= 10000 ? 0 : 1)}K`;
  document.getElementById("kpi-trials").textContent = trials.toLocaleString("en-IN");
  document.getElementById("shops-change").textContent = `${Math.round((shops / 5000 - 1) * 100)}%`;
  document.getElementById("cards-change").textContent = `${Math.round((cards / 50000 - 1) * 100)}%`;
  document.getElementById("trials-change").textContent = `${Math.round((trials / 100 - 1) * 100)}%`;
  document.getElementById("scenario-label").textContent = label;

  ["digital", "retail", "ground"].forEach((key, index) => {
    const value = [digital, retail, ground][index];
    document.getElementById(`${key}-value`).textContent = `${value}%`;
    document.getElementById(`${key}-bar`).style.width = `${value}%`;
  });
}

document.querySelectorAll(".scenario-switch button").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".scenario-switch button").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    activeScenario = button.dataset.scenario;
    updateSimulator();
  });
});
document.getElementById("city-select").addEventListener("change", updateSimulator);

const toolkitCopy = {
  commuter: {
    title: "Made for your bike.",
    copy: "Use the WhatsApp Tyre Finder to help riders discover the right fit, then confirm it through their trusted local shop.",
    channel: {
      Digital: "Use the WhatsApp Tyre Finder to help riders discover the right fit.",
      Retail: "Give every shop a product finder and reward mechanics who recommend the correct Eurogrip fit.",
      "On-ground": "Host free tyre check camps that turn product range into visible local service."
    }
  },
  gig: {
    title: "Never lose a shift.",
    copy: "Turn uptime into a promise: durable tyres, fixed-price fitting and fast support wherever riders gather.",
    channel: {
      Digital: "Publish Hindi, Kannada and Tamil Rider Card stories about earning without avoidable downtime.",
      Retail: "Offer fixed-price fitting and a fast-track service promise at partner workshops.",
      "On-ground": "Build pit-stop activations around the places gig riders already depend on."
    }
  },
  premium: {
    title: "Proven on the track.",
    copy: "Make performance visible through independent tests, club demonstrations and track-day evidence.",
    channel: {
      Digital: "Activate creator reviews and structured tyre tests that show evidence, not claims.",
      Retail: "Use 19 Eurogrip stores to let riders inspect the premium product range in person.",
      "On-ground": "Bring clubs and riders together through demo rides and track days."
    }
  }
};

function updateToolkit() {
  const segment = document.getElementById("toolkit-segment").value;
  const channel = document.getElementById("toolkit-channel").value;
  const data = toolkitCopy[segment];
  const segmentName = { commuter: "Commuter", gig: "Gig worker", premium: "Premium rider" }[segment];
  document.getElementById("toolkit-output").innerHTML =
    `<small>${segmentName.toUpperCase()} / ${channel.toUpperCase()}</small><strong>${data.title}</strong><p>${data.channel[channel]}</p><button type="button" id="copy-brief">Copy message</button>`;
  document.getElementById("copy-brief").addEventListener("click", copyToolkitMessage);
}

async function copyToolkitMessage() {
  const article = document.getElementById("toolkit-output");
  const text = `${article.querySelector("small").textContent}\n${article.querySelector("strong").textContent}\n${article.querySelector("p").textContent}`;
  await navigator.clipboard.writeText(text);
  const button = document.getElementById("copy-brief");
  button.textContent = "Copied";
  setTimeout(() => { button.textContent = "Copy message"; }, 1400);
}

document.getElementById("toolkit-segment").addEventListener("change", updateToolkit);
document.getElementById("toolkit-channel").addEventListener("change", updateToolkit);
document.getElementById("copy-brief").addEventListener("click", copyToolkitMessage);

document.getElementById("save-plan").addEventListener("click", () => {
  const plan = {
    budget: totalBudget.value,
    commuter: document.getElementById("commuter-range").value,
    gig: document.getElementById("gig-range").value,
    premium: document.getElementById("premium-range").value,
    shared: document.getElementById("shared-range").value
  };
  localStorage.setItem("eurogrip-plan", JSON.stringify(plan));
  const button = document.getElementById("save-plan");
  button.textContent = "Plan saved";
  setTimeout(() => { button.textContent = "Save plan"; }, 1400);
});

document.getElementById("reset-plan").addEventListener("click", () => {
  totalBudget.value = 60;
  allocationRanges.forEach((range) => { range.value = plannerDefaults[range.dataset.key]; });
  localStorage.removeItem("eurogrip-plan");
  updatePlanner();
});

document.getElementById("export-plan").addEventListener("click", () => {
  const allocation = {};
  allocationRanges.forEach((range) => { allocation[range.dataset.key] = `${range.value}%`; });
  const text = [
    "EUROGRIP — CAMPAIGN STRATEGY BRIEF",
    `Annual budget: ₹${totalBudget.value} crore`,
    `Allocation: ${JSON.stringify(allocation)}`,
    `Scenario: ${scenarioMix[activeScenario][3]}`,
    `Market: ${document.getElementById("city-select").selectedOptions[0].text}`,
    "",
    "Promise: Grip you can trust",
    "Commuter: Made for your bike",
    "Gig worker: Never lose a shift",
    "Premium: Proven on the track",
    "",
    "All targets and pilot cities remain proposals from the source case study."
  ].join("\n");
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "Eurogrip-Campaign-Brief.txt";
  link.click();
  URL.revokeObjectURL(link.href);
});

try {
  const saved = JSON.parse(localStorage.getItem("eurogrip-plan"));
  if (saved) {
    totalBudget.value = saved.budget || 60;
    ["commuter", "gig", "premium", "shared"].forEach((key) => {
      const range = document.getElementById(`${key}-range`);
      if (range && saved[key] !== undefined) range.value = saved[key];
    });
  }
} catch (_) {}

updatePlanner();

document.getElementById("generate-recommendation").addEventListener("click", () => {
  const shops = Math.max(100, Number(document.getElementById("custom-shops").value || 5000));
  const cards = Math.max(1000, Number(document.getElementById("custom-cards").value || 50000));
  const trials = Math.max(10, Number(document.getElementById("custom-trials").value || 100));
  const months = Number(document.getElementById("custom-months").value);
  const goal = document.getElementById("custom-goal").value;
  const segment = document.getElementById("custom-segment").value;
  const constraint = document.getElementById("custom-prompt").value.trim();
  const budget = Math.max(10, Number(totalBudget.value || 60));

  const names = { commuter: "Commuter", gig: "Gig worker", premium: "Premium rider" };
  const goalCopy = {
    uptime: "Protect rider uptime and reduce avoidable income loss",
    reach: "Expand verified shop and product-finder reach",
    performance: "Build premium credibility through visible proof",
    balanced: "Balance reliability, rider income protection and performance proof"
  };
  const segmentAction = {
    commuter: "lead with local tyre-finder coverage, mechanic enablement and check camps",
    gig: "lead with Rider Cards, fixed-price fitting and high-frequency pit-stop activations",
    premium: "lead with track evidence, creator reviews and club-led trial events"
  };

  const channelRecommendation = {
    uptime: "Keep 35% digital, 30% retail and 35% on-ground to combine education with rapid access.",
    reach: "Shift to 45% retail, 35% digital and 20% on-ground for network-led expansion.",
    performance: "Shift to 45% digital, 25% retail and 30% on-ground to prioritise credible proof.",
    balanced: "Use 40% digital, 30% retail and 30% on-ground as the base execution mix."
  }[goal];

  const targetPressure = (shops / 5000 + cards / 50000 + trials / 100) / 3;
  const timePressure = 12 / months;
  const score = Math.max(58, Math.min(96, Math.round(90 - Math.max(0, targetPressure * timePressure - 1) * 14)));
  const constraintLine = constraint
    ? `Constraint applied: “${constraint}”`
    : `No special constraint added; the recommendation is optimized for ${goalCopy[goal].toLowerCase()}.`;

  document.getElementById("result-empty").hidden = true;
  document.getElementById("result-content").hidden = false;
  document.getElementById("result-status").textContent = "Generated locally";
  document.getElementById("result-score").textContent = score;
  document.getElementById("result-headline").textContent =
    `A ${months}-month plan for ${names[segment].toLowerCase()} growth.`;
  document.getElementById("result-summary").textContent =
    `At a ₹${budget} crore annual budget, prioritise ${goalCopy[goal].toLowerCase()}. ` +
    `Your targets require ${shops.toLocaleString("en-IN")} tyre-finder shops, ${cards.toLocaleString("en-IN")} Rider Cards and ${trials.toLocaleString("en-IN")} club trials. ${constraintLine}`;
  document.getElementById("result-action").textContent =
    `${names[segment]} should ${segmentAction[segment]} during the first third of the ${months}-month launch.`;
  document.getElementById("result-channel").textContent = channelRecommendation;
  document.getElementById("result-kpi").textContent =
    `Track shop activation, card issuance and trial completion every 30 days; reallocate at each phase review.`;
});

document.getElementById("copy-result").addEventListener("click", async () => {
  const text = [
    document.getElementById("result-headline").textContent,
    document.getElementById("result-summary").textContent,
    document.getElementById("result-action").textContent,
    document.getElementById("result-channel").textContent,
    document.getElementById("result-kpi").textContent
  ].join("\n\n");
  await navigator.clipboard.writeText(text);
  const button = document.getElementById("copy-result");
  button.textContent = "Recommendation copied";
  setTimeout(() => { button.textContent = "Copy recommendation"; }, 1400);
});

function collectWorkspaceState() {
  return {
    budget: Number(totalBudget.value || 60),
    allocation: Object.fromEntries([...allocationRanges].map((range) => [range.dataset.key, Number(range.value)])),
    custom: {
      shops: document.getElementById("custom-shops").value,
      cards: document.getElementById("custom-cards").value,
      trials: document.getElementById("custom-trials").value,
      months: document.getElementById("custom-months").value,
      goal: document.getElementById("custom-goal").value,
      segment: document.getElementById("custom-segment").value,
      prompt: document.getElementById("custom-prompt").value
    }
  };
}

function saveWorkspace(showStatus = true) {
  localStorage.setItem("eurogrip-workspace-v2", JSON.stringify(collectWorkspaceState()));
  const status = document.getElementById("autosave-status");
  status.textContent = "Autosaved just now";
  if (showStatus) {
    const button = document.getElementById("save-plan");
    button.textContent = "Plan saved";
    setTimeout(() => { button.textContent = "Save plan"; }, 1400);
  }
}

document.getElementById("save-plan").addEventListener("click", () => saveWorkspace(true));

const workspaceInputs = [
  ...allocationRanges,
  totalBudget,
  document.getElementById("custom-shops"),
  document.getElementById("custom-cards"),
  document.getElementById("custom-trials"),
  document.getElementById("custom-months"),
  document.getElementById("custom-goal"),
  document.getElementById("custom-segment"),
  document.getElementById("custom-prompt")
];
let autosaveTimer;
workspaceInputs.forEach((input) => {
  input.addEventListener("input", () => {
    document.getElementById("autosave-status").textContent = "Saving…";
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => saveWorkspace(false), 700);
  });
});

try {
  const workspace = JSON.parse(localStorage.getItem("eurogrip-workspace-v2"));
  if (workspace) {
    totalBudget.value = workspace.budget || 60;
    if (workspace.allocation) {
      allocationRanges.forEach((range) => {
        if (workspace.allocation[range.dataset.key] !== undefined) {
          range.value = workspace.allocation[range.dataset.key];
        }
      });
    }
    if (workspace.custom) {
      ["shops", "cards", "trials", "months", "goal", "segment"].forEach((key) => {
        const elements = {
          shops: "custom-shops",
          cards: "custom-cards",
          trials: "custom-trials",
          months: "custom-months",
          goal: "custom-goal",
          segment: "custom-segment"
        };
        if (workspace.custom[key] !== undefined) document.getElementById(elements[key]).value = workspace.custom[key];
      });
      document.getElementById("custom-prompt").value = workspace.custom.prompt || "";
    }
    updatePlanner();
  }
} catch (_) {}

function updateReadiness() {
  const checklist = [...document.querySelectorAll("#launch-checklist input")];
  const complete = checklist.filter((item) => item.checked).length;
  const percent = Math.round((complete / checklist.length) * 100);
  const ring = document.getElementById("readiness-ring");
  ring.querySelector("strong").textContent = percent;
  ring.style.borderRightColor = percent >= 80 ? "#d9ff43" : "#ff5a2a";
  checklist.forEach((item) => {
    const status = item.closest("label").querySelector("i");
    status.textContent = item.checked ? "Done" : "Open";
  });
}
document.querySelectorAll("#launch-checklist input").forEach((input) => {
  input.addEventListener("change", () => {
    updateReadiness();

    try {
      const match = location.hash.match(/(?:^|&)plan=([^&]+)/);
      if (match) {
        const shared = JSON.parse(decodeURIComponent(escape(atob(match[1]))));
        if (shared.budget) totalBudget.value = shared.budget;
        if (shared.allocation) {
          allocationRanges.forEach((range) => {
            if (shared.allocation[range.dataset.key] !== undefined) range.value = shared.allocation[range.dataset.key];
          });
        }
        if (shared.custom) {
          const map = {
            shops: "custom-shops",
            cards: "custom-cards",
            trials: "custom-trials",
            months: "custom-months",
            goal: "custom-goal",
            segment: "custom-segment",
            prompt: "custom-prompt"
          };
          Object.entries(map).forEach(([key, id]) => {
            if (shared.custom[key] !== undefined) document.getElementById(id).value = shared.custom[key];
          });
        }
        updatePlanner();
        document.getElementById("workspace-name").textContent = "Shared Eurogrip Growth Plan";
      }
    } catch (_) {}
    saveWorkspace(false);
  });
});

document.getElementById("share-plan").addEventListener("click", async () => {
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(collectWorkspaceState()))));
  const url = `${location.origin}${location.pathname}#control-room&plan=${encoded.slice(0, 1800)}`;
  await navigator.clipboard.writeText(url);
  const button = document.getElementById("share-plan");
  button.textContent = "Link copied";
  setTimeout(() => { button.textContent = "Share workspace"; }, 1400);
});

document.getElementById("print-workspace").addEventListener("click", () => window.print());

const comparisonScenarios = [
  ["Base", "5,000", "50K", "100", "Medium"],
  ["Digital", "6,100", "58K", "112", "Medium"],
  ["Retail", "5,750", "62K", "126", "Low"]
];
document.getElementById("add-comparison").addEventListener("click", () => {
  const budgetScale = Math.max(0.75, Number(totalBudget.value || 60) / 60);
  const table = document.getElementById("comparison-table");
  const customName = "Custom";
  const scenario = [
    customName,
    Math.round(Number(document.getElementById("custom-shops").value || 5000) * budgetScale).toLocaleString("en-IN"),
    `${Math.round(Number(document.getElementById("custom-cards").value || 50000) * budgetScale / 1000)}K`,
    Number(document.getElementById("custom-trials").value || 100),
    "Calculated"
  ];
  const labels = table.querySelector(".comparison-head");
  if (!labels.querySelector(".custom-label")) {
    labels.insertAdjacentHTML("beforeend", `<span class="custom-label">${customName}</span>`);
    table.querySelectorAll(".comparison-row:not(.comparison-head)").forEach((row, index) => {
      row.classList.add("custom-comparison");
      row.insertAdjacentHTML("beforeend", `<strong>${scenario[index + 1]}</strong>`);
      row.style.gridTemplateColumns = "1.4fr repeat(4,.65fr)";
    });
    labels.style.gridTemplateColumns = "1.4fr repeat(4,.65fr)";
  } else {
    const rows = [...table.querySelectorAll(".comparison-row:not(.comparison-head)")];
    rows.forEach((row, index) => {
      const customCell = row.querySelector("strong:last-child");
      if (customCell) customCell.textContent = scenario[index + 1];
    });
  }
});

updateReadiness();
