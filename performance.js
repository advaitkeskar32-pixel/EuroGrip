document.addEventListener("DOMContentLoaded", () => {
  const campaign = getCampaignState();
  renderTracker(campaign);
  renderReport(campaign);
  document.getElementById("tracker-kpi").addEventListener("change", (event) => {
    renderTracker(campaign, event.target.value);
  });
  document.getElementById("download-report").addEventListener("click", () => downloadReport(campaign));
  document.getElementById("print-report").addEventListener("click", () => window.print());
  document.getElementById("dataset-file").addEventListener("change", handleDatasetUpload);
});

const KPI_DEFINITIONS = {
  engagement: { label: "Rider engagement", unit: "interactions", target: (state) => state.cards * 2.5, ratio: 0.88 },
  dealers: { label: "Dealer participation", unit: "dealers", target: (state) => Math.max(500, Math.round(state.shops * 0.8)), ratio: 0.79 },
  shops: { label: "Tyre Finder shop coverage", unit: "shops", target: (state) => state.shops, ratio: 0.84 },
  cards: { label: "Rider Card registrations", unit: "registrations", target: (state) => state.cards, ratio: 0.91 },
  consideration: { label: "Premium brand consideration", unit: "%", target: () => 48, ratio: 0.76 }
};

const MONTHLY_RAMP = [0.48, 0.55, 0.62, 0.67, 0.72, 0.76, 0.8, 0.84, 0.87, 0.9, 0.94, 1];
const ACTUAL_VARIANCE = [-0.1, -0.07, -0.04, -0.02, 0, -0.03, -0.01, -0.04, -0.02, -0.08, -0.03, 0];

function getCampaignState() {
  const fallback = {
    projectName: "Eurogrip Growth Plan", budget: 60, shops: 5000, cards: 50000,
    trials: 100, months: 12, segment: "Commuter", prompt: "",
    allocation: { commuter: 25, gig: 30, premium: 30, shared: 15 }
  };
  let state = {};
  try {
    const saved = JSON.parse(localStorage.getItem("eurogrip-workspace-route") || "null");
    const master = JSON.parse(localStorage.getItem("eurogrip_master_state_v1") || "null");
    if (saved && typeof saved === "object") state = { ...state, ...saved };
    if (master && typeof master === "object") {
      state = {
        ...state,
        budget: master.budget ?? state.budget,
        shops: master.kpis?.shops ?? state.shops,
        cards: master.kpis?.cards ?? state.cards,
        trials: master.kpis?.trials ?? state.trials,
        segment: master.prioritySegment ?? state.segment,
        months: master.months ?? state.months,
        allocation: master.allocation ?? state.allocation,
        projectName: master.projectName ?? state.projectName
      };
    }
  } catch (error) {
    console.warn("Could not read the saved campaign plan; using the sample plan.", error);
  }
  const cleanNumber = (value, defaultValue) => {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : defaultValue;
  };
  return {
    ...fallback,
    ...state,
    budget: cleanNumber(state.budget, fallback.budget),
    shops: cleanNumber(state.shops, fallback.shops),
    cards: cleanNumber(state.cards, fallback.cards),
    trials: cleanNumber(state.trials, fallback.trials),
    months: Math.min(12, Math.max(1, cleanNumber(state.months, fallback.months))),
    allocation: { ...fallback.allocation, ...(state.allocation || {}) }
  };
}

function formatMetric(value, definition) {
  const rounded = definition.unit === "%" ? `${value.toFixed(1)}%` : Math.round(value).toLocaleString("en-IN");
  return rounded;
}

