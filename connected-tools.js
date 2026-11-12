(function () {
  const MASTER_KEY = "eurogrip_master_state_v1";
  const WORKSPACE_KEY = "eurogrip-workspace-route";
  const defaults = {
    projectName: "Eurogrip National Strategy",
    budget: 60,
    prioritySegment: "Gig worker",
    fleetTelemetry: { km: 85, tread: 2.8, psi: -6 },
    dealerProgress: { completed: 2, total: 6, percent: 33 }
  };
  const segmentKeys = { Commuter: "commuter", "Gig worker": "gig", "Premium rider": "premium" };

  function readStoredState() {
    try {
      return { ...defaults, ...JSON.parse(localStorage.getItem(MASTER_KEY) || "{}") };
    } catch (error) {
      console.warn("Could not read the saved Eurogrip plan.", error);
      return { ...defaults };
    }
  }

  function updateStoredState(patch) {
    if (window.EurogripStore) {
      window.EurogripStore.update(patch);
      return;
    }
    const state = readStoredState();
    localStorage.setItem(MASTER_KEY, JSON.stringify({
      ...state,
      ...patch,
      lastUpdated: new Date().toISOString()
    }));
  }

  function readWorkspaceState() {
    try {
      return JSON.parse(localStorage.getItem(WORKSPACE_KEY) || "{}");
    } catch (error) {
      console.warn("Could not read the saved campaign workspace.", error);
      return {};
    }
  }

  const segmentSelect = document.getElementById("tool-rider-segment");
  const savedState = readStoredState();
  segmentSelect.value = segmentKeys[savedState.prioritySegment] ? savedState.prioritySegment : "Gig worker";

  document.getElementById("tool-save-rider").addEventListener("click", () => {
    const segment = segmentSelect.value;
    const workspace = readWorkspaceState();
    updateStoredState({ prioritySegment: segment });
    localStorage.setItem(WORKSPACE_KEY, JSON.stringify({
      ...workspace,
      segment,
      budget: workspace.budget || savedState.budget || defaults.budget
    }));
    document.getElementById("tool-rider-status").textContent = `${segment} saved. Opening segment strategy…`;
    window.location.href = `segments.html?segment=${segmentKeys[segment]}`;
  });

  const budgetSlider = document.getElementById("tool-budget");
  const budgetValue = document.getElementById("tool-budget-value");
  budgetSlider.value = Math.min(120, Math.max(30, Number(savedState.budget) || defaults.budget));
  function updateBudgetPreview() {
    budgetValue.textContent = `₹${budgetSlider.value} Cr`;
  }
  budgetSlider.addEventListener("input", updateBudgetPreview);
  updateBudgetPreview();

  document.getElementById("tool-apply-budget").addEventListener("click", () => {
    const budget = Number(budgetSlider.value);
    updateStoredState({ budget });
    document.getElementById("tool-budget-status").textContent = `₹${budget} Cr linked to the investment model.`;
    window.location.href = "budget.html";
  });

  document.getElementById("tool-run-health").addEventListener("click", () => {
    const fields = ["tool-km", "tool-tread", "tool-psi"].map((id) => document.getElementById(id));
    if (!fields.every((field) => field.reportValidity())) return;
    const [kmField, treadField, psiField] = fields;
    const telemetry = {
      km: Number(kmField.value),
      tread: Number(treadField.value),
      psi: Number(psiField.value)
    };
    if (window.EurogripStore) {
      window.EurogripStore.applyFleetTelemetry(telemetry);
    } else {
      const state = readStoredState();
      localStorage.setItem(MASTER_KEY, JSON.stringify({
        ...state,
        fleetTelemetry: { ...state.fleetTelemetry, ...telemetry },
        lastUpdated: new Date().toISOString()
      }));
    }
    document.getElementById("tool-health-status").textContent = "Ride profile saved. Opening the wear-risk model…";
    window.location.href = "intelligence.html#risk";
  });

  function updateDealerReadiness(state = readStoredState()) {
    const progress = state.dealerProgress || defaults.dealerProgress;
    const completed = Number(progress.completed) || 0;
    const total = Math.max(1, Number(progress.total) || defaults.dealerProgress.total);
    const percent = Math.min(100, Math.round((completed / total) * 100));
    document.getElementById("tool-dealer-progress").style.width = `${percent}%`;
    document.getElementById("tool-dealer-label").textContent = `${completed} of ${total} actions complete · ${percent}% ready`;
  }
  updateDealerReadiness(savedState);
  window.addEventListener("eurogrip:state-change", (event) => updateDealerReadiness(event.detail));

  document.getElementById("tool-open-campaign").addEventListener("click", () => {
    const prompt = document.getElementById("tool-campaign-prompt").value.trim();
    if (!prompt) {
      document.getElementById("tool-campaign-status").textContent = "Add a campaign focus to start your plan.";
      document.getElementById("tool-campaign-prompt").focus();
      return;
    }
    const segment = segmentSelect.value;
    const state = readStoredState();
    const workspace = {
      budget: Number(state.budget) || defaults.budget,
      shops: 5000,
      cards: 50000,
      trials: 100,
      months: "12",
      segment,
      prompt
    };
    localStorage.setItem("eurogrip-workspace-seed", JSON.stringify(workspace));
    localStorage.setItem("eurogrip-project-name", "Eurogrip Campaign Brief");
    updateStoredState({ prioritySegment: segment, projectName: "Eurogrip Campaign Brief" });
    document.getElementById("tool-campaign-status").textContent = "Brief saved. Opening your workspace…";
    window.location.href = "workspace.html";
  });
})();
