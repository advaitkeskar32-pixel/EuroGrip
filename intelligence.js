/**
 * AI & Machine Learning Intelligence Engine — TVS Eurogrip Strategy Suite
 * Real client-side algorithms:
 * 1. K-Means Clustering (Unsupervised Rider Segmentation)
 * 2. Gradient Descent Optimizer on Hill Saturation Curves (MMM Marketing Mix)
 * 3. Multi-variate Logistic Failure & Remaining Useful Life (RUL) Predictor
 * 4. Cosine Similarity Vector Embedding Recommender
 */

document.addEventListener("DOMContentLoaded", () => {
  initLabTabs();
  initKMeans();
  initMMMOptimizer();
  initRiskClassifier();
  initVectorRecommender();
  initMonteCarlo();
  initCopilot();
  initExplainableCentre();
});

/* ==========================================================================
   LAB TABS SWITCHING
   ========================================================================== */
function initLabTabs() {
  const tabs = document.querySelectorAll(".ai-lab-tab");
  const panels = document.querySelectorAll(".ai-lab-panel");

  function activateTab(tabKey) {
    const targetTab = document.querySelector(`.ai-lab-tab[data-tab='${tabKey}']`);
    const targetPanel = document.getElementById(`lab-${tabKey}`);
    if (!targetTab || !targetPanel) return;

    tabs.forEach((t) => {
      t.classList.remove("active");
      t.setAttribute("aria-selected", "false");
    });
    panels.forEach((p) => {
      p.classList.remove("active");
      p.hidden = true;
    });

    targetTab.classList.add("active");
    targetTab.setAttribute("aria-selected", "true");
    targetPanel.classList.add("active");
    targetPanel.hidden = false;

    if (tabKey === "clustering") drawKMeans();
    if (tabKey === "optimizer") drawResponseCurves();
    if (tabKey === "montecarlo") drawMonteCarlo();
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      activateTab(tab.dataset.tab);
    });
  });

  // Handle hash on load or change (e.g. #optimizer)
  const applyHash = () => {
    const hash = window.location.hash.replace("#", "");
    if (["clustering", "optimizer", "risk", "recommender", "montecarlo", "copilot", "explainable"].includes(hash)) {
      activateTab(hash);
    }
  };
  applyHash();
  window.addEventListener("hashchange", applyHash);
}

/* ==========================================================================
   LAB 1: UNSUPERVISED K-MEANS CLUSTERING
   ========================================================================== */
let kmeansState = {
  k: 3,
  n: 240,
  data: [],
  centroids: [],
  assignments: [],
  iterations: 0,
  converged: false
};

const SEGMENT_METADATA = [
  { name: "Commuter", color: "#4f62ff", hook: "Made for your bike (Range & Fit)" },
  { name: "Gig Worker", color: "#ff5a2a", hook: "Never lose a shift (Uptime & Low TCO)" },
  { name: "Premium Rider", color: "#d9ff43", hook: "Proven on the track (Test Evidence & Grip)" },
  { name: "Emerging Fleet", color: "#00d2ff", hook: "Commercial Bulk Maintenance" },
  { name: "Custom Segment", color: "#b967ff", hook: "Specialized Niche Group" }
];

function generateSyntheticRiderData(n) {
  const points = [];
  // 3 ground-truth distributions typical for Indian 2-wheeler market:
  // 1. Commuter: Daily km ~ 15-40, Performance Affinity ~ 1.5-4.5
  // 2. Gig Delivery: Daily km ~ 70-160, Performance Affinity ~ 1.0-4.0
  // 3. Premium Enthusiast: Daily km ~ 25-85, Performance Affinity ~ 6.5-9.8
  const nCommuter = Math.round(n * 0.45);
  const nGig = Math.round(n * 0.35);
  const nPrem = n - nCommuter - nGig;

  // Gaussian-ish random helper
  const randNorm = (mean, std) => {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return mean + z * std;
  };

  for (let i = 0; i < nCommuter; i++) {
    points.push({
      km: Math.max(8, Math.min(60, randNorm(28, 8))),
      perf: Math.max(1, Math.min(5.5, randNorm(2.8, 0.8))),
      label: "Commuter"
    });
  }
  for (let i = 0; i < nGig; i++) {
    points.push({
      km: Math.max(55, Math.min(175, randNorm(105, 20))),
      perf: Math.max(1, Math.min(5.0, randNorm(2.6, 0.7))),
      label: "Gig Worker"
    });
  }
  for (let i = 0; i < nPrem; i++) {
    points.push({
      km: Math.max(15, Math.min(110, randNorm(52, 18))),
      perf: Math.max(5.5, Math.min(10.0, randNorm(8.2, 0.9))),
      label: "Premium"
    });
  }
  return points;
}

function initKMeansCentroids(k, data) {
  // K-Means++ initialization for fast and stable convergence
  const centroids = [];
  if (data.length === 0) return centroids;

  // Choose first centroid uniformly at random
  const firstIdx = Math.floor(Math.random() * data.length);
  centroids.push({ km: data[firstIdx].km, perf: data[firstIdx].perf });

  // Choose remaining k-1 centroids with probability proportional to distance squared
  for (let c = 1; c < k; c++) {
    let sumD2 = 0;
    const d2 = data.map((p) => {
      let minDist = Infinity;
      centroids.forEach((cent) => {
        const d = normalizedDist(p, cent);
        if (d < minDist) minDist = d;
      });
      const distSq = minDist * minDist;
      sumD2 += distSq;
      return distSq;
    });

    let target = Math.random() * sumD2;
    let chosenIdx = 0;
    for (let i = 0; i < d2.length; i++) {
      target -= d2[i];
      if (target <= 0) {
        chosenIdx = i;
        break;
      }
    }
    centroids.push({ km: data[chosenIdx].km, perf: data[chosenIdx].perf });
  }
  return centroids;
}

// Distance normalized across domain scales (km: 0-180, perf: 0-10)
function normalizedDist(p1, p2) {
  const dKm = (p1.km - p2.km) / 180;
  const dPerf = (p1.perf - p2.perf) / 10;
  return Math.sqrt(dKm * dKm + dPerf * dPerf);
}

function stepKMeans() {
  if (kmeansState.converged) return;

  const { k, data, centroids } = kmeansState;
  const assignments = [];
  let changed = false;

  // Step 1: Assign each point to closest centroid
  for (let i = 0; i < data.length; i++) {
    const p = data[i];
    let minDist = Infinity;
    let closestCentroid = 0;
    for (let c = 0; c < k; c++) {
      const dist = normalizedDist(p, centroids[c]);
      if (dist < minDist) {
        minDist = dist;
        closestCentroid = c;
      }
    }
    if (kmeansState.assignments[i] !== closestCentroid) {
      changed = true;
    }
    assignments.push(closestCentroid);
  }
  kmeansState.assignments = assignments;

  // Step 2: Recalculate centroids
  const newCentroids = [];
  for (let c = 0; c < k; c++) {
    const clusterPoints = data.filter((_, idx) => assignments[idx] === c);
    if (clusterPoints.length > 0) {
      const avgKm = clusterPoints.reduce((acc, p) => acc + p.km, 0) / clusterPoints.length;
      const avgPerf = clusterPoints.reduce((acc, p) => acc + p.perf, 0) / clusterPoints.length;
      newCentroids.push({ km: avgKm, perf: avgPerf });
    } else {
      // Empty cluster: reseed near random point
      const rp = data[Math.floor(Math.random() * data.length)];
      newCentroids.push({ km: rp.km, perf: rp.perf });
    }
  }
  kmeansState.centroids = newCentroids;
  kmeansState.iterations++;

  // Step 3: Compute Inertia (WCSS)
  let inertia = 0;
  for (let i = 0; i < data.length; i++) {
    const c = assignments[i];
    const d = normalizedDist(data[i], newCentroids[c]);
    inertia += d * d;
  }

  kmeansState.converged = !changed && kmeansState.iterations > 1;

  // Update UI indicators
  document.getElementById("kmeans-iters").textContent = kmeansState.iterations;
  document.getElementById("kmeans-inertia").textContent = inertia.toFixed(4);
  const statusEl = document.getElementById("kmeans-status");
  if (kmeansState.converged) {
    statusEl.textContent = "Converged (Optimal Partition)";
    statusEl.className = "status-converged success";
  } else {
    statusEl.textContent = `Optimizing (Pass ${kmeansState.iterations})`;
    statusEl.className = "status-converged active";
  }

  drawKMeans();
  renderClusterSummary();
  refreshExplainableCentre();
}