function renderTracker(state, selectedKey = document.getElementById("tracker-kpi").value) {
  const definition = KPI_DEFINITIONS[selectedKey] || KPI_DEFINITIONS.engagement;
  const target = definition.target(state);
  const lastMonth = state.months - 1;
  const latestRatio = Math.max(0, definition.ratio + ACTUAL_VARIANCE[lastMonth]);
  const targetToDate = target * MONTHLY_RAMP[lastMonth];
  const finalActual = targetToDate * latestRatio;
  const cards = document.getElementById("tracker-kpis");
  cards.replaceChildren();
  [
    { title: definition.label, value: formatMetric(finalActual, definition), note: "Latest simulated actual" },
    { title: "Target to date", value: formatMetric(targetToDate, definition), note: "Campaign workspace pacing" },
    { title: "Target progress", value: `${Math.round(latestRatio * 100)}%`, note: "Latest actual / target to date" }
  ].forEach((item) => {
    const card = document.createElement("article");
    const label = document.createElement("span");
    label.textContent = item.title;
    const value = document.createElement("strong");
    value.textContent = item.value;
    const note = document.createElement("small");
    note.textContent = item.note;
    card.append(label, value, note);
    cards.append(card);
  });

  document.getElementById("chart-kpi-title").textContent = definition.label;
  const chart = document.getElementById("tracker-chart");
  chart.setAttribute("aria-label", `Monthly target and simulated actual for ${definition.label}`);
  const width = 900, height = 300, left = 54, right = 18, top = 18, bottom = 40;
  const plotWidth = width - left - right, plotHeight = height - top - bottom;
  const maxValue = target;
  const x = (index) => left + index * plotWidth / 11;
  const y = (value) => top + plotHeight - value / maxValue * plotHeight;
  const targetPoints = MONTHLY_RAMP.slice(0, state.months).map((progress, index) => `${x(index)},${y(target * progress)}`);
  const actualPoints = MONTHLY_RAMP.slice(0, state.months).map((progress, index) =>
    `${x(index)},${y(target * progress * Math.max(0, definition.ratio + ACTUAL_VARIANCE[index]))}`
  );
  const monthLabels = MONTHLY_RAMP.slice(0, state.months).map((_, index) =>
    `<text x="${x(index)}" y="${height - 10}" text-anchor="middle" class="chart-month">M${index + 1}</text>`
  ).join("");
  const gridLines = [0.25, 0.5, 0.75, 1].map((fraction) => {
    const position = y(target * fraction);
    return `<line x1="${left}" y1="${position}" x2="${width - right}" y2="${position}" class="chart-grid"/><text x="${left - 8}" y="${position + 4}" text-anchor="end" class="chart-axis">${Math.round(fraction * 100)}%</text>`;
  }).join("");
  chart.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="presentation" focusable="false">
    ${gridLines}
    <polyline points="${targetPoints.join(" ")}" class="chart-line chart-line-target"/>
    <polyline points="${actualPoints.join(" ")}" class="chart-line chart-line-actual"/>
    ${actualPoints.map((point) => { const [px, py] = point.split(","); return `<circle cx="${px}" cy="${py}" r="4" class="chart-dot"/>`; }).join("")}
    ${monthLabels}
  </svg>`;
}

function renderReport(state) {
  const root = document.getElementById("campaign-report");
  const roadmap = getRoadmapSteps(state);
  const allocation = state.allocation;
  const segmentLines = [
    ["Commuter", allocation.commuter],
    ["Gig worker", allocation.gig],
    ["Premium rider", allocation.premium],
    ["Shared", allocation.shared]
  ];
  const channels = state.segment === "Gig worker"
    ? [["Digital", 35], ["Retail", 35], ["On-ground", 30]]
    : state.segment === "Premium rider"
      ? [["Digital", 45], ["Retail", 25], ["On-ground", 30]]
      : [["Digital", 40], ["Retail", 30], ["On-ground", 30]];
  const recommendation = {
    Commuter: "Lead with the WhatsApp Tyre Finder, mechanic rewards and local check camps.",
    "Gig worker": "Lead with Rider Cards, fixed-price fitting and pit-stops near rider hubs.",
    "Premium rider": "Lead with creator evidence, club demos and track-day trials."
  }[state.segment] || "Use local rider insight to select the lead campaign activation.";

  root.replaceChildren();
  const heading = document.createElement("h3");
  heading.textContent = state.projectName || "Eurogrip Growth Plan";
  root.append(heading);
  appendReportBlock(root, "Selected rider segment", `${state.segment} priority`);
  appendReportBlock(root, "Budget distribution", `₹${state.budget} Cr total — ${segmentLines.map(([name, percent]) => `${name} ${percent}%`).join(" / ")}. Channel mix: ${channels.map(([name, percent]) => `${name} ${percent}%`).join(" / ")}.`);
  appendReportBlock(root, "Campaign recommendation", recommendation);
  appendReportBlock(root, "Roadmap", roadmap.join(" "));
  appendReportBlock(root, "Projected KPIs", `${Number(state.shops).toLocaleString("en-IN")} Tyre Finder shops; ${Number(state.cards).toLocaleString("en-IN")} Rider Card registrations; ${Number(state.trials).toLocaleString("en-IN")} club trials over ${state.months} months.`);
  const note = document.createElement("small");
  note.textContent = "Projections are planning targets, not guaranteed results. Tracker history is simulated demo data.";
  root.append(note);
}

function appendReportBlock(root, title, detail) {
  const block = document.createElement("section");
  const heading = document.createElement("h4");
  heading.textContent = title;
  const content = document.createElement("p");
  content.textContent = detail;
  block.append(heading, content);
  root.append(block);
}

function getRoadmapSteps(state) {
  try {
    const saved = JSON.parse(localStorage.getItem("eurogrip-generated-plan") || "null");
    if (saved && Array.isArray(saved.steps) && saved.steps.length) return saved.steps;
  } catch (error) {
    console.warn("Could not read the generated campaign roadmap.", error);
  }
  const firstPhase = Math.max(1, Math.ceil(state.months / 4));
  const secondPhase = Math.max(firstPhase, Math.ceil(state.months * 0.75));
  return [
    `Prove (months 1–${firstPhase}): pilot ${state.segment.toLowerCase()} messaging and validate dealer/shop activation.`,
    `Scale (months ${firstPhase + 1}–${secondPhase}): expand the best-performing channel toward ${Number(state.shops).toLocaleString("en-IN")} shops.`,
    `Optimise (months ${secondPhase + 1}–${state.months}): review registrations, trials and conversion before reallocating.`
  ];
}

function downloadReport(state) {
  const roadmap = getRoadmapSteps(state);
  const allocation = state.allocation;
  const rows = [
    ["Section", "Item", "Details"],
    ["Campaign", "Project", state.projectName || "Eurogrip Growth Plan"],
    ["Campaign", "Duration", `${state.months} months`],
    ["Selected segment", "Priority", state.segment],
    ["Budget distribution", "Total budget", `₹${state.budget} Cr`],
    ["Budget distribution", "Commuter", `${allocation.commuter}%`],
    ["Budget distribution", "Gig worker", `${allocation.gig}%`],
    ["Budget distribution", "Premium rider", `${allocation.premium}%`],
    ["Budget distribution", "Shared", `${allocation.shared}%`],
    ["Recommendation", "Campaign", {
      Commuter: "Tyre Finder, mechanic rewards and local check camps",
      "Gig worker": "Rider Cards, fixed-price fitting and rider-hub pit-stops",
      "Premium rider": "Creator evidence, club demos and track-day trials"
    }[state.segment] || "Select activations using local rider insight"],
    ...roadmap.map((step, index) => ["Roadmap", `Phase ${index + 1}`, step]),
    ["Projected KPI", "Tyre Finder shops", Number(state.shops).toLocaleString("en-IN")],
    ["Projected KPI", "Rider Card registrations", Number(state.cards).toLocaleString("en-IN")],
    ["Projected KPI", "Club trials", Number(state.trials).toLocaleString("en-IN")],
    ["Data note", "Tracker", "Monthly actuals are simulated demo data; projections are targets, not guaranteed results."]
  ];
  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\r\n");
  downloadBlob(`\uFEFF${csv}`, "Eurogrip-Campaign-Report.csv", "text/csv;charset=utf-8");
}

function csvEscape(value) {
  let text = String(value ?? "");
  if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadBlob(content, filename, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function handleDatasetUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const status = document.getElementById("dataset-status");
  const results = document.getElementById("dataset-results");
  results.hidden = true;
  results.replaceChildren();
  if (!/\.csv$/i.test(file.name) && file.type !== "text/csv") {
    status.textContent = "Please choose a CSV file.";
    event.target.value = "";
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    status.textContent = "This file is over the 5 MB limit. Choose a smaller CSV.";
    event.target.value = "";
    return;
  }
  try {
    const rows = parseCsv(await file.text());
    if (rows.length < 2) throw new Error("The CSV needs a header row and at least one data row.");
    if (rows.length > 10001) throw new Error("The CSV has more than 10,000 data rows; please upload a smaller sample.");
    renderDatasetAnalysis(rows, file.name, results);
    status.textContent = `${file.name} analyzed in this browser. The file was not uploaded to a server.`;
    results.hidden = false;
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : "Could not read this CSV.";
    event.target.value = "";
  }
}

function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let index = 0; index < text.length; index++) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index++;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"' && field.length === 0) {
      quoted = true;
    } else if (character === ",") {
      row.push(field.trim());
      field = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && text[index + 1] === "\n") index++;
      row.push(field.trim());
      field = "";
      if (row.some((cell) => cell !== "")) rows.push(row);
      row = [];
    } else {
      field += character;
    }
  }
  if (quoted) throw new Error("The CSV has an unclosed quoted field.");
  row.push(field.trim());
  if (row.some((cell) => cell !== "")) rows.push(row);
  if (!rows.length) throw new Error("The CSV file is empty.");
  const width = rows[0].length;
  if (width < 1 || rows.slice(1).some((item) => item.length !== width)) {
    throw new Error("The CSV rows must all contain the same number of columns.");
  }
  return rows;
}

function renderDatasetAnalysis(rows, filename, root) {
  const headers = rows[0].map((header, index) => header || `Column ${index + 1}`);
  const records = rows.slice(1).map((cells) =>
    Object.fromEntries(headers.map((header, index) => [header, cells[index] || ""]))
  );
  const heading = document.createElement("h3");
  heading.textContent = `Dataset overview: ${filename}`;
  root.append(heading);
  const summary = document.createElement("p");
  summary.textContent = `${records.length.toLocaleString("en-IN")} records · ${headers.length} columns`;
  root.append(summary);

  const numeric = headers.map((header) => ({
    header,
    values: records.map((record) => parseNumeric(record[header])).filter((value) => value !== null)
  })).filter((column) => column.values.length >= Math.max(2, Math.ceil(records.length * 0.5))).slice(0, 8);
  const segmentColumn = headers.find((header) => /segment|cohort|persona|rider.?type/i.test(header));
  if (segmentColumn) {
    const counts = new Map();
    records.forEach((record) => {
      const value = record[segmentColumn].trim();
      if (value) counts.set(value, (counts.get(value) || 0) + 1);
    });
    const section = document.createElement("section");
    section.append(makeDatasetHeading(`Segment mix · ${segmentColumn}`));
    if (!counts.size) {
      section.append(makeDatasetText("No segment values were found in this column."));
    } else {
      const list = document.createElement("ul");
      Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).forEach(([name, count]) => {
        const item = document.createElement("li");
        item.textContent = `${name}: ${count.toLocaleString("en-IN")} (${(count / records.length * 100).toFixed(1)}%)`;
        list.append(item);
      });
      section.append(list);
    }
    root.append(section);
  } else if (numeric.length) {
    const feature = numeric[0];
    const sorted = [...feature.values].sort((a, b) => a - b);
    const lowerCut = sorted[Math.floor((sorted.length - 1) / 3)];
    const upperCut = sorted[Math.floor((sorted.length - 1) * 2 / 3)];
    const counts = new Map([["Lower", 0], ["Middle", 0], ["Higher", 0]]);
    records.forEach((record) => {
      const value = parseNumeric(record[feature.header]);
      if (value === null) return;
      const bucket = value <= lowerCut ? "Lower" : value <= upperCut ? "Middle" : "Higher";
      counts.set(bucket, counts.get(bucket) + 1);
    });
    const section = document.createElement("section");
    section.append(makeDatasetHeading(`Exploratory cohorts · ${feature.header}`));
    section.append(makeDatasetText(`No segment column was found. Rows are grouped into lower, middle and higher thirds by ${feature.header}; these are data-exploration buckets, not validated rider personas.`));
    const list = document.createElement("ul");
    counts.forEach((count, name) => {
      const item = document.createElement("li");
      item.textContent = `${name}: ${count.toLocaleString("en-IN")} (${(count / records.length * 100).toFixed(1)}%)`;
      list.append(item);
    });
    section.append(list);
    root.append(section);
  } else {
    root.append(makeDatasetText("No segment/cohort field or numeric feature was found. Add a segment column or numeric rider/campaign field to explore cohorts."));
  }

  const numericSection = document.createElement("section");
  numericSection.append(makeDatasetHeading("Numeric summaries"));
  if (!numeric.length) {
    numericSection.append(makeDatasetText("No numeric columns with enough values were detected."));
  } else {
    const table = document.createElement("table");
    const head = document.createElement("thead");
    const headerRow = document.createElement("tr");
    ["Column", "Valid values", "Average", "Minimum", "Maximum"].forEach((label) => {
      const cell = document.createElement("th");
      cell.textContent = label;
      headerRow.append(cell);
    });
    head.append(headerRow);
    const body = document.createElement("tbody");
    numeric.forEach((column) => {
      const values = column.values;
      const cells = [
        column.header,
        `${values.length.toLocaleString("en-IN")} / ${records.length.toLocaleString("en-IN")}`,
        (values.reduce((sum, value) => sum + value, 0) / values.length).toLocaleString("en-IN", { maximumFractionDigits: 2 }),
        Math.min(...values).toLocaleString("en-IN", { maximumFractionDigits: 2 }),
        Math.max(...values).toLocaleString("en-IN", { maximumFractionDigits: 2 })
      ];
      const row = document.createElement("tr");
      cells.forEach((value) => {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.append(cell);
      });
      body.append(row);
    });
    table.append(head, body);
    numericSection.append(table);
  }
  root.append(numericSection);
}

function parseNumeric(value) {
  const text = String(value).trim().replace(/,/g, "").replace(/[₹%]/g, "");
  if (!text) return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

function makeDatasetHeading(text) {
  const heading = document.createElement("h4");
  heading.textContent = text;
  return heading;
}

function makeDatasetText(text) {
  const paragraph = document.createElement("p");
  paragraph.textContent = text;
  return paragraph;
}
