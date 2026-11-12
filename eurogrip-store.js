/**
 * Eurogrip Unified Reactive Data Store & Interconnection Bus
 * Connects all 7 platform routes and features into one synchronized system:
 * Strategy (Challenge/Segments) <-> AI/ML Engines <-> Budget <-> Roadmap <-> Workspace
 */

(function () {
  const STORAGE_KEY = "eurogrip_master_state_v1";

  const DEFAULT_STATE = {
    projectName: "Eurogrip National Strategy",
    budget: 60,
    allocation: { commuter: 25, gig: 30, premium: 30, shared: 15 },
    kpis: { shops: 5000, cards: 50000, trials: 100 },
    months: 12,
    goal: "balanced",
    prioritySegment: "Gig worker",
    selectedBike: "splendor",
    matchedTyre: { id: "durapro", name: "Eurogrip Durapro", matchScore: 96.8 },
    fleetTelemetry: { km: 85, tread: 2.8, psi: -6, riskPct: 28, rulKm: 14200, savingsMonth: 2450 },
    dealerProgress: { completed: 2, total: 6, percent: 33 },
    appliedOptimization: "Baseline Case Study", // or "Gradient Descent MMM Optimal", "K-Means Empirical"
    blendedRoas: 3.42,
    planFitScore: 92,
    lastUpdated: new Date().toISOString()
  };

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_STATE };
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_STATE, ...parsed };
    } catch (_) {
      return { ...DEFAULT_STATE };
    }
  }

  let currentState = loadState();

  function saveState() {
    currentState.lastUpdated = new Date().toISOString();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState));
    } catch (_) {}
    window.dispatchEvent(new CustomEvent("eurogrip:state-change", { detail: currentState }));
    updateSyncBar();
  }

  const EurogripStore = {
    get() {
      return { ...currentState };
    },

    update(partial) {
      currentState = { ...currentState, ...partial };
      // Recalculate derived metrics when core variables change
      if (partial.budget !== undefined || partial.allocation !== undefined) {
        this.recalculateDerived();
      }
      saveState();
      return currentState;
    },

    recalculateDerived() {
      const b = currentState.budget;
      const alloc = currentState.allocation;
      const commuterSpend = (alloc.commuter / 100) * b;
      const gigSpend = (alloc.gig / 100) * b;
      const premSpend = (alloc.premium / 100) * b;

      // Dynamic interconnected KPI projections
      currentState.kpis = {
        shops: Math.round(5000 * (commuterSpend / 15)),
        cards: Math.round(50000 * (gigSpend / 18)),
        trials: Math.round(100 * (premSpend / 18))
      };

      // Plan fit score calculation based on balance & dealer execution readiness
      const dealerBoost = (currentState.dealerProgress.percent || 33) * 0.15;
      const allocVariance = Math.abs(alloc.commuter - 25) + Math.abs(alloc.gig - 30) + Math.abs(alloc.premium - 30);
      currentState.planFitScore = Math.max(65, Math.min(98, Math.round(88 - allocVariance * 0.3 + dealerBoost)));

      // Dynamic ROAS calculation
      currentState.blendedRoas = Number((2.8 + (currentState.planFitScore / 100) * 0.9).toFixed(2));
    },

    // 1. K-Means clustering pushes empirical segment ratios across the system
    applyKMeansClusters(clusterPcts, source = "K-Means Unsupervised Clustering") {
      currentState.allocation = {
        commuter: clusterPcts.commuter || 25,
        gig: clusterPcts.gig || 35,
        premium: clusterPcts.premium || 25,
        shared: Math.max(5, 100 - (clusterPcts.commuter || 25) - (clusterPcts.gig || 35) - (clusterPcts.premium || 25))
      };
      currentState.appliedOptimization = source;
      this.recalculateDerived();
      saveState();
      showSyncNotification(`K-Means Cohort Ratios Synced: Commuter ${currentState.allocation.commuter}% / Gig ${currentState.allocation.gig}% / Premium ${currentState.allocation.premium}%`);
    },

    // 2. Gradient Descent MMM optimization pushes optimal spends everywhere
    applyGradientDescent(optimalSpends, totalBudget) {
      currentState.budget = totalBudget;
      const cPct = Math.round((optimalSpends[0] / totalBudget) * 100);
      const gPct = Math.round((optimalSpends[1] / totalBudget) * 100);
      const pPct = Math.round((optimalSpends[2] / totalBudget) * 100);
      const sPct = 100 - cPct - gPct - pPct;

      currentState.allocation = { commuter: cPct, gig: gPct, premium: pPct, shared: sPct };
      currentState.appliedOptimization = "Gradient Descent MMM (Optimal Saturation)";
      this.recalculateDerived();
      saveState();
      showSyncNotification(`Mathematical Optimum Applied: ₹${totalBudget} Cr budget synchronized across all pages`);
    },

    // 3. Vector Match pushes matched tyre to fleet & dealer inventories
    applyTyreMatch(tyre, bikeName) {
      currentState.matchedTyre = { id: tyre.id, name: tyre.name, matchScore: Number((tyre.score * 100).toFixed(1)) };
      currentState.selectedBike = bikeName;
      saveState();
      showSyncNotification(`Vector Recommender Linked: ${tyre.name} added to Dealer Campaign Inventory`);
    },

    // 4. Fleet Risk Telemetry updates shift savings and gig targets
    applyFleetTelemetry(telemetry) {
      currentState.fleetTelemetry = { ...currentState.fleetTelemetry, ...telemetry };
      saveState();
    },

    // 5. Dealer Launch progress feeds into execution risk
    applyDealerProgress(completed, total) {
      const pct = Math.round((completed / total) * 100);
      currentState.dealerProgress = { completed, total, percent: pct };
      this.recalculateDerived();
      saveState();
    },

    subscribe(callback) {
      window.addEventListener("eurogrip:state-change", (e) => callback(e.detail));
      // Call immediately with initial state
      callback(currentState);
    },

    resetToDefault() {
      currentState = { ...DEFAULT_STATE };
      saveState();
      showSyncNotification("Project reset to TVS Eurogrip source strategy");
    }
  };

  /* ==========================================================================
     UNIVERSAL FLOATING SCENARIO SYNC BAR
     ========================================================================== */
  function createSyncBarDOM() {
    if (document.getElementById("eurogrip-sync-bar")) return;

    const bar = document.createElement("aside");
    bar.id = "eurogrip-sync-bar";
    bar.className = "sync-bar";
    bar.setAttribute("aria-label", "Cross-feature sync status");
    bar.innerHTML = `
      <div class="sync-bar-inner">
        <div class="sync-left">
          <span class="sync-live-badge"><i class="pulse-dot"></i> LIVE LINKED</span>
          <div class="sync-scenario-meta">
            <strong id="sb-project-name">Eurogrip Strategy</strong>
            <small id="sb-opt-label">Baseline Allocation</small>
          </div>
        </div>

        <div class="sync-metrics">
          <div class="sb-metric">
            <span>BUDGET</span>
            <strong id="sb-budget">₹60 CR</strong>
          </div>
          <div class="sb-metric">
            <span>NETWORK</span>
            <strong id="sb-shops">5,000 Shops</strong>
          </div>
          <div class="sb-metric">
            <span>RIDER CARDS</span>
            <strong id="sb-cards">50K Issued</strong>
          </div>
          <div class="sb-metric">
            <span>LTV:CAC</span>
            <strong id="sb-roas">4.8x Ratio</strong>
          </div>
          <div class="sb-metric">
            <span>PLAN FIT</span>
            <strong id="sb-fit" class="fit-score">92/100</strong>
          </div>
        </div>

        <div class="sync-actions">
          <button type="button" class="sb-action-btn" id="sb-open-hub" title="Open Connected Strategy Hub">
            Connected Actions ▾
          </button>
        </div>
      </div>

      <!-- Drawer Panel -->
      <div class="sync-drawer" id="sync-drawer" hidden>
        <div class="sync-drawer-head">
          <span>INTERCONNECTED PLATFORM TELEMETRY</span>
          <button type="button" id="sb-close-drawer">&times;</button>
        </div>
        <div class="sync-drawer-grid">
          <div class="drawer-step">
            <small>01 / STRATEGY</small>
            <h4>Segments &amp; Challenge</h4>
            <p>Priority segment: <b id="dw-segment">Gig worker</b></p>
            <a href="segments.html">Adjust Segment Strategy →</a>
          </div>

          <div class="drawer-step">
            <small>02 / AI &amp; ML ENGINE</small>
            <h4>Predictive Optimizers</h4>
            <p>Current model: <b id="dw-model">Hill Saturation MMM</b></p>
            <a href="intelligence.html#optimizer">Run Gradient Descent ✦</a>
          </div>

          <div class="drawer-step">
            <small>03 / INVESTMENT</small>
            <h4>₹60 Cr Mix Model</h4>
            <p>Active ROAS: <b id="dw-roas">3.42x</b></p>
            <a href="budget.html">Inspect Venture CAC/LTV →</a>
          </div>

          <div class="drawer-step">
            <small>04 / DEALER NETWORK</small>
            <h4>12-Month Rollout</h4>
            <p>Readiness: <b id="dw-readiness">33% complete</b></p>
            <a href="roadmap.html">View City Dealer Readiness →</a>
          </div>

          <div class="drawer-step">
            <small>05 / WORKSPACE</small>
            <h4>Scenario Control Room</h4>
            <p>Forecast: <b id="dw-shops">5,000 shops target</b></p>
            <a href="workspace.html">Simulate &amp; Export Brief →</a>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(bar);

    // Event listeners
    const toggleBtn = bar.querySelector("#sb-open-hub");
    const closeBtn = bar.querySelector("#sb-close-drawer");
    const drawer = bar.querySelector("#sync-drawer");

    toggleBtn.addEventListener("click", () => {
      const isHidden = drawer.hidden;
      drawer.hidden = !isHidden;
      toggleBtn.classList.toggle("active", isHidden);
    });

    closeBtn.addEventListener("click", () => {
      drawer.hidden = true;
      toggleBtn.classList.remove("active");
    });
  }

  function updateSyncBar() {
    const s = currentState;
    const setName = document.getElementById("sb-project-name");
    if (!setName) return;

    setName.textContent = s.projectName || "Eurogrip Growth Plan";
    document.getElementById("sb-opt-label").textContent = s.appliedOptimization || "Synchronized Model";
    document.getElementById("sb-budget").textContent = `₹${s.budget} CR`;
    document.getElementById("sb-shops").textContent = `${s.kpis.shops.toLocaleString("en-IN")} Shops`;
    document.getElementById("sb-cards").textContent = `${(s.kpis.cards / 1000).toFixed(0)}K Cards`;
    document.getElementById("sb-roas").textContent = `${s.blendedRoas}x ROAS`;

    const fitEl = document.getElementById("sb-fit");
    fitEl.textContent = `${s.planFitScore}/100`;
    fitEl.style.color = s.planFitScore >= 85 ? "#d9ff43" : "#ff5a2a";

    // Drawer labels
    const dwSeg = document.getElementById("dw-segment");
    if (dwSeg) {
      dwSeg.textContent = s.prioritySegment;
      document.getElementById("dw-model").textContent = s.appliedOptimization;
      document.getElementById("dw-roas").textContent = `${s.blendedRoas}x blended`;
      document.getElementById("dw-readiness").textContent = `${s.dealerProgress.percent}% verified`;
      document.getElementById("dw-shops").textContent = `${s.kpis.shops.toLocaleString("en-IN")} shops / ${(s.kpis.cards / 1000).toFixed(0)}K cards`;
    }
  }

  function showSyncNotification(message) {
    let toast = document.querySelector(".sync-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "sync-toast";
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<span class="toast-dot"></span> ${message}`;
    toast.classList.add("visible");
    clearTimeout(showSyncNotification.timer);
    showSyncNotification.timer = setTimeout(() => toast.classList.remove("visible"), 3200);
  }

  function initializeStoreUI() {
    createSyncBarDOM();
    updateSyncBar();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeStoreUI, { once: true });
  } else {
    initializeStoreUI();
  }

  window.EurogripStore = EurogripStore;
  window.dispatchEvent(new CustomEvent("eurogrip:store-ready"));
})();
