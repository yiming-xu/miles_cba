(() => {
  "use strict";
  // Move existing nodes, never clone: values, labels and app event bindings survive.
  const groups = [
    ["earn-section", ["monthly-cap", "miles-rate", "welcome-miles", "displaced-cash-bonus"]],
    ["cost-section", ["hourly-value"]],
  ];
  for (const [sectionId, fields] of groups) {
    const section = document.getElementById(sectionId);
    if (!section) continue;
    const details = document.createElement("details");
    details.className = "advanced-inputs";
    details.open = true;
    const summary = document.createElement("summary");
    summary.textContent = sectionId === "earn-section" ? "Earning assumptions" : "Time & transfer assumptions";
    details.appendChild(summary);
    const grid = document.createElement("div");
    grid.className = "field-grid";
    for (const id of fields) {
      const field = document.getElementById(id)?.closest(".field");
      if (field) grid.appendChild(field);
    }
    details.appendChild(grid);
    if (sectionId === "cost-section") {
      const transfer = section.querySelector(".transfer-controls");
      if (transfer) details.appendChild(transfer);
    }
    section.appendChild(details);
  }
  // Contextual help belongs beside its own label, not in an unrelated help list.
  for (const field of document.querySelectorAll(".field")) {
    const label = field.querySelector("label[for]");
    const help = Array.from(field.querySelectorAll("details.input-help"))
      .find(item => item.querySelector("summary")?.textContent === "About this input");
    if (!label || !help) continue;
    const inputId = label.htmlFor;
    help.id = `help-${inputId}`;
    help.classList.add("field-help");
    help.querySelector("summary").textContent = `Help: ${label.textContent.trim()}`;
    const row = document.createElement("div");
    row.className = "field-label-row";
    label.before(row);
    row.appendChild(label);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "field-help-button";
    button.textContent = "?";
    button.setAttribute("aria-label", `Help for ${label.textContent.trim()}`);
    button.setAttribute("aria-controls", help.id);
    button.setAttribute("aria-expanded", "false");
    row.appendChild(button);
    let pinned = false;
    const show = open => {
      help.open = open;
      button.setAttribute("aria-expanded", String(open));
    };
    button.addEventListener("click", () => { pinned = !pinned; show(pinned); });
    button.addEventListener("mouseenter", () => {
      if (window.matchMedia?.("(hover: hover)").matches) show(true);
    });
    field.addEventListener("mouseleave", () => { if (!pinned) show(false); });
    button.addEventListener("keydown", event => {
      if (event.key === "Escape") { pinned = false; show(false); }
    });
    help.addEventListener("toggle", () => button.setAttribute("aria-expanded", String(help.open)));
  }
  // Keep the offer chooser primary; consolidate section-level explanations only.
  for (const section of document.querySelectorAll(".step-card")) {
    const help = document.createElement("details");
    help.className = "section-help";
    const summary = document.createElement("summary");
    summary.textContent = "Help & details";
    help.appendChild(summary);
    for (const item of Array.from(section.querySelectorAll("details.input-help"))) {
      if (!item.classList.contains("field-help") && !item.closest(".advanced-inputs") && !item.closest("#selected-fare-context")) help.appendChild(item);
    }
    section.appendChild(help);
  }
})();