function runKMeansToConvergence() {
  let safetyLimit = 30;
  while (!kmeansState.converged && safetyLimit > 0) {
    stepKMeans();
    safetyLimit--;
  }
}

function resetKMeans() {
  kmeansState.data = generateSyntheticRiderData(kmeansState.n);
  kmeansState.centroids = initKMeansCentroids(kmeansState.k, kmeansState.data);
  kmeansState.assignments = new Array(kmeansState.data.length).fill(0);
  kmeansState.iterations = 0;
  kmeansState.converged = false;

  document.getElementById("kmeans-iters").textContent = "0";
  document.getElementById("kmeans-inertia").textContent = "—";
  const statusEl = document.getElementById("kmeans-status");
  statusEl.textContent = "Ready to iterate";
  statusEl.className = "status-converged";

  drawKMeans();
  renderClusterSummary();
  refreshExplainableCentre();
}

function drawKMeans() {
  const canvas = document.getElementById("kmeans-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;

  // Clear
  ctx.clearRect(0, 0, width, height);

  // Background subtle grid
  ctx.strokeStyle = "rgba(17,18,16,0.06)";
  ctx.lineWidth = 1;
  const padL = 40, padR = 20, padT = 20, padB = 40;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  for (let km = 30; km <= 180; km += 30) {
    const x = padL + (km / 180) * plotW;
    ctx.beginPath();
    ctx.moveTo(x, padT);
    ctx.lineTo(x, padT + plotH);
    ctx.stroke();
  }
  for (let p = 2; p <= 10; p += 2) {
    const y = padT + plotH - (p / 10) * plotH;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(padL + plotW, y);
    ctx.stroke();
  }

  // Draw points
  kmeansState.data.forEach((p, idx) => {
    const cIdx = kmeansState.assignments[idx] || 0;
    const color = SEGMENT_METADATA[cIdx % SEGMENT_METADATA.length].color;
    const x = padL + (p.km / 180) * plotW;
    const y = padT + plotH - (p.perf / 10) * plotH;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.4)";
    ctx.lineWidth = 0.5;
    ctx.stroke();
  });

  // Draw centroids
  kmeansState.centroids.forEach((cent, cIdx) => {
    const x = padL + (cent.km / 180) * plotW;
    const y = padT + plotH - (cent.perf / 10) * plotH;
    const color = SEGMENT_METADATA[cIdx % SEGMENT_METADATA.length].color;

    // Outer radar ring
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.stroke();

    // Star icon inside
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#111210";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Centroid label badge
    ctx.fillStyle = "#111210";
    ctx.font = "bold 9px 'Space Mono', monospace";
    ctx.fillText(`C${cIdx + 1}`, x + 16, y + 3);
  });
}

function renderClusterSummary() {
  const container = document.getElementById("cluster-summary-table");
  if (!container) return;

  const { k, data, assignments, centroids } = kmeansState;
  let html = `<div class="cluster-cards-row">`;

  for (let c = 0; c < k; c++) {
    const clusterPoints = data.filter((_, idx) => assignments[idx] === c);
    const count = clusterPoints.length;
    const pct = ((count / Math.max(1, data.length)) * 100).toFixed(1);
    const cent = centroids[c] || { km: 0, perf: 0 };
    const meta = SEGMENT_METADATA[c % SEGMENT_METADATA.length];

    // Deduce persona
    let persona = meta.name;
    if (cent.perf > 6.0) persona = "Premium / Enthusiast";
    else if (cent.km > 65) persona = "Gig / Delivery Rider";
    else persona = "Daily Commuter";

    html += `
      <div class="cluster-summary-card" style="border-top: 3px solid ${meta.color}">
        <div class="card-head">
          <span style="color:${meta.color}">CLUSTER 0${c + 1}</span>
          <strong>${pct}% (${count} riders)</strong>
        </div>
        <h4>${persona}</h4>
        <div class="centroid-stat">
          <span>Centroid:</span> <b>${cent.km.toFixed(0)} km/day</b> · <b>Perf ${cent.perf.toFixed(1)}/10</b>
        </div>
        <p class="cluster-hook">${meta.hook}</p>
      </div>
    `;
  }
  html += `</div>`;
  html += `
    <div style="margin-top:16px;display:flex;justify-content:flex-end;">
      <button type="button" id="deploy-kmeans-btn" class="action-btn" style="width:auto;padding:0 20px;">
        Deploy Empirical Cluster Ratios to Strategy &amp; Budget ✦
      </button>
    </div>
  `;
  container.innerHTML = html;

  const deployBtn = document.getElementById("deploy-kmeans-btn");
  if (deployBtn) {
    deployBtn.addEventListener("click", () => {
      let counts = [0, 0, 0];
      assignments.forEach((c) => {
        if (counts[c] !== undefined) counts[c]++;
      });
      const total = Math.max(1, data.length);
      const cPcts = {
        commuter: Math.round((counts[0] / total) * 100),
        gig: Math.round((counts[1] / total) * 100),
        premium: Math.round((counts[2] / total) * 100)
      };
      if (window.EurogripStore) {
        window.EurogripStore.applyKMeansClusters(cPcts, "K-Means Empirical Segments");
      }
      deployBtn.textContent = "✓ Cluster Ratios Deployed to Strategy";
      setTimeout(() => { deployBtn.textContent = "Deploy Empirical Cluster Ratios to Strategy & Budget ✦"; }, 2000);
    });
  }
}

function initKMeans() {
  const kSlider = document.getElementById("kmeans-k");
  const nSlider = document.getElementById("kmeans-n");
  const kVal = document.getElementById("kmeans-k-val");
  const nVal = document.getElementById("kmeans-n-val");

  kSlider.addEventListener("input", (e) => {
    kmeansState.k = Number(e.target.value);
    kVal.textContent = `K = ${kmeansState.k} (${kmeansState.k === 3 ? "Commuter, Gig, Premium" : "Dynamic Clusters"})`;
    resetKMeans();
  });

  nSlider.addEventListener("input", (e) => {
    kmeansState.n = Number(e.target.value);
    nVal.textContent = `${kmeansState.n} Riders`;
    resetKMeans();
  });

  document.getElementById("kmeans-step").addEventListener("click", stepKMeans);
  document.getElementById("kmeans-run").addEventListener("click", runKMeansToConvergence);
  document.getElementById("kmeans-reset").addEventListener("click", resetKMeans);

  // Single test point classifier
  document.getElementById("test-classify-btn").addEventListener("click", () => {
    const km = Number(document.getElementById("test-km").value || 75);
    const perf = Number(document.getElementById("test-sens").value || 3);
    const testPoint = { km, perf };

    let minDist = Infinity;
    let closest = 0;
    kmeansState.centroids.forEach((c, idx) => {
      const d = normalizedDist(testPoint, c);
      if (d < minDist) {
        minDist = d;
        closest = idx;
      }
    });

    const meta = SEGMENT_METADATA[closest % SEGMENT_METADATA.length];
    const out = document.getElementById("test-classify-output");
    out.hidden = false;
    out.style.borderLeft = `4px solid ${meta.color}`;
    out.innerHTML = `<strong>Classified as Cluster 0${closest + 1} (${meta.name})</strong><br>Matches profile: ${meta.hook} (Distance: ${(minDist * 100).toFixed(1)})`;
  });

  // Initial generation
  resetKMeans();
}

