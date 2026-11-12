const dealerTasks = document.querySelectorAll("[data-dealer-task]");
const progressBar = document.getElementById("dealer-progress-bar");
const progressLabel = document.getElementById("dealer-progress-label");
const milestoneStatus = document.getElementById("launch-unlocks-status");
const milestoneList = document.getElementById("launch-milestones");
const unlockPanel = document.getElementById("launch-unlocks");
const dealerKey = "eurogrip-dealer-launch";
const milestones = [
  {
    count: 2,
    name: "Pilot Kit",
    description: "A focused Chennai + Bengaluru pilot brief, ready to shape in Workspace.",
    action: "Build pilot brief",
    kind: "pilot"
  },
  {
    count: 4,
    name: "Scale Playbook",
    description: "Use rider cohort insights to choose what to scale across the next 10 cities.",
    action: "Explore rider cohorts",
    kind: "scale"
  },
  {
    count: 6,
    name: "Launch Day Mode",
    description: "Your full checklist is verified. Turn the rollout into a final campaign plan.",
    action: "Open launch workspace",
    kind: "launch"
  }
];

function restoreDealerTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(dealerKey)) || [];
    dealerTasks.forEach((task, index) => task.checked = Boolean(saved[index]));
  } catch (_) {}
  updateDealerProgress();
}

function updateDealerProgress() {
  const complete = Array.from(dealerTasks).filter((task) => task.checked).length;
  const percent = Math.round((complete / dealerTasks.length) * 100);
  progressBar.style.width = `${percent}%`;
  progressLabel.textContent = `${complete} of ${dealerTasks.length} actions complete (${percent}% verified)`;
  localStorage.setItem(dealerKey, JSON.stringify(Array.from(dealerTasks).map((task) => task.checked)));
  renderLaunchMilestones(complete);

  // Interconnect with global reactive store
  if (window.EurogripStore) {
    window.EurogripStore.applyDealerProgress(complete, dealerTasks.length);
  }
}

function renderLaunchMilestones(complete) {
  const next = milestones.find((milestone) => complete < milestone.count);
  if (complete === dealerTasks.length) {
    milestoneStatus.textContent = "All launch milestones unlocked — you're launch-ready.";
    unlockPanel.classList.add("launch-complete");
  } else {
    milestoneStatus.textContent = next
      ? `Complete ${next.count - complete} more ${next.count - complete === 1 ? "action" : "actions"} to unlock your ${next.name}`
      : "Your next launch milestone is ready.";
    unlockPanel.classList.remove("launch-complete");
  }

  milestoneList.innerHTML = milestones.map((milestone, index) => {
    const unlocked = complete >= milestone.count;
    return `
      <article class="launch-milestone ${unlocked ? "unlocked" : "locked"}">
        <div class="milestone-topline"><span>0${index + 1} / ${milestone.count} ACTIONS</span><strong>${unlocked ? "UNLOCKED" : "LOCKED"}</strong></div>
        <h4>${milestone.name}</h4>
        <p>${milestone.description}</p>
        ${unlocked
          ? `<button type="button" data-milestone-action="${milestone.kind}">${milestone.action} <span>→</span></button>`
          : `<small>${milestone.count - complete} more ${milestone.count - complete === 1 ? "action" : "actions"} to go</small>`}
      </article>
    `;
  }).join("");

  milestoneList.querySelectorAll("[data-milestone-action]").forEach((button) => {
    button.addEventListener("click", () => openMilestone(button.dataset.milestoneAction));
  });
}

function openMilestone(kind) {
  if (kind === "scale") {
    window.location.href = "intelligence.html#clustering";
    return;
  }

  let state = {};
  try {
    state = JSON.parse(localStorage.getItem("eurogrip_master_state_v1") || "{}");
  } catch (error) {
    console.warn("Could not read the shared campaign state for the launch brief.", error);
  }
  const isPilot = kind === "pilot";
  const segment = state.prioritySegment || "Gig worker";
  const budget = Number(state.budget) || 60;
  localStorage.setItem("eurogrip-workspace-seed", JSON.stringify({
    budget,
    shops: 5000,
    cards: 50000,
    trials: 100,
    months: isPilot ? "3" : "12",
    segment,
    prompt: isPilot
      ? "Build the Chennai and Bengaluru pilot plan using verified dealer launch tasks."
      : "Finalize the 12-month launch plan using the verified dealer readiness checklist."
  }));
  localStorage.setItem("eurogrip-project-name", isPilot ? "Eurogrip Pilot Kit" : "Eurogrip Launch Day Plan");
  window.location.href = "workspace.html";
}

dealerTasks.forEach((task) => task.addEventListener("change", updateDealerProgress));
restoreDealerTasks();
