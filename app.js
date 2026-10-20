(() => {
  "use strict";

  const DEFAULT_EXAMPLE = Object.freeze({
    routeId: "tokyo-hnd",
    economySaving: 450,
    willingness: 150,
    monthlySpend: 1000,
    monthlyCap: 1000,
    milesRate: 4,
    cashbackPercent: 1.7,
    welcomeMiles: 16000,
    displacedCashBonus: 0,
    awardCash: 100,
    ongoingFee: 30, // Retained for shared-model compatibility; fee inputs are ignored.
    minutesPerMonth: 15,
    hourlyValue: 40,
    transferBlock: 1,
  });

  const FALLBACK_RESEARCH = Object.freeze({
    checked: "2026-10-20",
    routes: Object.freeze([
      Object.freeze({
        id: "perth",
        name: "Perth",
        zone: "Not supplied",
        awardMiles: 42500,
        economySaving: 300,
        willingness: 100,
        cathayMiles: null,
        cathayRouting: "Not supplied in fallback data",
        note: "Fallback route only; compare with researched chart data.",
      }),
      Object.freeze({
        id: "tokyo-hnd",
        name: "Tokyo (Haneda)",
        zone: "Not supplied",
        awardMiles: 54500,
        economySaving: 450,
        willingness: 150,
        cathayMiles: null,
        cathayRouting: "Not supplied in fallback data",
        note: "SIN–HND economy cash is S$450 assumed and unverified, not a live quote.",
      }),
      Object.freeze({
        id: "heathrow",
        name: "London Heathrow",
        zone: "Not supplied",
        awardMiles: 108500,
        economySaving: 700,
        willingness: 500,
        cathayMiles: null,
        cathayRouting: "Not supplied in fallback data",
        note: "Fallback route only; compare with researched chart data.",
      }),
    ]),
    promotions: Object.freeze([
      Object.freeze({
        id: "citi-rewards-16k",
        label: "Citi Rewards — 16,000 miles welcome offer",
        bonusMiles: 16000,
        milesRate: 4,
        monthlyCap: 1000,
        expiry: "2027-03-31",
        terms: "40,000 Citi ThankYou points (16,000 miles) with S$800 qualifying spend by the end of the second calendar month after approval; the bonus must be fulfilled within three calendar months after the spend period. Terms through 31 March 2027. Eligibility, qualifying spend and credit timing are not modeled.",
        source: "https://www.citibank.com.sg/credit-cards/rewards/citi-rewards-card/pdf/online-product-led-acquisition-promotion-terms-and-conditions.pdf",
      }),
    ]),
  });

  function finiteNonnegative(value) {
    return Number.isFinite(value) && value >= 0;
  }

  function normalizeRoute(route) {
    if (!route || typeof route !== "object") return null;
    const id = String(route.id ?? "").trim();
    const name = String(route.name ?? "").trim();
    const awardMiles = Number(route.awardMiles);
    if (!id || !name || !Number.isSafeInteger(awardMiles) || awardMiles <= 0) return null;
    const economySaving = Number(route.economySaving);
    const willingness = Number(route.willingness);
    return {
      id,
      name,
      zone: String(route.zone ?? "Not supplied"),
      awardMiles,
      economySaving: finiteNonnegative(economySaving) ? economySaving : 0,
      willingness: finiteNonnegative(willingness) ? willingness : 0,
      cathayMiles: route.cathayMiles ?? null,
      cathayRouting: String(route.cathayRouting ?? "Not supplied"),
      note: String(route.note ?? ""),
      routeLabel: `Singapore → ${name}`,
    };
  }

  function normalizePromotion(promotion) {
    if (!promotion || typeof promotion !== "object") return null;
    const id = String(promotion.id ?? "").trim();
    const label = String(promotion.label ?? "").trim();
    if (!id || !label) return null;
    const normalized = {
      ...promotion,
      id,
      label,
      terms: String(promotion.terms ?? "Terms not supplied."),
      source: String(promotion.source ?? ""),
    };
    for (const field of ["bonusMiles", "milesRate", "monthlyCap", "fee"]) {
      if (promotion[field] !== undefined && promotion[field] !== null && promotion[field] !== "") {
        normalized[field] = Number(promotion[field]);
      }
    }
    normalized.expiry = promotion.expiry === undefined || promotion.expiry === null
      ? ""
      : String(promotion.expiry);
    return normalized;
  }

  function getResearch() {
    const supplied = window.MILES_RESEARCH && typeof window.MILES_RESEARCH === "object"
      ? window.MILES_RESEARCH
      : {};
    const routeSource = Array.isArray(supplied.routes) ? supplied.routes : FALLBACK_RESEARCH.routes;
    const normalizedRoutes = routeSource.map(normalizeRoute).filter(Boolean);
    const routes = normalizedRoutes.length > 0
      ? normalizedRoutes
      : FALLBACK_RESEARCH.routes.map(normalizeRoute).filter(Boolean);

    const promotionSource = Array.isArray(supplied.promotions)
      ? supplied.promotions
      : FALLBACK_RESEARCH.promotions;
    const promotions = promotionSource.map(normalizePromotion).filter(Boolean);
    const defaultPromotionId = String(supplied.defaultPromotion ?? "citi-rewards-16k");
    const hasDefaultPromotion = promotions.some((promotion) => (
      promotion.id === defaultPromotionId
      || isDefaultPromotion(promotion)
    ));
    if (!hasDefaultPromotion) {
      promotions.unshift(...FALLBACK_RESEARCH.promotions.map(normalizePromotion).filter(Boolean));
    }
    return {
      checked: String(supplied.checked ?? FALLBACK_RESEARCH.checked),
      routes,
      promotions,
      defaultPromotionId,
    };
  }

  function isHanedaRoute(route) {
    const identity = `${route.id} ${route.name}`.toLowerCase();
    return identity.includes("hnd") || identity.includes("haneda");
  }

  function getDefaultRoute(routes) {
    return routes.find(isHanedaRoute)
      || routes.find((route) => /tokyo/i.test(`${route.id} ${route.name}`))
      || routes[0]
      || null;
  }

  function isDefaultPromotion(promotion) {
    return promotion.id === "citi-rewards-16k"
      || (/citi/i.test(promotion.label) && /rewards/i.test(promotion.label)
        && Number(promotion.bonusMiles) === DEFAULT_EXAMPLE.welcomeMiles);
  }

  function formatMoney(value) {
    if (!Number.isFinite(value)) return "—";
    const formatter = new Intl.NumberFormat("en-SG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const amount = `S$${formatter.format(Math.abs(value))}`;
    return value < 0 ? `−${amount}` : amount;
  }

  function formatMiles(value) {
    if (!Number.isFinite(value)) return "—";
    return new Intl.NumberFormat("en-SG", { maximumFractionDigits: 2 })
      .format(Math.max(0, value));
  }

  function parseDateOnly(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value ?? ""));
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1
      || date.getUTCDate() !== day) return null;
    return date;
  }

  function fullCalendarMonthsBetween(startDate, endDate) {
    const monthDifference = (endDate.getUTCFullYear() - startDate.getUTCFullYear()) * 12
      + endDate.getUTCMonth() - startDate.getUTCMonth();
    return Math.max(0, monthDifference - (endDate.getUTCDate() < startDate.getUTCDate() ? 1 : 0));
  }

  function dateFeasibilityMessage(earningMonths) {
    const startDate = parseDateOnly(research.checked);
    const flightDate = parseDateOnly("2027-06-01");
    if (!startDate || !flightDate) {
      return "The flight-date comparison is unavailable because the research snapshot date is missing or invalid.";
    }
    const monthsAvailable = fullCalendarMonthsBetween(startDate, flightDate);
    const dateFormatter = new Intl.DateTimeFormat("en-SG", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
    const startLabel = dateFormatter.format(startDate);
    const flightLabel = dateFormatter.format(flightDate);
    if (earningMonths > monthsAvailable) {
      return `The model needs ${earningMonths} full earning months, but only ${monthsAvailable} full calendar months remain from ${startLabel} to ${flightLabel}. The target cannot be earned by the flight date under these assumptions; welcome-bonus posting could shorten the runway further. No award inventory is checked.`;
    }
    return `The model shows ${earningMonths} full earning months within ${monthsAvailable} full calendar months from ${startLabel} to ${flightLabel}, before welcome-bonus timing and award-seat availability. This is not a booking forecast.`;
  }

  function calculateScenario(route, inputs) {
    if (!route || !inputs) {
      return { available: false, reason: "Choose a destination and complete the inputs." };
    }

    const requiredNumbers = [
      inputs.monthlySpend,
      inputs.monthlyCap,
      inputs.milesRate,
      inputs.cashbackPercent,
      inputs.welcomeMiles,
      inputs.displacedCashBonus,
      inputs.awardCash,
      inputs.minutesPerMonth,
      inputs.hourlyValue,
      inputs.economySaving,
      inputs.willingness,
      route.awardMiles,
    ];
    if (!requiredNumbers.every(finiteNonnegative)) {
      return { available: false, reason: "Enter finite, non-negative values for the estimate.", route };
    }
    if (!Number.isSafeInteger(inputs.transferBlock) || inputs.transferBlock < 1) {
      return { available: false, reason: "The transfer block must be a positive whole number.", route };
    }

    const eligibleMonthlySpend = Math.min(inputs.monthlySpend, inputs.monthlyCap);
    const monthlyMiles = eligibleMonthlySpend * inputs.milesRate;
    const welcomeMilesUsed = Math.min(route.awardMiles, inputs.welcomeMiles);
    const regularMilesNeeded = Math.max(0, route.awardMiles - welcomeMilesUsed);
    const transferGoal = regularMilesNeeded === 0
      ? 0
      : Math.ceil(regularMilesNeeded / inputs.transferBlock) * inputs.transferBlock;

    if (transferGoal > 0 && (!Number.isFinite(monthlyMiles) || monthlyMiles <= 0)) {
      return {
        available: false,
        reason: "There is no positive monthly miles earning with these inputs. Set a positive eligible spend and earn rate, or add enough eligible welcome miles.",
        route,
      };
    }

    let earningMonths = 0;
    if (transferGoal > 0) {
      const quotient = transferGoal / monthlyMiles;
      if (!Number.isFinite(quotient)) {
        return { available: false, reason: "These values are too large to estimate safely.", route };
      }
      const nearestWhole = Math.round(quotient);
      earningMonths = Math.abs(quotient - nearestWhole) < 1e-12
        ? Math.max(1, nearestWhole)
        : Math.ceil(quotient);
    }

    const earnedMiles = monthlyMiles * earningMonths;
    const totalEligibleSpend = eligibleMonthlySpend * earningMonths;
    const cashbackCost = totalEligibleSpend * inputs.cashbackPercent / 100;
    const timeCost = earningMonths * inputs.minutesPerMonth / 60 * inputs.hourlyValue;
    const transferRemainder = Math.max(0, transferGoal - regularMilesNeeded);
    const wholeMonthExcess = Math.max(0, earnedMiles - transferGoal);
    const welcomeExcess = Math.max(0, inputs.welcomeMiles - welcomeMilesUsed);
    const leftoverMiles = transferRemainder + wholeMonthExcess + welcomeExcess;
    // Keep the legacy result field for consumers, but do not model unverified fees.
    const feesCost = 0;
    const totalCost = inputs.awardCash
      + cashbackCost
      + timeCost
      + inputs.displacedCashBonus;
    const totalValue = inputs.economySaving + inputs.willingness;
    const rawBreakEven = totalCost - inputs.economySaving;
    const breakEvenWillingness = Math.max(0, rawBreakEven);
    const netBenefit = totalValue - totalCost;

    const outputs = [
      monthlyMiles,
      earnedMiles,
      totalEligibleSpend,
      cashbackCost,
      timeCost,
      transferRemainder,
      wholeMonthExcess,
      welcomeExcess,
      leftoverMiles,
      feesCost,
      totalCost,
      totalValue,
      rawBreakEven,
      breakEvenWillingness,
      netBenefit,
    ];
    if (!outputs.every(Number.isFinite)) {
      return { available: false, reason: "These values are too large to estimate safely.", route };
    }

    return {
      available: true,
      route,
      inputs,
      eligibleMonthlySpend,
      monthlyMiles,
      welcomeMilesUsed,
      regularMilesNeeded,
      transferGoal,
      earningMonths,
      earnedMiles,
      totalEligibleSpend,
      cashbackCost,
      timeCost,
      transferRemainder,
      wholeMonthExcess,
      welcomeExcess,
      leftoverMiles,
      feesCost,
      totalCost,
      totalValue,
      rawBreakEven,
      breakEvenWillingness,
      netBenefit,
    };
  }

  window.MILES_CALCULATOR = Object.freeze({
    calculateScenario,
    defaultExample: DEFAULT_EXAMPLE,
    formatMiles,
    formatMoney,
    getDefaultRoute,
    getResearch,
  });

  const form = document.getElementById("calculator-form");
  if (!form) return;

  const research = getResearch();
  const routes = research.routes;
  const routeById = new Map(routes.map((route) => [route.id, route]));
  const destination = document.getElementById("destination");
  const promotionPicker = document.getElementById("promotion-picker");
  const blockInput = document.getElementById("transfer-block");
  const idealisedInput = document.getElementById("idealised-transfer");
  const errorBox = document.getElementById("input-errors");
  let lastTransferBlock = 10000;

  const INPUTS = Object.freeze([
    { id: "economy-saving", key: "economySaving", label: "economy cash saving" },
    { id: "upgrade-willingness", key: "willingness", label: "upgrade willingness" },
    { id: "monthly-spend", key: "monthlySpend", label: "eligible monthly spend" },
    { id: "monthly-cap", key: "monthlyCap", label: "monthly spend cap" },
    { id: "miles-rate", key: "milesRate", label: "miles earn rate" },
    { id: "cashback-rate", key: "cashbackPercent", label: "cashback rate", max: 100 },
    { id: "welcome-miles", key: "welcomeMiles", label: "welcome miles", integer: true },
    { id: "displaced-cash-bonus", key: "displacedCashBonus", label: "displaced cash offer" },
    { id: "award-cash", key: "awardCash", label: "award cash charges" },
    { id: "minutes-per-month", key: "minutesPerMonth", label: "extra minutes per month" },
    { id: "hourly-value", key: "hourlyValue", label: "hourly time value" },
    { id: "transfer-block", key: "transferBlock", label: "transfer block", integer: true, min: 1 },
  ]);

  function byId(id) {
    return document.getElementById(id);
  }

  function readInputs() {
    const values = {};
    const errors = [];
    for (const definition of INPUTS) {
      const input = byId(definition.id);
      const raw = input.value.trim();
      const value = raw === "" ? NaN : Number(raw);
      let problem = "";
      if (raw === "") {
        problem = `Enter a value for ${definition.label}.`;
      } else if (!Number.isFinite(value)) {
        problem = `${definition.label} must be a finite number.`;
      } else if (value < (definition.min ?? 0)) {
        problem = `${definition.label} must be at least ${definition.min ?? 0}.`;
      } else if (definition.max !== undefined && value > definition.max) {
        problem = `${definition.label} must be ${definition.max} or less.`;
      } else if (definition.integer && !Number.isSafeInteger(value)) {
        problem = `${definition.label} must be a safe whole number.`;
      } else if (!input.validity.valid) {
        problem = `Check the value entered for ${definition.label}.`;
      }
      if (problem) {
        input.setAttribute("aria-invalid", "true");
        errors.push(problem);
      } else {
        input.removeAttribute("aria-invalid");
        values[definition.key] = value;
      }
    }
    return { values, errors };
  }

  function setOutput(name, value) {
    document.querySelectorAll(`[data-output="${name}"]`).forEach((node) => {
      node.textContent = value;
    });
  }

  function clearOutputs() {
    document.querySelectorAll("[data-output]").forEach((node) => {
      node.textContent = "—";
    });
    byId("detail-net").textContent = "—";
    byId("break-even").textContent = "—";
    byId("sticky-net").textContent = "—";
    byId("sticky-months").textContent = "—";
    byId("sensitivity-note").hidden = true;
    byId("date-feasibility-note").textContent = "Correct the inputs to compare the earning timeline with the stated flight date.";
    byId("sticky-result").classList.remove("is-positive", "is-negative", "is-invalid");
  }

  function renderUnavailable(reason) {
    clearOutputs();
    byId("result-status").textContent = reason;
    byId("sticky-status").textContent = "Estimate paused — check the inputs.";
    byId("sticky-result").classList.add("is-invalid");
  }

  function renderScenario(result) {
    const { route, inputs } = result;
    byId("award-miles-display").textContent = formatMiles(route.awardMiles);
    byId("award-route-display").textContent = route.routeLabel;
    setOutput("target-miles", formatMiles(route.awardMiles));
    setOutput("welcome-used", formatMiles(result.welcomeMilesUsed));
    setOutput("transfer-goal", formatMiles(result.transferGoal));
    setOutput("effective-spend", `${formatMoney(result.eligibleMonthlySpend)} / month`);
    setOutput("earning-months", String(result.earningMonths));
    setOutput("economy-value", formatMoney(inputs.economySaving));
    setOutput("willingness-value", formatMoney(inputs.willingness));
    setOutput("cashback-cost", formatMoney(result.cashbackCost));
    setOutput("time-cost", formatMoney(result.timeCost));
    setOutput("award-cash-cost", formatMoney(inputs.awardCash));
    setOutput("displaced-cash", formatMoney(inputs.displacedCashBonus));
    setOutput("total-cost", formatMoney(result.totalCost));
    setOutput("leftover-miles", formatMiles(result.leftoverMiles));
    setOutput("transfer-remainder", `${formatMiles(result.transferRemainder)} miles`);
    setOutput("month-excess", `${formatMiles(result.wholeMonthExcess)} miles`);
    setOutput("welcome-excess", `${formatMiles(result.welcomeExcess)} miles`);
    byId("date-feasibility-note").textContent = dateFeasibilityMessage(result.earningMonths);

    const netText = formatMoney(result.netBenefit);
    const signedNet = result.netBenefit > 0 ? `+${netText}` : netText;
    byId("detail-net").textContent = signedNet;
    byId("sticky-net").textContent = signedNet;
    byId("break-even").textContent = formatMoney(result.breakEvenWillingness);
    byId("sticky-months").textContent = String(result.earningMonths);
    byId("net-label").textContent = result.netBenefit >= 0 ? "Net modelled benefit" : "Net modelled shortfall";
    byId("net-explainer").textContent = result.netBenefit >= 0
      ? "A positive result is not a guarantee of value."
      : "The selected willingness is below this model's break-even point.";
    byId("break-even-note").textContent = result.rawBreakEven < 0
      ? "The economy saving already covers modeled costs; displayed extra willingness is floored at S$0."
      : "Extra willingness needed above the economy alternative.";

    const resultClass = result.netBenefit >= 0 ? "is-positive" : "is-negative";
    byId("sticky-result").classList.remove("is-positive", "is-negative", "is-invalid");
    byId("sticky-result").classList.add(resultClass);
    byId("sticky-status").textContent = result.netBenefit >= 0
      ? `${route.name} · positive under these assumptions`
      : `${route.name} · below break-even under these assumptions`;
    byId("result-status").textContent = result.netBenefit >= 0
      ? "Under these assumptions, the modeled personal value exceeds the modeled cost. This is not a guarantee of availability or realized savings."
      : "Under these assumptions, the modeled cost exceeds the selected personal value. Change only inputs that reflect your real alternative.";

    const sensitivity = byId("sensitivity-note");
    if (Math.abs(result.netBenefit) <= 50) {
      sensitivity.textContent = "Sensitive result: net is within S$50 of break-even. A S$50 change in an assumption could reverse the sign.";
      sensitivity.hidden = false;
    } else {
      sensitivity.hidden = true;
      sensitivity.textContent = "";
    }
  }

  function update() {
    const { values, errors } = readInputs();
    if (errors.length > 0) {
      errorBox.hidden = false;
      errorBox.textContent = errors.join(" ");
      renderUnavailable("Please correct the highlighted inputs to calculate this scenario.");
      return;
    }
    errorBox.hidden = true;
    errorBox.textContent = "";
    const route = routeById.get(destination.value);
    if (!route) {
      renderUnavailable("Choose one of the listed Singapore-origin destinations.");
      return;
    }
    const result = calculateScenario(route, values);
    if (!result.available) {
      renderUnavailable(result.reason);
      byId("award-miles-display").textContent = formatMiles(route.awardMiles);
      byId("award-route-display").textContent = route.routeLabel;
      byId("result-status").textContent = result.reason;
      byId("sticky-status").textContent = "Estimate unavailable with these inputs.";
      return;
    }
    renderScenario(result);
  }

  function appendText(parent, text) {
    parent.appendChild(document.createTextNode(String(text)));
  }

  function clearNode(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function populateRoutes() {
    const defaultRoute = getDefaultRoute(routes);
    clearNode(destination);
    for (const route of routes) {
      const option = document.createElement("option");
      option.value = route.id;
      option.textContent = route.name;
      destination.appendChild(option);
    }
    if (defaultRoute) destination.value = defaultRoute.id;
  }

  function formatChartMiles(value) {
    if (value === null || value === undefined || value === "") return "Not supplied";
    const numeric = Number(value);
    return Number.isFinite(numeric) ? formatMiles(numeric) : String(value);
  }

  function renderAwardChart() {
    const tbody = byId("award-chart-body");
    clearNode(tbody);
    for (const route of routes) {
      const row = document.createElement("tr");
      const cells = [
        route.zone,
        route.name,
        formatMiles(route.awardMiles),
        formatChartMiles(route.cathayMiles),
        route.cathayRouting || "Not supplied",
        route.note || "—",
      ];
      for (const text of cells) {
        const cell = document.createElement("td");
        cell.textContent = text;
        row.appendChild(cell);
      }
      tbody.appendChild(row);
    }
  }

  function setResearchCheckedDate() {
    const checked = research.checked || "Research date not supplied";
    byId("research-checked").textContent = checked;
    byId("research-checked-footer").textContent = checked;
  }

  function promotionExpiryStatus(promotion, now = new Date()) {
    const status = String(promotion.status ?? "").toLowerCase();
    if (promotion.historical === true || promotion.expired === true
      || status === "historical" || status === "expired") {
      return { disabled: true, label: "historical / expired" };
    }
    if (!promotion.expiry) return { disabled: false, label: "no stated expiry" };
    const dateOnly = promotion.expiry.slice(0, 10);
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOnly);
    if (!match) return { disabled: true, label: "expiry date unclear" };
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const expiryDay = new Date(Date.UTC(year, month - 1, day));
    if (expiryDay.getUTCFullYear() !== year || expiryDay.getUTCMonth() !== month - 1
      || expiryDay.getUTCDate() !== day) {
      return { disabled: true, label: "expiry date invalid" };
    }
    const todayDay = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    return expiryDay.valueOf() < todayDay
      ? { disabled: true, label: "expired" }
      : { disabled: false, label: "current through expiry date" };
  }

  function promotionFeeStatus(promotion) {
    if (promotion.fee === undefined || promotion.fee === null || promotion.fee === "") return "";
    if (!Number.isFinite(promotion.fee) || promotion.fee < 0) {
      return "fee unclear — not modeled";
    }
    return promotion.fee > 0 ? "paid fee omitted — not modeled" : "";
  }

  function promotionAvailabilityStatus(promotion, now = new Date()) {
    const expiryStatus = promotionExpiryStatus(promotion, now);
    const feeStatus = promotionFeeStatus(promotion);
    const reasons = [
      ...(expiryStatus.disabled ? [expiryStatus.label] : []),
      ...(feeStatus ? [feeStatus] : []),
    ];
    if (reasons.length > 0) {
      return {
        disabled: true,
        label: reasons.join(" · "),
        category: expiryStatus.disabled ? "expired" : "excluded",
      };
    }
    return { ...expiryStatus, category: "current" };
  }

  function promotionOptionLabel(promotion, expiryStatus) {
    const expiry = promotion.expiry ? ` · through ${promotion.expiry.slice(0, 10)}` : "";
    const status = expiryStatus.disabled ? ` · ${expiryStatus.label}` : expiry;
    return `${promotion.label}${status}`;
  }

  const promotionById = new Map(research.promotions.map((promotion) => [promotion.id, promotion]));

  function defaultPromotion() {
    const configuredDefault = research.promotions.find((promotion) => (
      promotion.id === research.defaultPromotionId
    ));
    if (configuredDefault && !promotionAvailabilityStatus(configuredDefault).disabled) {
      return configuredDefault;
    }
    return research.promotions.find((promotion) => (
      isDefaultPromotion(promotion) && !promotionAvailabilityStatus(promotion).disabled
    )) || null;
  }

  function renderPromotionOptions() {
    clearNode(promotionPicker);
    const custom = document.createElement("option");
    custom.value = "custom";
    custom.textContent = "Custom / manually entered values";
    promotionPicker.appendChild(custom);

    const current = document.createElement("optgroup");
    current.label = "Current or undated offers — verify terms";
    const expired = document.createElement("optgroup");
    expired.label = "Historical / expired offers (disabled)";
    const excluded = document.createElement("optgroup");
    excluded.label = "Paid / unclear-fee offers (disabled; fees omitted)";
    for (const promotion of research.promotions) {
      const status = promotionAvailabilityStatus(promotion);
      const option = document.createElement("option");
      option.value = promotion.id;
      option.textContent = promotionOptionLabel(promotion, status);
      option.disabled = status.disabled;
      const group = status.category === "expired"
        ? expired
        : status.category === "excluded" ? excluded : current;
      group.appendChild(option);
    }
    if (current.childElementCount > 0) promotionPicker.appendChild(current);
    if (expired.childElementCount > 0) promotionPicker.appendChild(expired);
    if (excluded.childElementCount > 0) promotionPicker.appendChild(excluded);

    const activeDefault = defaultPromotion();
    promotionPicker.value = activeDefault ? activeDefault.id : "custom";
    return activeDefault;
  }

  function addSafeSourceLink(parent, source) {
    if (!source) return;
    let url;
    try {
      url = new URL(source, window.location.href);
    } catch {
      return;
    }
    if (url.protocol !== "https:") return;
    appendText(parent, " ");
    const link = document.createElement("a");
    link.href = url.href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Source terms";
    parent.appendChild(link);
  }

  function renderPromotionNote(promotion) {
    const note = byId("promotion-note");
    clearNode(note);
    if (!promotion) {
      note.textContent = "Custom/manual scenario: enter only verified bonus, earning-rate and cap assumptions. Paid-fee presets are disabled rather than treated as free; expired or historical presets are not applied automatically.";
      return;
    }
    appendText(note, `${promotion.terms} Paid-fee presets are disabled rather than treated as free.`);
    addSafeSourceLink(note, promotion.source);
  }

  function applyPromotionPreset(promotion) {
    if (!promotion) return;
    const assignments = [
      ["welcome-miles", promotion.bonusMiles],
      ["miles-rate", promotion.milesRate],
      ["monthly-cap", promotion.monthlyCap],
    ];
    for (const [id, value] of assignments) {
      if (value !== undefined && finiteNonnegative(value)) byId(id).value = String(value);
    }
    renderPromotionNote(promotion);
  }

  function applyRoutePreset() {
    const route = routeById.get(destination.value);
    if (!route) return;
    const isDefaultExampleRoute = isHanedaRoute(route)
      || /tokyo/i.test(`${route.id} ${route.name}`);
    const economySaving = isDefaultExampleRoute
      ? DEFAULT_EXAMPLE.economySaving
      : route.economySaving;
    const willingness = isDefaultExampleRoute
      ? DEFAULT_EXAMPLE.willingness
      : route.willingness;
    byId("economy-saving").value = String(economySaving);
    byId("upgrade-willingness").value = String(willingness);
    byId("economy-hint").textContent = isDefaultExampleRoute
      ? "S$450 is assumed and unverified for the stated date, not an updated SQ quote. Replace it with a matched itinerary price."
      : `${formatMoney(economySaving)} is a hypothetical route input, not a verified fare or live quote. Replace it with a matched itinerary price.`;
    byId("willingness-hint").textContent = `${formatMoney(willingness)} is a hypothetical personal preference for this route, not an airline valuation.`;
    update();
  }

  function handlePromotionChange() {
    if (promotionPicker.value === "custom") {
      renderPromotionNote(null);
      update();
      return;
    }
    const promotion = promotionById.get(promotionPicker.value);
    if (!promotion || promotionAvailabilityStatus(promotion).disabled) {
      promotionPicker.value = "custom";
      renderPromotionNote(null);
      update();
      return;
    }
    applyPromotionPreset(promotion);
    update();
  }

  function handleNumberInput(event) {
    const input = event.currentTarget;
    if (input === blockInput && !idealisedInput.checked) {
      const current = Number(input.value);
      if (Number.isInteger(current) && current >= 1) lastTransferBlock = current;
    }
    update();
  }

  function handleIdealisedChange() {
    if (idealisedInput.checked) {
      const current = Number(blockInput.value);
      if (Number.isInteger(current) && current > 1) lastTransferBlock = current;
      blockInput.value = "1";
      blockInput.disabled = true;
    } else {
      blockInput.disabled = false;
      blockInput.value = String(lastTransferBlock > 1 ? lastTransferBlock : 10000);
    }
    update();
  }

  function initialize() {
    populateRoutes();
    renderAwardChart();
    setResearchCheckedDate();
    const selectedPromotion = renderPromotionOptions();
    if (selectedPromotion) {
      applyPromotionPreset(selectedPromotion);
    } else {
      byId("welcome-miles").value = "0";
      renderPromotionNote(null);
    }
    renderPromotionNote(selectedPromotion);
    idealisedInput.checked = true;
    blockInput.value = "1";
    blockInput.disabled = true;

    form.querySelectorAll("input[type='number']").forEach((input) => {
      input.addEventListener("input", handleNumberInput);
    });
    form.addEventListener("change", update);
    destination.addEventListener("change", applyRoutePreset);
    promotionPicker.addEventListener("change", handlePromotionChange);
    idealisedInput.addEventListener("change", handleIdealisedChange);
    update();
  }

  initialize();
})();
