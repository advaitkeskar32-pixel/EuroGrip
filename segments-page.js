const segmentPages = {
  commuter: {
    role: "DEFEND / RELIABILITY", promise: "Made for<br>your bike.", description: "The right tyre is confidence that fits, functions and lasts for the ride ahead.", budget: "₹15 CR", word: "RANGE",
    actions: [["01 / DIGITAL","Tyre finder on WhatsApp"],["02 / RETAIL","Finder in every shop + mechanic rewards"],["03 / ON-GROUND","Free tyre check camps"]]
  },
  gig: {
    role: "OPEN SEGMENT / UPTIME", promise: "Never lose<br>a shift.", description: "Durability and rapid repairs protect the rider’s ability to earn every day.", budget: "₹18 CR", word: "UPTIME",
    actions: [["01 / DIGITAL","Hindi, Kannada + Tamil videos; Rider Card"],["02 / RETAIL","Fixed-price fitting at partner shops"],["03 / ON-GROUND","Pit-Stops where riders gather"]]
  },
  premium: {
    role: "WIN / PERFORMANCE", promise: "Proven on<br>the track.", description: "Performance is made credible through evidence, creator trust and rider community.", budget: "₹18 CR", word: "PROOF",
    actions: [["01 / DIGITAL","Creator reviews and tests"],["02 / RETAIL","19 Eurogrip stores to see the product"],["03 / ON-GROUND","Club demos and track days"]]
  }
};
document.querySelectorAll(".route-tab").forEach((button) => button.addEventListener("click", () => {
  document.querySelectorAll(".route-tab").forEach((item) => item.classList.remove("active"));
  button.classList.add("active");
  const data = segmentPages[button.dataset.segment];
  document.getElementById("route-role").textContent = data.role;
  document.getElementById("route-promise").innerHTML = data.promise;
  document.getElementById("route-description").textContent = data.description;
  document.getElementById("route-budget").textContent = data.budget;
  document.getElementById("route-word").textContent = data.word;
  document.getElementById("route-activation").innerHTML = data.actions.map((item) => `<article><span>${item[0]}</span><strong>${item[1]}</strong></article>`).join("");
}));

const requestedSegment = new URLSearchParams(window.location.search).get("segment");
if (requestedSegment) {
  const matchingTab = document.querySelector(`.route-tab[data-segment="${requestedSegment}"]`);
  if (matchingTab) matchingTab.click();
}

const riderFits = {
  commuter: {
    name: "Commuter",
    title: "Commuter / Made for your bike",
    text: "Start by checking your exact tyre size and daily riding conditions. Then compare nearby fit options and prioritise reliable service support."
  },
  gig: {
    name: "Gig worker",
    title: "Gig worker / Never lose a shift",
    text: "Prioritise durability, predictable wear and a partner shop with fixed-price fitting. Keep downtime and tyre age visible in your maintenance routine."
  },
  premium: {
    name: "Premium rider",
    title: "Premium rider / Proven on the track",
    text: "Compare test evidence, riding conditions and community feedback before choosing. Match the tyre to grip, handling and your preferred performance balance."
  }
};

const findButton = document.getElementById("find-rider-fit");
if (findButton) {
  findButton.addEventListener("click", () => {
    const use = document.getElementById("rider-use").value;
    const priority = document.getElementById("rider-priority").value;
    let fit = use;
    if (priority === "uptime" && use !== "premium") fit = "gig";
    if (priority === "proof") fit = "premium";
    const result = riderFits[fit];
    const panel = document.getElementById("rider-finder-result");
    panel.querySelector("strong").textContent = result.title;
    panel.querySelector("p").textContent = result.text;

    // Check if adopt button already rendered
    let adoptBtn = document.getElementById("adopt-segment-btn");
    if (!adoptBtn) {
      adoptBtn = document.createElement("button");
      adoptBtn.id = "adopt-segment-btn";
      adoptBtn.className = "action-btn";
      adoptBtn.style.marginTop = "12px";
      adoptBtn.style.width = "auto";
      adoptBtn.style.padding = "0 16px";
      panel.appendChild(adoptBtn);
    }
    adoptBtn.textContent = `Set ${result.name} as Primary Target in Workspace ✦`;
    adoptBtn.onclick = () => {
      if (window.EurogripStore) {
        window.EurogripStore.update({ prioritySegment: result.name });
      }
      adoptBtn.textContent = `✓ ${result.name} Linked to Campaign Workspace`;
      setTimeout(() => {
        window.location.href = "workspace.html";
      }, 700);
    };
  });
}
