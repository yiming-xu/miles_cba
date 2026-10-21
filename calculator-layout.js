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
    const summary = document.createElement("summary");
    summary.textContent = "Advanced assumptions";
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
  // Keep the offer chooser primary; consolidate explanatory links by section.
  for (const section of document.querySelectorAll(".step-card")) {
    const help = document.createElement("details");
    help.className = "section-help";
    const summary = document.createElement("summary");
    summary.textContent = "Help & details";
    help.appendChild(summary);
    for (const item of Array.from(section.querySelectorAll("details.input-help"))) {
      if (!item.closest(".advanced-inputs") && !item.closest("#selected-fare-context")) help.appendChild(item);
    }
    section.appendChild(help);
  }
})();