/* ==========================================================================
   LAB 2: MARKETING MIX MODELING & GRADIENT DESCENT OPTIMIZER
   ========================================================================== */
/**
 * Hill Saturation Function: R(x) = (Vmax * x^gamma) / (S^gamma + x^gamma)
 * Derivative: dR/dx = (Vmax * gamma * S^gamma * x^(gamma-1)) / (S^gamma + x^gamma)^2
 */
const CHANNELS_MMM = [
  { id: "commuter", name: "Commuter", color: "#4f62ff", vmax: 42, s: 14, gamma: 1.8, baseSpend: 15 },
  { id: "gig", name: "Gig Worker", color: "#ff5a2a", vmax: 48, s: 16, gamma: 2.1, baseSpend: 18 },
  { id: "premium", name: "Premium", color: "#111210", vmax: 38, s: 15, gamma: 2.3, baseSpend: 18 },
  { id: "shared", name: "Shared Brand", color: "#d9ff43", vmax: 26, s: 8, gamma: 1.6, baseSpend: 9 }
];

let mmmState = {
  totalBudget: 60,
  spends: [15, 18, 18, 9],
  alpha: 0.05,
  iteration: 0,
  objective: "blended"
};

function hillResponse(spend, ch) {
  const x = Math.max(0.01, spend);
  const xG = Math.pow(x, ch.gamma);
  const sG = Math.pow(ch.s, ch.gamma);
  return (ch.vmax * xG) / (sG + xG);
}

function hillDerivative(spend, ch) {
  const x = Math.max(0.01, spend);
  const xG = Math.pow(x, ch.gamma);
  const sG = Math.pow(ch.s, ch.gamma);
  const denom = Math.pow(sG + xG, 2);
  const num = ch.vmax * ch.gamma * sG * Math.pow(x, ch.gamma - 1);
  return num / denom;
}

function computeBlendedScore() {
  let totalScore = 0;
  CHANNELS_MMM.forEach((ch, idx) => {
    let weight = 1.0;
    if (mmmState.objective === "gig" && ch.id === "gig") weight = 1.8;
    if (mmmState.objective === "retail" && ch.id === "commuter") weight = 1.6;
    if (mmmState.objective === "premium" && ch.id === "premium") weight = 1.8;
    totalScore += hillResponse(mmmState.spends[idx], ch) * weight;
  });
  return totalScore;
}

function gradientDescentStep() {
  const gradients = CHANNELS_MMM.map((ch, idx) => {
    let weight = 1.0;
    if (mmmState.objective === "gig" && ch.id === "gig") weight = 1.8;
    if (mmmState.objective === "retail" && ch.id === "commuter") weight = 1.6;
    if (mmmState.objective === "premium" && ch.id === "premium") weight = 1.8;
    return hillDerivative(mmmState.spends[idx], ch) * weight;
  });

  // Gradient projection to preserve sum(spends) == totalBudget
  // Standard simplex projection: shift spends in direction of relative gradient above mean gradient
  const meanGrad = gradients.reduce((a, b) => a + b, 0) / gradients.length;
  const gradNorm = Math.sqrt(gradients.reduce((acc, g) => acc + Math.pow(g - meanGrad, 2), 0));

  let newSpends = mmmState.spends.map((s, idx) => {
    const step = mmmState.alpha * (gradients[idx] - meanGrad) * 10;
    return Math.max(1.0, s + step);
  });

  // Re-normalize to exact totalBudget
  const sumNew = newSpends.reduce((a, b) => a + b, 0);
  mmmState.spends = newSpends.map((s) => (s / sumNew) * mmmState.totalBudget);
  mmmState.iteration++;

  updateMMMDisplay(gradNorm);
}

function solveOptimumMMM() {
  for (let i = 0; i < 40; i++) {
    gradientDescentStep();
  }
}

function resetMMM() {
  mmmState.spends = [
    (15 / 60) * mmmState.totalBudget,
    (18 / 60) * mmmState.totalBudget,
    (18 / 60) * mmmState.totalBudget,
    (9 / 60) * mmmState.totalBudget
  ];
  mmmState.iteration = 0;
  updateMMMDisplay(0.48);
}

function updateMMMDisplay(gradNorm = 0.48) {
  document.getElementById("opt-iteration-num").textContent = mmmState.iteration;
  const score = computeBlendedScore();
  document.getElementById("opt-blended-score").textContent = score.toFixed(1);
  const roas = (score / mmmState.totalBudget) * 2.45;
  document.getElementById("opt-roas-mult").textContent = `${roas.toFixed(2)}x`;
  document.getElementById("opt-gradient-norm").textContent = `||∇|| = ${gradNorm.toFixed(3)}`;

  // Cards
  CHANNELS_MMM.forEach((ch, idx) => {
    const val = mmmState.spends[idx];
    const pct = ((val / mmmState.totalBudget) * 100).toFixed(1);
    document.getElementById(`alloc-val-${ch.id}`).textContent = `₹${val.toFixed(1)} Cr`;
    document.getElementById(`alloc-pct-${ch.id}`).textContent = `${pct}%`;
    document.getElementById(`bar-${ch.id}`).style.width = `${pct}%`;
  });

  // Recalculate output metrics
  const commuterSpend = mmmState.spends[0];
  const gigSpend = mmmState.spends[1];
  const premiumSpend = mmmState.spends[2];

  document.getElementById("alloc-kpi-commuter").textContent = `${Math.round(5000 * (commuterSpend / 15)).toLocaleString("en-IN")} shops`;
  document.getElementById("alloc-kpi-gig").textContent = `${Math.round(50000 * (gigSpend / 18)).toLocaleString("en-IN")} cards`;
  document.getElementById("alloc-kpi-premium").textContent = `${Math.round(100 * (premiumSpend / 18))} trials`;

  const explanations = {
    blended: {
      reason: "Balanced blended response across commuter, gig, premium and shared-brand channels.",
      benefit: "All three rider segments, with shared spend supporting brand reach.",
      upside: "Diversifies exposure and reduces dependence on one response curve.",
      risk: "A balanced mix may underweight the strongest short-term opportunity."
    },
    gig: {
      reason: "The optimizer gives additional weight to the gig-worker response curve.",
      benefit: "High-mileage gig riders and Rider Card acquisition.",
      upside: "Can focus resources on uptime and rider-hub activation.",
      risk: "A stronger gig focus may reduce retail or premium reach."
    },
    retail: {
      reason: "The optimizer gives additional weight to the commuter/retail response curve.",
      benefit: "Commuters and dealers supporting Tyre Finder shop coverage.",
      upside: "Can deepen local availability and mechanic-led recommendations.",
      risk: "Retail activation may take longer to scale and verify."
    },
    premium: {
      reason: "The optimizer gives additional weight to the premium response curve.",
      benefit: "Premium riders reached through clubs, creators and track experiences.",
      upside: "Can strengthen product proof and premium consideration.",
      risk: "Experiential reach can be narrower and costlier per rider."
    }
  }[mmmState.objective];
  document.getElementById("mmm-reason").textContent = explanations.reason;
  document.getElementById("mmm-benefit").textContent = explanations.benefit;
  document.getElementById("mmm-upside").textContent = explanations.upside;
  document.getElementById("mmm-risk").textContent = explanations.risk;

  drawResponseCurves();
  refreshExplainableCentre();
}

