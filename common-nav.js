document.addEventListener("DOMContentLoaded", () => {
  const nav = document.querySelector(".nav");
  if (!nav) return;

  // Ensure AI Lab is present in navigation if not already there
  const navLinks = nav.querySelector("nav");
  if (navLinks && !navLinks.querySelector("a[href='intelligence.html']")) {
    const aiLink = document.createElement("a");
    aiLink.href = "intelligence.html";
    aiLink.textContent = "AI Lab";
    if (window.location.pathname.endsWith("intelligence.html")) {
      aiLink.className = "active";
    }
    navLinks.appendChild(aiLink);
  }

  // Inject Command Palette trigger button if not present
  if (!nav.querySelector(".palette-trigger")) {
    const palBtn = document.createElement("button");
    palBtn.className = "palette-trigger";
    palBtn.type = "button";
    palBtn.setAttribute("aria-label", "Open Command Palette");
    palBtn.innerHTML = "<kbd>⌘K</kbd> <span>Actions</span>";
    // Insert before mobile menu or append
    nav.appendChild(palBtn);
  }

  // Mobile menu toggle
  if (!nav.querySelector(".mobile-menu")) {
    const button = document.createElement("button");
    button.className = "mobile-menu";
    button.type = "button";
    button.setAttribute("aria-label", "Open navigation");
    button.setAttribute("aria-expanded", "false");
    button.innerHTML = "<span></span><span></span>";
    nav.appendChild(button);
    button.addEventListener("click", () => {
      const open = nav.classList.toggle("mobile-open");
      button.setAttribute("aria-expanded", String(open));
      button.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    });
    nav.querySelectorAll("nav a").forEach((link) => link.addEventListener("click", () => {
      nav.classList.remove("mobile-open");
      button.setAttribute("aria-expanded", "false");
    }));
  }

  // Dynamically load eurogrip-store.js if not already present
  if (!window.EurogripStore) {
    const storeScript = document.createElement("script");
    storeScript.src = "eurogrip-store.js";
    storeScript.defer = true;
    document.head.appendChild(storeScript);
  }

  // Dynamically load cmd-palette.js if not already present
  if (!window.EurogripPalette) {
    const script = document.createElement("script");
    script.src = "cmd-palette.js";
    script.defer = true;
    document.head.appendChild(script);
  }
});
