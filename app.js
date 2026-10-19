(() => {
  "use strict";

  const ROUTES = Object.freeze({
    perth: Object.freeze({
      name: "Perth",
      routeLabel: "Singapore → Perth",
      awardMiles: 42500,
      economySaving: 300,
      willingness: 100,
    }),
    tokyo: Object.freeze({
      name: "Tokyo",
      routeLabel: "Singapore → Tokyo",
      awardMiles: 54500,
      economySaving: 450,
      willingness: 150,
    }),
    heathrow: Object.freeze({
      name: "London Heathrow",
      routeLabel: "Singapore → London Heathrow",
      awardMiles: 108500,
      economySaving: 700,
      willingness: 500,
    }),
  });

  const INPUTS = Object.freeze([
    { id: "economy-saving", key: "economySaving", label: "economy cash saving" },
    { id: "upgrade-willingness", key: "willingness", label: "upgrade willingness" },
    { id: "monthly-spend", key: "monthlySpend", label: "eligible monthly spend" },
    { id: "monthly-cap", key: "monthlyCap", label: "monthly spend cap" },
    { id: "miles-rate", key: "milesRate", label: "miles earn rate" },
    { id: "cashback-rate", key: "cashbackPercent", label: "cashback rate", max: 100 },
    { id: "welcome-miles", key: "welcomeMiles", label: "welcome miles", integer: true },
    { id: "welcome-delay", key: "welcomeDelayMonths", label: "welcome credit delay", integer: true },
    { id: "welcome-fee", key: "welcomeFee", label: "welcome fee" },
    { id: "displaced-cash-bonus", key: "displacedCashBonus", label: "displaced cash bonus" },
    { id: "miles-cash-gift", key: "milesCashGift", label: "miles-card cash gift" },
    { id: "award-cash", key: "awardCash", label: "award cash charges" },
    { id: "ongoing-fee", key: "ongoingFee", label: "incremental fees" },
    { id: "minutes-per-month", key: "minutesPerMonth", label: "extra minutes per month" },
    { id: "hourly-value", key: "hourlyValue", label: "hourly time value" },
    { id: "transfer-block", key: "transferBlock", label: "transfer block", integer: true, min: 1 },
  ]);

  const moneyFormatter = new Intl.NumberFormat("en-SG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const milesFormatter = new Intl.NumberFormat("en-SG", {
    maximumFractionDigits: 2,
  });

  const byId = (id) => document.getElementById(id);
  const destination = byId("destination");
  const blockInput = byId("transfer-block");
  const idealisedInput = byId("idealised-transfer");
  const errorBox = byId("input-errors");
  let lastTransferBlock = 10000;

  function formatMoney(value) {
    if (!Number.isFinite(value)) return "—";
    const amount = `S$${moneyFormatter.format(Math.abs(value))}`;
    return value < 0 ? `−${amount}` : amount;
  }

  function formatMiles(value) {
    if (!Number.isFinite(value)) return "—";
    return milesFormatter.format(Math.max(0, value));
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

  function calculateScenario(route, inputs) {
    if (!route || !inputs) {
      return { available: false, reason: "Choose a destination and complete the inputs." };
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

    const readyMonths = Math.max(
      earningMonths,
      inputs.welcomeMiles > 0 ? inputs.welcomeDelayMonths : 0,
    );
    const earnedMiles = monthlyMiles * earningMonths;
    const totalEligibleSpend = eligibleMonthlySpend * earningMonths;
    const cashbackCost = totalEligibleSpend * inputs.cashbackPercent / 100;
    const timeCost = earningMonths * inputs.minutesPerMonth / 60 * inputs.hourlyValue;
    const transferRemainder = Math.max(0, transferGoal - regularMilesNeeded);
    const wholeMonthExcess = Math.max(0, earnedMiles - transferGoal);
    const welcomeExcess = Math.max(0, inputs.welcomeMiles - welcomeMilesUsed);
    const leftoverMiles = transferRemainder + wholeMonthExcess + welcomeExcess;
    const feesCost = inputs.ongoingFee + inputs.welcomeFee;
    const totalCost = inputs.awardCash
      + cashbackCost
      + timeCost
      + feesCost
      + inputs.displacedCashBonus;
    const totalValue = inputs.economySaving + inputs.willingness + inputs.milesCashGift;
    const rawBreakEven = totalCost - inputs.economySaving - inputs.milesCashGift;
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
      readyMonths,
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
    byId("result-status").textContent = "Estimate uses the visible assumptions and a zero opening miles balance.";

    setOutput("target-miles", formatMiles(route.awardMiles));
    setOutput("welcome-used", formatMiles(result.welcomeMilesUsed));
    setOutput("transfer-goal", formatMiles(result.transferGoal));
    setOutput("effective-spend", `${formatMoney(result.eligibleMonthlySpend)} / month`);
    setOutput("earning-months", String(result.earningMonths));
    setOutput("ready-months", String(result.readyMonths));
    setOutput("economy-value", formatMoney(inputs.economySaving));
    setOutput("willingness-value", formatMoney(inputs.willingness));
    setOutput("cash-gift", formatMoney(inputs.milesCashGift));
    setOutput("cashback-cost", formatMoney(result.cashbackCost));
    setOutput("time-cost", formatMoney(result.timeCost));
    setOutput("award-cash-cost", formatMoney(inputs.awardCash));
    setOutput("fees-cost", formatMoney(result.feesCost));
    setOutput("displaced-cash", formatMoney(inputs.displacedCashBonus));
    setOutput("total-cost", formatMoney(result.totalCost));
    setOutput("leftover-miles", formatMiles(result.leftoverMiles));
    setOutput("transfer-remainder", `${formatMiles(result.transferRemainder)} miles`);
    setOutput("month-excess", `${formatMiles(result.wholeMonthExcess)} miles`);
    setOutput("welcome-excess", `${formatMiles(result.welcomeExcess)} miles`);

    const netText = formatMoney(result.netBenefit);
    byId("detail-net").textContent = result.netBenefit > 0 ? `+${netText}` : netText;
    byId("sticky-net").textContent = result.netBenefit > 0 ? `+${netText}` : netText;
    byId("break-even").textContent = formatMoney(result.breakEvenWillingness);
    byId("sticky-months").textContent = String(result.readyMonths);
    byId("net-label").textContent = result.netBenefit >= 0 ? "Net modelled benefit" : "Net modelled shortfall";
    byId("net-explainer").textContent = result.netBenefit >= 0
      ? "A positive result is not a guarantee of value."
      : "The selected willingness is below this model's break-even point.";
    byId("break-even-note").textContent = result.rawBreakEven < 0
      ? "The economy saving and any cash gift already cover modeled costs; the displayed add-on is floored at S$0."
      : "Extra willingness needed after the economy saving and any miles-card cash gift.";

    const resultClass = result.netBenefit >= 0 ? "is-positive" : "is-negative";
    byId("sticky-result").classList.remove("is-positive", "is-negative", "is-invalid");
    byId("sticky-result").classList.add(resultClass);
    byId("sticky-status").textContent = result.netBenefit >= 0
      ? `${route.name} · positive under these assumptions`
      : `${route.name} · below break-even under these assumptions`;
    byId("result-status").textContent = result.netBenefit >= 0
      ? "Under these assumptions, the modeled personal value exceeds the modeled cost. This is not a guarantee of availability or realized savings."
      : "Under these assumptions, the modeled cost exceeds the selected personal value. Change only inputs that reflect your real alternative. ";

    const sensitivity = byId("sensitivity-note");
    if (Math.abs(result.netBenefit) <= 50) {
      sensitivity.textContent = `Sensitive result: net is within S$50 of break-even. A S$50 change in an assumption could reverse the sign.`;
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

    const route = ROUTES[destination.value];
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

  function applyRoutePreset() {
    const route = ROUTES[destination.value];
    if (!route) return;
    byId("economy-saving").value = String(route.economySaving);
    byId("upgrade-willingness").value = String(route.willingness);
    update();
  }

  document.querySelectorAll("#calculator-form input[type='number']").forEach((input) => {
    input.addEventListener("input", () => {
      if (input === blockInput && !idealisedInput.checked) {
        const current = Number(input.value);
        if (Number.isInteger(current) && current >= 1) lastTransferBlock = current;
      }
      update();
    });
  });
  byId("calculator-form").addEventListener("change", update);
  destination.addEventListener("change", applyRoutePreset);

  idealisedInput.addEventListener("change", () => {
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
  });

  applyRoutePreset();
})();