function drawResponseCurves() {
  const canvas = document.getElementById("response-curves-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  const padL = 40, padR = 20, padT = 20, padB = 30;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  // Grid
  ctx.strokeStyle = "rgba(17,18,16,0.06)";
  ctx.lineWidth = 1;
  for (let s = 10; s <= 50; s += 10) {
    const x = padL + (s / 50) * plotW;
    ctx.beginPath();
    ctx.moveTo(x, padT);
    ctx.lineTo(x, padT + plotH);
    ctx.stroke();
  }

  // Draw 4 channel curves
  CHANNELS_MMM.forEach((ch, idx) => {
    ctx.strokeStyle = ch.color === "#111210" ? "#333333" : ch.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    for (let xStep = 0; xStep <= 50; xStep += 0.5) {
      const resp = hillResponse(xStep, ch);
      const px = padL + (xStep / 50) * plotW;
      const py = padT + plotH - (resp / 50) * plotH;
      if (xStep === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Plot current operating dot
    const currentSpend = mmmState.spends[idx];
    const currentResp = hillResponse(currentSpend, ch);
    const dotX = padL + (currentSpend / 50) * plotW;
    const dotY = padT + plotH - (currentResp / 50) * plotH;

    ctx.fillStyle = ch.color === "#111210" ? "#333333" : ch.color;
    ctx.beginPath();
    ctx.arc(dotX, dotY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

function initMMMOptimizer() {
  const budgetSlider = document.getElementById("opt-budget-slider");
  const budgetDisplay = document.getElementById("opt-budget-display");
  const alphaSlider = document.getElementById("opt-alpha-slider");
  const alphaDisplay = document.getElementById("opt-alpha-display");
  const objSelect = document.getElementById("opt-objective");

  budgetSlider.addEventListener("input", (e) => {
    const newTotal = Number(e.target.value);
    const factor = newTotal / mmmState.totalBudget;
    mmmState.spends = mmmState.spends.map((s) => s * factor);
    mmmState.totalBudget = newTotal;
    budgetDisplay.textContent = `₹${newTotal.toFixed(1)} CR`;
    updateMMMDisplay();
  });

  alphaSlider.addEventListener("input", (e) => {
    mmmState.alpha = Number(e.target.value);
    alphaDisplay.textContent = `α = ${mmmState.alpha.toFixed(2)}`;
  });

  objSelect.addEventListener("change", (e) => {
    mmmState.objective = e.target.value;
    updateMMMDisplay();
  });

  document.getElementById("opt-step-btn").addEventListener("click", gradientDescentStep);
  document.getElementById("opt-run-btn").addEventListener("click", solveOptimumMMM);
  document.getElementById("opt-reset-btn").addEventListener("click", resetMMM);

  // Apply to workspace integration
  document.getElementById("apply-to-workspace-btn").addEventListener("click", () => {
    const commuterPct = Math.round((mmmState.spends[0] / mmmState.totalBudget) * 100);
    const gigPct = Math.round((mmmState.spends[1] / mmmState.totalBudget) * 100);
    const premPct = Math.round((mmmState.spends[2] / mmmState.totalBudget) * 100);
    const sharedPct = 100 - commuterPct - gigPct - premPct;

    const workspaceData = {
      budget: mmmState.totalBudget,
      allocation: {
        commuter: commuterPct,
        gig: gigPct,
        premium: premPct,
        shared: sharedPct
      },
      custom: {
        shops: Math.round(5000 * (mmmState.spends[0] / 15)),
        cards: Math.round(50000 * (mmmState.spends[1] / 18)),
        trials: Math.round(100 * (mmmState.spends[2] / 18)),
        months: "12",
        goal: "balanced",
        segment: "Gig worker",
        prompt: "Generated via AI Gradient Descent Marketing Mix Model."
      }
    };

    localStorage.setItem("eurogrip-workspace-v2", JSON.stringify(workspaceData));
    localStorage.setItem("eurogrip-workspace-route", JSON.stringify({
      budget: mmmState.totalBudget,
      shops: workspaceData.custom.shops,
      cards: workspaceData.custom.cards,
      trials: workspaceData.custom.trials,
      months: 12,
      segment: "Gig worker",
      prompt: "AI-optimized allocation via Hill Saturation Model"
    }));

    window.location.href = "workspace.html";
  });

  updateMMMDisplay();
}

/* ==========================================================================
   LAB 3: PREDICTIVE FLEET FAILURE & RUL CLASSIFIER
   ========================================================================== */
function initRiskClassifier() {
  const kmSlider = document.getElementById("risk-km-slider");
  const treadSlider = document.getElementById("risk-tread-slider");
  const psiSlider = document.getElementById("risk-psi-slider");
  const surfaceSelect = document.getElementById("risk-surface");
  const payloadSelect = document.getElementById("risk-payload");
  const brandSelect = document.getElementById("risk-tyre-brand");

  try {
    const savedState = JSON.parse(localStorage.getItem("eurogrip_master_state_v1") || "{}");
    const telemetry = savedState.fleetTelemetry || {};
    if (Number.isFinite(Number(telemetry.km))) kmSlider.value = Math.min(220, Math.max(15, Number(telemetry.km)));
    if (Number.isFinite(Number(telemetry.tread))) treadSlider.value = Math.min(7, Math.max(0.8, Number(telemetry.tread)));
    if (Number.isFinite(Number(telemetry.psi))) psiSlider.value = Math.min(8, Math.max(-12, Number(telemetry.psi)));
  } catch (error) {
    console.warn("Could not restore saved fleet telemetry.", error);
  }

  function evaluateRisk() {
    const km = Number(kmSlider.value);
    const tread = Number(treadSlider.value);
    const psi = Number(psiSlider.value);
    const surface = surfaceSelect.value;
    const payload = payloadSelect.value;
    const brand = brandSelect.value;

    document.getElementById("risk-km-display").textContent = `${km} km/day`;
    document.getElementById("risk-tread-display").textContent = `${tread.toFixed(1)} mm (Min legal: 1.6 mm)`;
    document.getElementById("risk-psi-display").textContent = `${psi >= 0 ? "+" : ""}${psi} PSI (${psi < -3 ? "Underinflated" : psi > 3 ? "Overinflated" : "Normal"})`;

    // Multi-variate Logistic Regression Inference
    // z = w0 + w_km*km + w_tread*(1/tread) + w_psi*abs(psi) + w_surface + w_payload + w_brand
    let z = -2.6; // baseline intercept
    z += (km / 100) * 0.95;
    z += (1.6 / Math.max(0.6, tread)) * 1.35;
    z += Math.abs(psi) * 0.18;

    const surfaceWeights = { city: -0.4, rough: 0.65, monsoon: 0.85, unpaved: 1.1 };
    z += surfaceWeights[surface] || 0;

    const payloadWeights = { solo: -0.3, delivery: 0.45, pillion: 0.8 };
    z += payloadWeights[payload] || 0;

    const brandWeights = { generic: 0.95, eurogrip: -0.85, competitor: 0.1 };
    z += brandWeights[brand] || 0;

    // Sigmoid probability (0 to 1)
    const prob = 1 / (1 + Math.exp(-z));
    const probPct = Math.round(prob * 100);

    // Remaining Useful Life (RUL)
    const baseWearRate = brand === "eurogrip" ? 0.00012 : brand === "generic" ? 0.00022 : 0.00016; // mm per km
    const surfaceMultiplier = surface === "rough" ? 1.4 : surface === "unpaved" ? 1.7 : 1.0;
    const wearRate = baseWearRate * surfaceMultiplier;
    const usableTread = Math.max(0, tread - 1.6);
    const rulKm = Math.round(usableTread / wearRate);
    const rulDays = Math.round(rulKm / Math.max(1, km));

    // Protected Income calculation:
    // Avg gig shift loss per puncture = ₹1,200. Punctures prevented per month ~ prob * 2.8
    const shiftLossPrevented = Math.round(prob * 2.6 * 1200);

    // Gauge UI update
    const gaugeFill = document.getElementById("risk-gauge-fill");
    const circumference = 2 * Math.PI * 42; // r=42 -> ~263.89
    const offset = circumference - (probPct / 100) * circumference;
    gaugeFill.style.strokeDasharray = `${circumference}`;
    gaugeFill.style.strokeDashoffset = `${offset}`;

    const badge = document.getElementById("risk-level-badge");
    const summaryHead = document.getElementById("risk-summary-head");
    const summaryBody = document.getElementById("risk-summary-body");

    if (probPct < 35) {
      gaugeFill.style.stroke = "#4f62ff";
      badge.textContent = "LOW RISK";
      badge.className = "risk-badge low";
      summaryHead.textContent = "Optimal Operating Uptime";
      summaryBody.textContent = "Tread depth and compound durability ensure zero predicted puncture interruptions this shift cycle.";
    } else if (probPct < 65) {
      gaugeFill.style.stroke = "#ff9500";
      badge.textContent = "MODERATE RISK";
      badge.className = "risk-badge moderate";
      summaryHead.textContent = "Accelerated Tread Wear Detected";
      summaryBody.textContent = "Under-inflation or road roughness is increasing thermal degradation. Proactive pit-stop check recommended.";
    } else {
      gaugeFill.style.stroke = "#ff5a2a";
      badge.textContent = "CRITICAL RISK";
      badge.className = "risk-badge critical";
      summaryHead.textContent = "Immediate Puncture Vulnerability";
      summaryBody.textContent = "Tread depth is nearing legal threshold with severe puncture exposure. Swap to Eurogrip Durapro immediately.";
    }

    document.getElementById("risk-prob-val").textContent = `${probPct}%`;
    document.getElementById("risk-rul-km").innerHTML = `${rulKm.toLocaleString("en-IN")}<span> KM</span>`;
    document.getElementById("risk-rul-days").textContent = `Approx. ${rulDays} operating days remaining`;
    document.getElementById("risk-savings").innerHTML = `₹${shiftLossPrevented.toLocaleString("en-IN")}<span>/mo</span>`;

    // Replacement milestone estimate
    const replaceDate = new Date();
    replaceDate.setDate(replaceDate.getDate() + rulDays);
    document.getElementById("risk-replace-date").textContent = replaceDate.toLocaleDateString("en-IN", {
      month: "short",
      year: "numeric"
    });

    // Shapley factor breakdown bars
    const factorTread = Math.min(100, Math.round((1.6 / Math.max(0.6, tread)) * 25));
    const factorPsi = Math.min(100, Math.round(Math.abs(psi) * 8));
    const factorSurface = Math.min(100, Math.round(Math.max(0, surfaceWeights[surface]) * 50));
    const factorCompound = brand === "eurogrip" ? 45 : brand === "generic" ? 5 : 20;

    document.getElementById("factor-tread").style.width = `${factorTread}%`;
    document.getElementById("factor-tread-val").textContent = `+${Math.round(factorTread * 0.4)}% Risk`;
    document.getElementById("factor-psi").style.width = `${factorPsi}%`;
    document.getElementById("factor-psi-val").textContent = `+${Math.round(factorPsi * 0.35)}% Risk`;
    document.getElementById("factor-surface").style.width = `${factorSurface}%`;
    document.getElementById("factor-surface-val").textContent = `+${Math.round(factorSurface * 0.3)}% Risk`;
    document.getElementById("factor-compound").style.width = `${factorCompound}%`;
    document.getElementById("factor-compound-val").textContent = brand === "eurogrip" ? "-18% Risk" : "+10% Risk";
    refreshExplainableCentre();
  }

  [kmSlider, treadSlider, psiSlider, surfaceSelect, payloadSelect, brandSelect].forEach((input) => {
    input.addEventListener("input", evaluateRisk);
  });

  evaluateRisk();
}

/* ==========================================================================
   LAB 4: VECTOR COSINE SIMILARITY RECOMMENDER
   ========================================================================== */
const TYRE_CATALOG = [
  {
    id: "durapro",
    name: "Eurogrip Durapro Tubeless",
    segment: "COMMUTER & GIG WORKER",
    desc: "Tri-polymer heavy duty compound engineered for 45,000+ km lifespan, high puncture resistance, and all-weather city grip.",
    vector: [8.5, 9.6, 6.2, 9.4, 9.0], // [Wet, Durability, Agility, Load, Economy]
    specs: ["Size: 90/90-17", "Tread: 6.2mm", "Compound: Tri-Polymer", "Speed: P (150 km/h)"],
    price: "₹1,850"
  },
  {
    id: "climategrip",
    name: "Eurogrip Climategrip Rain-Master",
    segment: "ALL-WEATHER COMMUTER",
    desc: "Directional aqua-groove pattern designed for maximum hydroplaning resistance in severe South Indian monsoon downpours.",
    vector: [9.8, 8.2, 7.0, 8.0, 8.4],
    specs: ["Size: 80/100-18", "Tread: 5.8mm", "Compound: High-Silica", "Speed: P (150 km/h)"],
    price: "₹1,990"
  },
  {
    id: "roadhound",
    name: "Eurogrip Roadhound Sport-Touring",
    segment: "PREMIUM PERFORMANCE",
    desc: "Zero-degree steel belted radial tyre tested on Eurogrip's dedicated track for high-speed stability and razor-sharp lean angles.",
    vector: [8.8, 7.5, 9.8, 8.5, 7.2],
    specs: ["Size: 150/60-R17", "Tread: 5.0mm", "Compound: Dual-Silica Track", "Speed: W (270 km/h)"],
    price: "₹6,800"
  },
  {
    id: "beamer",
    name: "Eurogrip Beamer Y+",
    segment: "CITY SPORT & CORNERING",
    desc: "Optimized crown radius providing rapid tip-in flickability and confident dry braking for sporty naked street bikes.",
    vector: [7.8, 7.9, 9.2, 7.8, 7.6],
    specs: ["Size: 110/70-17", "Tread: 5.2mm", "Compound: Carbon-Grip", "Speed: H (210 km/h)"],
    price: "₹2,650"
  },
  {
    id: "terrabite",
    name: "Eurogrip Terrabite Dual-Purpose",
    segment: "ADVENTURE & MIXED TERRAIN",
    desc: "Aggressive block tread pattern offering unyielding traction across gravel, potholes, slush, and highway tarmac.",
    vector: [8.2, 9.4, 6.8, 9.6, 7.0],
    specs: ["Size: 120/80-18", "Tread: 7.5mm", "Compound: Cut-Resistant Rubber", "Speed: S (180 km/h)"],
    price: "₹3,400"
  }
];

const BIKE_PROFILES = {
  splendor: { name: "Hero Splendor Plus", vector: [7.0, 9.5, 5.0, 8.5, 9.8] },
  activa: { name: "Honda Activa 6G", vector: [8.0, 8.8, 6.5, 8.2, 9.0] },
  pulsar: { name: "Bajaj Pulsar 150", vector: [7.8, 8.5, 7.8, 8.0, 8.2] },
  raider: { name: "TVS Raider 125", vector: [8.0, 8.2, 8.4, 7.8, 8.5] },
  classic350: { name: "Royal Enfield Classic 350", vector: [7.5, 9.0, 6.0, 9.8, 7.5] },
  duke390: { name: "KTM 390 Duke", vector: [8.5, 6.8, 9.8, 8.2, 6.5] },
  apache_rr: { name: "TVS Apache RR 310", vector: [8.8, 6.5, 9.9, 8.0, 6.2] },
  ather: { name: "Ather 450X", vector: [8.2, 8.5, 8.0, 8.2, 9.5] }
};

const RIDING_STYLE_PROFILES = {
  economy: [6.8, 7.8, 5.5, 6.8, 9.8],
  daily_delivery: [7.6, 9.7, 5.5, 9.8, 9.2],
  monsoon_safety: [9.8, 8.0, 6.8, 8.0, 7.6],
  track_cornering: [7.8, 7.0, 9.8, 7.8, 6.5],
  touring: [8.0, 8.8, 7.4, 8.6, 7.8]
};

function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function computeVectorRecommendations() {
  const bikeKey = document.getElementById("rec-bike-model").value;
  const bike = BIKE_PROFILES[bikeKey] || BIKE_PROFILES.splendor;

  const prefWet = Number(document.getElementById("pref-wet").value);
  const prefDur = Number(document.getElementById("pref-durability").value);
  const prefAgi = Number(document.getElementById("pref-agility").value);
  const ridingStyle = document.getElementById("rec-riding-style").value;
  const styleVector = RIDING_STYLE_PROFILES[ridingStyle] || RIDING_STYLE_PROFILES.economy;

  // Blend motorcycle fit, explicit preferences, and the selected riding style.
  const queryVector = [
    (bike.vector[0] * 0.4) + (prefWet * 0.3) + (styleVector[0] * 0.3),
    (bike.vector[1] * 0.4) + (prefDur * 0.3) + (styleVector[1] * 0.3),
    (bike.vector[2] * 0.4) + (prefAgi * 0.3) + (styleVector[2] * 0.3),
    (bike.vector[3] * 0.65) + (styleVector[3] * 0.35),
    (bike.vector[4] * 0.65) + (styleVector[4] * 0.35)
  ];

  // Score all tyres
  const scoredTyres = TYRE_CATALOG.map((tyre) => {
    const sim = cosineSimilarity(queryVector, tyre.vector);
    return { ...tyre, score: sim };
  }).sort((a, b) => b.score - a.score);

  const top = scoredTyres[0];
  const alternatives = scoredTyres.slice(1, 3);

  // Render Top Match
  document.getElementById("rec-top-score").textContent = `${(top.score * 100).toFixed(1)}%`;
  document.getElementById("rec-top-segment").textContent = top.segment;
  document.getElementById("rec-top-title").textContent = top.name;
  document.getElementById("rec-top-desc").textContent = top.desc;
  document.getElementById("rec-top-specs").innerHTML = top.specs.map((s) => `<span>${s}</span>`).join("");

  // Render Alternatives
  const altContainer = document.getElementById("rec-alternatives");
  altContainer.innerHTML = alternatives.map((alt) => `
    <div class="alt-match-card">
      <div class="alt-head">
        <strong>${alt.name}</strong>
        <span class="alt-score">${(alt.score * 100).toFixed(1)}% match</span>
      </div>
      <p>${alt.desc}</p>
      <div class="alt-footer">
        <small>${alt.segment}</small>
        <b>${alt.price}</b>
      </div>
    </div>
  `).join("");

  // Render Vector Dimension Breakdown
  const dimNames = ["Wet Grip", "Durability", "Cornering Agility", "Load Capacity", "Rolling Economy"];
  const vectorContainer = document.getElementById("vector-bars");
  vectorContainer.innerHTML = dimNames.map((name, idx) => {
    const queryVal = (queryVector[idx] * 10).toFixed(0);
    const tyreVal = (top.vector[idx] * 10).toFixed(0);
    return `
      <div class="v-bar-item">
        <div class="v-bar-labels">
          <span>${name}</span>
          <small>Req: ${queryVal}% | Spec: ${tyreVal}%</small>
        </div>
        <div class="v-bar-track">
          <i style="width:${tyreVal}%; background: ${idx === 1 ? '#ff5a2a' : idx === 2 ? '#d9ff43' : '#4f62ff'}"></i>
        </div>
      </div>
    `;
  }).join("");
  refreshExplainableCentre();
  return top;
}

function initVectorRecommender() {
  document.getElementById("rec-compute-btn").addEventListener("click", () => {
    const top = computeVectorRecommendations();
    const bikeKey = document.getElementById("rec-bike-model").value;
    const bike = BIKE_PROFILES[bikeKey] || BIKE_PROFILES.splendor;
    const ridingStyle = document.getElementById("rec-riding-style").selectedOptions[0].textContent;
    const status = document.getElementById("rec-compute-status");
    status.textContent = `Best match for ${bike.name}: ${top.name} (${(top.score * 100).toFixed(1)}%). See the comparison on the right.`;
    status.hidden = false;
  });
  ["rec-bike-model", "rec-riding-style", "pref-wet", "pref-durability", "pref-agility"].forEach((id) => {
    document.getElementById(id).addEventListener("change", computeVectorRecommendations);
    document.getElementById(id).addEventListener("input", computeVectorRecommendations);
  });
  computeVectorRecommendations();
}

const EXPLAINABLE_STRATEGIES = [
  {
    id: "blended",
    name: "Balanced",
    benefit: "Diversifies investment across rider segments and shared-brand activity.",
    tradeoff: "May underweight the best-performing channel in the short term."
  },
  {
    id: "gig",
    name: "Gig-worker led",
    benefit: "Focuses on high-mileage riders, uptime and Rider Card acquisition.",
    tradeoff: "Can reduce commuter retail coverage and premium brand exposure."
  },
  {
    id: "retail",
    name: "Retail footprint",
    benefit: "Prioritizes dealer participation and Tyre Finder availability.",
    tradeoff: "Store activation takes time and requires reliable dealer execution."
  },
  {
    id: "premium",
    name: "Premium proof",
    benefit: "Invests in club demos, creators and track evidence for premium riders.",
    tradeoff: "Reach can be narrower and cost per engaged rider can be higher."
  }
];

function initExplainableCentre() {
  refreshExplainableCentre();
}

function refreshExplainableCentre() {
  if (!document.getElementById("explainable-summary")) return;

  const bikeKey = document.getElementById("rec-bike-model").value;
  const bike = BIKE_PROFILES[bikeKey] || BIKE_PROFILES.splendor;
  const ridingStyle = document.getElementById("rec-riding-style").selectedOptions[0].textContent;
  const topTyre = document.getElementById("rec-top-title").textContent;
  const matchScore = document.getElementById("rec-top-score").textContent;
  const riskPercent = document.getElementById("risk-prob-val").textContent;
  const riskLevel = document.getElementById("risk-level-badge").textContent.toLowerCase();
  const kmeansStatus = document.getElementById("kmeans-status").textContent;
  const objectiveSelect = document.getElementById("opt-objective");
  const objective = EXPLAINABLE_STRATEGIES.find((strategy) => strategy.id === mmmState.objective) || EXPLAINABLE_STRATEGIES[0];
  const budgetSplit = CHANNELS_MMM.map((channel, index) =>
    `${channel.name} ${Math.round(mmmState.spends[index] / mmmState.totalBudget * 100)}%`
  ).join(" · ");

  document.getElementById("explainable-confidence-label").textContent =
    "Illustrative outputs · not calibrated confidence";
  document.getElementById("explainable-summary").textContent =
    `For the ${bike.name} and the selected riding priorities, cosine similarity ranks ${topTyre} highest (${matchScore}). The tyre-health model estimates ${riskPercent} (${riskLevel}) for the current usage and condition inputs. The budget model is optimizing for “${objectiveSelect.options[objectiveSelect.selectedIndex].text}”.`;

  const details = document.getElementById("explainable-model-details");
  details.replaceChildren();
  [
    ["Tyre recommendation", `${topTyre} · ${matchScore} cosine similarity for ${bike.name} and ${ridingStyle.toLowerCase()}. This is a relative vector match, not a confirmed fitment.`],
    ["Tyre-health estimate", `${riskPercent} model-estimated risk (${riskLevel}); ${document.getElementById("risk-rul-km").textContent.trim()} estimated remaining life.`],
    ["Rider clusters", `${kmeansState.n} synthetic profiles · K=${kmeansState.k} · ${kmeansStatus}. The groups are based on daily kilometres and performance-affinity scores.`],
    ["Current channel mix", `₹${mmmState.totalBudget.toFixed(1)} Cr · ${budgetSplit}. Objective: ${objective.name.toLowerCase()}.`]
  ].forEach(([title, text]) => {
    const item = document.createElement("article");
    const heading = document.createElement("h4");
    heading.textContent = title;
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    item.append(heading, paragraph);
    details.append(item);
  });

  renderExplainableBars(
    document.getElementById("cluster-feature-importance"),
    calculateClusterFeatureImportance()
  );
  renderExplainableBars(
    document.getElementById("risk-feature-importance"),
    calculateRiskFeatureImportance()
  );
  document.getElementById("strategy-current-label").textContent =
    `Current objective: ${objective.name} · ₹${mmmState.totalBudget.toFixed(1)} Cr`;
  renderStrategyComparison();
}

function calculateClusterFeatureImportance() {
  const kmVariance = { label: "Daily distance", value: 0 };
  const performanceVariance = { label: "Performance affinity", value: 0 };
  const { data, assignments, centroids } = kmeansState;
  data.forEach((point, index) => {
    const centroid = centroids[assignments[index]] || centroids[0];
    if (!centroid) return;
    kmVariance.value += ((point.km - centroid.km) / 180) ** 2;
    performanceVariance.value += ((point.perf - centroid.perf) / 10) ** 2;
  });
  const sum = kmVariance.value + performanceVariance.value;
  if (!sum) {
    kmVariance.value = 50;
    performanceVariance.value = 50;
  } else {
    kmVariance.value = kmVariance.value / sum * 100;
    performanceVariance.value = performanceVariance.value / sum * 100;
  }
  return [kmVariance, performanceVariance];
}

function calculateRiskFeatureImportance() {
  const km = Number(document.getElementById("risk-km-slider").value);
  const tread = Number(document.getElementById("risk-tread-slider").value);
  const psi = Number(document.getElementById("risk-psi-slider").value);
  const surface = document.getElementById("risk-surface").value;
  const payload = document.getElementById("risk-payload").value;
  const brand = document.getElementById("risk-tyre-brand").value;
  const contributions = [
    { label: "Daily distance", value: km / 100 * 0.95 },
    { label: "Tread depletion", value: 1.6 / Math.max(0.6, tread) * 1.35 },
    { label: "Pressure deviation", value: Math.abs(psi) * 0.18 },
    { label: "Road surface", value: ({ city: -0.4, rough: 0.65, monsoon: 0.85, unpaved: 1.1 })[surface] || 0 },
    { label: "Payload", value: ({ solo: -0.3, delivery: 0.45, pillion: 0.8 })[payload] || 0 },
    { label: "Tyre brand", value: ({ generic: 0.95, eurogrip: -0.85, competitor: 0.1 })[brand] || 0 }
  ];
  const total = contributions.reduce((sum, item) => sum + Math.abs(item.value), 0);
  return contributions.map((item) => ({
    label: `${item.label}${item.value < 0 ? " · protective" : ""}`,
    value: total ? Math.abs(item.value) / total * 100 : 0,
    detail: `${item.value > 0 ? "+" : ""}${item.value.toFixed(2)} log-odds`
  }));
}

function renderExplainableBars(container, features) {
  container.replaceChildren();
  features.forEach((feature) => {
    const row = document.createElement("div");
    row.className = "explainable-bar-row";
    const header = document.createElement("div");
    header.className = "explainable-bar-label";
    const label = document.createElement("span");
    label.textContent = feature.label;
    const value = document.createElement("strong");
    value.textContent = feature.detail || `${feature.value.toFixed(1)}%`;
    header.append(label, value);
    const track = document.createElement("div");
    track.className = "explainable-bar-track";
    track.setAttribute("role", "img");
    track.setAttribute("aria-label", `${feature.label}: ${feature.value.toFixed(1)} percent relative contribution`);
    const fill = document.createElement("i");
    fill.style.width = `${Math.max(0, Math.min(100, feature.value))}%`;
    track.append(fill);
    row.append(header, track);
    container.append(row);
  });
}

function renderStrategyComparison() {
  const container = document.getElementById("strategy-comparison-grid");
  container.replaceChildren();
  EXPLAINABLE_STRATEGIES.forEach((strategy) => {
    const card = document.createElement("article");
    card.className = `strategy-comparison-card${strategy.id === mmmState.objective ? " is-current" : ""}`;
    if (strategy.id === mmmState.objective) card.setAttribute("aria-current", "true");
    const title = document.createElement("h4");
    title.textContent = strategy.name;
    const badge = document.createElement("span");
    badge.textContent = strategy.id === mmmState.objective ? "CURRENT" : "ALTERNATIVE";
    const advantageLabel = document.createElement("small");
    advantageLabel.textContent = "ADVANTAGE";
    const advantage = document.createElement("p");
    advantage.textContent = strategy.benefit;
    const tradeoffLabel = document.createElement("small");
    tradeoffLabel.textContent = "TRADE-OFF";
    const tradeoff = document.createElement("p");
    tradeoff.textContent = strategy.tradeoff;
    card.append(title, badge, advantageLabel, advantage, tradeoffLabel, tradeoff);
    container.append(card);
  });
}

/* ==========================================================================
   LAB 5: MONTE CARLO STOCHASTIC RISK ENGINE
   ========================================================================== */
let mcResults = [];

function runMonteCarloSimulations() {
  const runs = Number(document.getElementById("mc-runs-slider").value || 1000);
  const monsoon = document.getElementById("mc-monsoon").value;
  const competitor = document.getElementById("mc-competitor").value;
  const garageVar = Number(document.getElementById("mc-garage-slider").value || 18) / 100;
  const fuelSqueeze = Number(document.getElementById("mc-fuel-slider").value || 8) / 100;

  // Box-Muller transform for gaussian random numbers
  const randNorm = (mean, std) => {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return mean + Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v) * std;
  };

  const results = [];
  const basePipeline = 108.0; // ₹108 Cr median gross pipeline from ₹60 Cr spend

  const monsoonMultipliers = { normal: 1.0, severe: 1.12, delayed: 0.94 };
  const competitorDeductions = { mild: 0, aggressive: -8.5, fleet_lock: -5.0 };

  const monsoonMod = monsoonMultipliers[monsoon] || 1.0;
  const compMod = competitorDeductions[competitor] || 0;

  for (let i = 0; i < runs; i++) {
    // Stochastic components
    const garageNoise = randNorm(1.0, garageVar);
    const macroNoise = randNorm(1.0, 0.08);
    const inflationDrag = 1.0 - fuelSqueeze * randNorm(0.5, 0.2);

    let val = (basePipeline * monsoonMod + compMod) * garageNoise * macroNoise * inflationDrag;
    val = Math.max(68, Math.min(155, val));
    results.push(val);
  }

  results.sort((a, b) => a - b);
  mcResults = results;

  // Compute statistical percentiles
  const p05 = results[Math.floor(runs * 0.05)];
  const p10 = results[Math.floor(runs * 0.10)];
  const p50 = results[Math.floor(runs * 0.50)];
  const p90 = results[Math.floor(runs * 0.90)];

  // Expected Shortfall (CVaR 95%) = average of bottom 5%
  const tail = results.slice(0, Math.floor(runs * 0.05));
  const cVar = tail.reduce((a, b) => a + b, 0) / Math.max(1, tail.length);

  document.getElementById("mc-var").innerHTML = `₹${p05.toFixed(1)}<span> CR</span>`;
  document.getElementById("mc-cvar").innerHTML = `₹${cVar.toFixed(1)}<span> CR</span>`;
  document.getElementById("mc-p50").innerHTML = `₹${p50.toFixed(1)}<span> CR</span>`;
  document.getElementById("mc-p90").innerHTML = `₹${p90.toFixed(1)}<span> CR</span>`;
  document.getElementById("mc-status-pill").textContent = `${runs.toLocaleString("en-IN")} Runs Simulated`;

  drawMonteCarlo();
}

function drawMonteCarlo() {
  const canvas = document.getElementById("monte-carlo-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  if (mcResults.length === 0) return;

  const padL = 40, padR = 20, padT = 20, padB = 30;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  // 24 histogram bins between 65 and 150 Cr
  const binCount = 24;
  const minVal = 65, maxVal = 150;
  const binWidth = (maxVal - minVal) / binCount;
  const bins = new Array(binCount).fill(0);

  mcResults.forEach((v) => {
    const idx = Math.min(binCount - 1, Math.max(0, Math.floor((v - minVal) / binWidth)));
    bins[idx]++;
  });

  const maxFreq = Math.max(...bins, 1);

  // Draw histogram bars
  const barPx = plotW / binCount;
  for (let b = 0; b < binCount; b++) {
    const count = bins[b];
    const bHeight = (count / maxFreq) * plotH;
    const x = padL + b * barPx;
    const y = padT + plotH - bHeight;
    const centerVal = minVal + (b + 0.5) * binWidth;

    // Gradient styling: red for tail risk (<85 Cr), blue for median, neon acid for bull case (>120 Cr)
    ctx.fillStyle = centerVal < 90 ? "#ff5a2a" : centerVal > 120 ? "#d9ff43" : "#4f62ff";
    ctx.fillRect(x + 1, y, barPx - 2, bHeight);
  }

  // Draw P50 Median Line
  const p50 = mcResults[Math.floor(mcResults.length * 0.50)];
  const p50X = padL + ((p50 - minVal) / (maxVal - minVal)) * plotW;
  ctx.strokeStyle = "#111210";
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(p50X, padT);
  ctx.lineTo(p50X, padT + plotH);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "#111210";
  ctx.font = "bold 9px 'Space Mono', monospace";
  ctx.fillText(`Median P50 (₹${p50.toFixed(0)} Cr)`, p50X + 6, padT + 14);
}

function initMonteCarlo() {
  const runsSlider = document.getElementById("mc-runs-slider");
  const runsDisplay = document.getElementById("mc-runs-display");
  const garageSlider = document.getElementById("mc-garage-slider");
  const garageDisplay = document.getElementById("mc-garage-display");
  const fuelSlider = document.getElementById("mc-fuel-slider");
  const fuelDisplay = document.getElementById("mc-fuel-display");

  if (runsSlider) {
    runsSlider.addEventListener("input", (e) => {
      runsDisplay.textContent = `${Number(e.target.value).toLocaleString("en-IN")} Runs`;
    });
  }
  if (garageSlider) {
    garageSlider.addEventListener("input", (e) => {
      garageDisplay.textContent = `±${e.target.value}% Variance`;
    });
  }
  if (fuelSlider) {
    fuelSlider.addEventListener("input", (e) => {
      fuelDisplay.textContent = `+${e.target.value}% Inflation Squeeze`;
    });
  }

  const runBtn = document.getElementById("mc-run-btn");
  if (runBtn) runBtn.addEventListener("click", runMonteCarloSimulations);

  runMonteCarloSimulations();
}

/* ==========================================================================
   LAB 6: STRATEGY & PITCH COPILOT
   ========================================================================== */
const COPILOT_PRESETS = {
  competitor: {
    title: "Competitor Price Aggression Scenario",
    thesis: "When competitors like MRF or CEAT initiate aggressive 10–15% retail discounting in Tier-2 commuter hubs, Eurogrip should <strong>avoid price-matching</strong>. Price matching erodes gross margins across the ₹15 Cr commuter allocation. Instead, counter with high-stickiness mechanic rewards and the WhatsApp Tyre Finder, proving exact bike fitment rather than competing on commodity pricing.",
    stat1: "+14.2% Margin", stat2: "88.5% Mechanic Retention", stat3: "MODERATE RISK",
    realign: "Shift 5% of digital spend into on-ground mechanic incentive tiering and pit-stop check camps. Increase mechanic reward payout per verified fit from ₹80 to ₹120."
  },
  monsoon: {
    title: "Severe Monsoon & Climategrip Demand Surge",
    thesis: "Severe monsoon downpours across South India (Chennai, Bengaluru, Kochi) cause a <strong>34% spike in two-wheeler slip incidents</strong> and wet-braking anxiety. Gig workers cannot afford downtime during high-demand rainy food delivery surges. Eurogrip should heavily activate Climategrip Rain-Master wet-braking evidence.",
    stat1: "+28.4% Demand", stat2: "Zero Lost Shifts", stat3: "LOW RISK",
    realign: "Increase digital video spend in Tamil and Kannada showing real 100km/h braking distance comparisons on Eurogrip's dedicated test track. Stock 2,500 partner shops with Climategrip inventory."
  },
  pitch: {
    title: "60-Second VC Investment Memorandum",
    thesis: "TVS Eurogrip is transforming from an OEM supplier into an algorithmic consumer brand across India's 200M+ two-wheeler mobility market. By proving one brand promise ('Grip you can trust') differently for Commuters, Gig Fleets, and Premium Riders with an institutional ₹60 Cr allocation, we achieve a <strong>4.8x LTV:CAC ratio</strong> and 2.8-month dealer payback.",
    stat1: "4.8x LTV:CAC", stat2: "₹108 Cr Pipeline", stat3: "HIGH CAPITAL EFFICIENCY",
    realign: "Execute the 12-month sequence: Prove in Chennai & Bengaluru (Months 0-3), Scale to 10 cities (Months 4-9), and Reallocate via Hill response curves (Months 10-12)."
  },
  pilot_gap: {
    title: "Chennai vs Bengaluru Pilot Outperformance",
    thesis: "If Chennai pilot yields 30% higher mechanic conversion than Bengaluru due to stronger dealer density, reallocate ₹3.5 Cr from Bengaluru digital media to scale Chennai's hub model across Madurai and Coimbatore ahead of Phase 2.",
    stat1: "+30% Conversion", stat2: "₹3.5 Cr Reallocated", stat3: "LOW EXECUTION RISK",
    realign: "Accelerate 10-city rollout playbook by franchising Chennai's top 50 mechanic reward workshops into certified Eurogrip pit-stop hubs."
  }
};

function initCopilot() {
  document.querySelectorAll(".copilot-chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      const q = btn.dataset.query;
      const data = COPILOT_PRESETS[q];
      if (!data) return;

      document.getElementById("copilot-query-title").textContent = data.title;
      document.getElementById("cp-thesis").innerHTML = data.thesis;
      document.getElementById("cp-stat-1").textContent = data.stat1;
      document.getElementById("cp-stat-2").textContent = data.stat2;
      document.getElementById("cp-stat-3").textContent = data.stat3;
      document.getElementById("cp-realign").textContent = data.realign;
      document.getElementById("copilot-prompt-input").value = btn.textContent;
    });
  });

  const genBtn = document.getElementById("copilot-generate-btn");
  if (genBtn) {
    genBtn.addEventListener("click", () => {
      const prompt = document.getElementById("copilot-prompt-input").value.trim();
      if (!prompt) return;

      document.getElementById("copilot-query-title").textContent = `Analysis: “${prompt.slice(0, 36)}…”`;
      document.getElementById("cp-thesis").innerHTML = `Strategically analyzed constraint: “${prompt}”. The Eurogrip Marketing Mix Model projects optimal outcome by keeping core focus on the ₹60 Cr segment-led architecture while adjusting tactical channel weights.`;
      document.getElementById("cp-stat-1").textContent = "+11.5% Fit";
      document.getElementById("cp-stat-2").textContent = "91/100 Score";
      document.getElementById("cp-stat-3").textContent = "STABLE";
      document.getElementById("cp-realign").textContent = `Recommended action: Synchronize target adjustments to the Campaign Workspace and verify partner garage inventory.`;
    });
  }

  const applyBtn = document.getElementById("copilot-apply-btn");
  if (applyBtn) {
    applyBtn.addEventListener("click", () => {
      if (window.EurogripStore) {
        window.EurogripStore.update({
          prioritySegment: "Gig worker",
          appliedOptimization: "Copilot Tactical Rebalance"
        });
      }
      window.location.href = "workspace.html";
    });
  }
}
