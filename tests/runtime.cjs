"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("/home/hermes/.hermes/cache/scratch/miles-browser/node_modules/jsdom");

const ROOT = path.resolve(__dirname, "..");
const appSource = fs.readFileSync(path.join(ROOT, "app.js"), "utf8");
const researchDataSource = fs.readFileSync(path.join(ROOT, "research-data.js"), "utf8");
const indexHtml = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const slidesHtml = fs.readFileSync(path.join(ROOT, "slides.html"), "utf8");

function routeRows(count = 12) {
  return Array.from({ length: count }, (_, index) => ({
    id: index === 0 ? "tokyo-hnd" : `route-${index + 1}`,
    name: index === 0 ? "Tokyo (Haneda)" : `Destination ${index + 1}`,
    zone: `Zone ${index + 1}`,
    awardMiles: index === 0 ? 54500 : 20000 + index * 5000,
    economySaving: index === 0 ? 460 : index === 1 ? 300 : 300 + index * 29,
    willingness: index === 0 ? 150 : 100,
    fareStatus: "assumed",
    fareNote: index === 0
      ? "S$450 is assumed for 1 June 2027; SQ fare lookup was blocked by CAPTCHA."
      : `Illustrative one-way estimate for destination ${index + 1}; not a live quote.`,
    cathayMiles: 25000 + index * 1000,
    cathayRouting: index === 0 ? "Via Hong Kong (HKG)" : "Via HKG",
    note: `Source note ${index + 1}`,
  }));
}

const offers = [
  {
    id: "citi-rewards-16k",
    label: "Citi Rewards — 16,000 miles welcome offer",
    bonusMiles: 16000,
    milesRate: 4,
    monthlyCap: 1000,
    expiry: "2027-03-31",
    terms: "40,000 Citi ThankYou points (16,000 miles) with S$800 qualifying spend by the end of the second calendar month after approval; bonus fulfilled within three calendar months after the spend period.",
    source: "https://www.citibank.com.sg/credit-cards/rewards/citi-rewards-card/pdf/online-product-led-acquisition-promotion-terms-and-conditions.pdf",
  },
  {
    id: "citi-premiermiles-fee-waived",
    label: "Citi PremierMiles — fee-waived alternative",
    bonusMiles: 8000,
    milesRate: 1.2,
    monthlyCap: 1000000,
    expiry: "2027-03-31",
    terms: "8,000 welcome miles with fee-waived terms; verify eligibility.",
    source: "https://example.test/premiermiles-terms",
  },
  {
    id: "paid-route",
    label: "Paid annual-fee route",
    bonusMiles: 12000,
    milesRate: 1.4,
    monthlyCap: 9000,
    fee: 196.2,
    expiry: "2027-05-01",
    terms: "A paid route with a declared fee.",
    source: "https://example.test/paid-terms",
  },
  {
    id: "expired-route",
    label: "Expired route",
    bonusMiles: 5000,
    milesRate: 1.0,
    monthlyCap: 1000,
    expiry: "2026-10-19",
    terms: "Historical offer.",
  },
  {
    id: "boundary-route",
    label: "Offer expiring today",
    bonusMiles: 3000,
    milesRate: 1.0,
    monthlyCap: 1000,
    expiry: "2026-10-20",
    terms: "Inclusive expiry-date boundary.",
  },
  {
    id: "historic-no-expiry",
    label: "Historical offer without expiry",
    bonusMiles: 2000,
    milesRate: 1.0,
    monthlyCap: 1000,
    status: "historical",
    terms: "Do not offer this historical route.",
  },
  {
    id: "unsafe-copy",
    label: "Text handling check",
    bonusMiles: 100,
    milesRate: 1,
    monthlyCap: 1000,
    expiry: "2027-06-01",
    terms: '<img src=x onerror="window.__xss=true">',
    source: "javascript:alert(1)",
  },
];

const research = {
  routes: routeRows(),
  promotions: offers,
  checked: "2026-10-20",
};

function setFixedDate(window, isoDate) {
  const RealDate = window.Date;
  const fixedInstant = new RealDate(`${isoDate}T12:00:00.000Z`);
  window.Date = class FixedDate extends RealDate {
    constructor(...args) {
      super(...(args.length ? args : [fixedInstant.toISOString()]));
    }
    static now() {
      return fixedInstant.valueOf();
    }
  };
}

function createDom(html = indexHtml, { data = null, today = "2026-10-20" } = {}) {
  const dom = new JSDOM(html, {
    runScripts: "outside-only",
    url: "https://miles.example.test/",
    pretendToBeVisual: true,
    beforeParse(window) {
      setFixedDate(window, today);
      if (data) window.MILES_RESEARCH = data;
    },
  });
  dom.window.eval(appSource);
  dom.window.eval(fs.readFileSync(path.join(ROOT, "calculator-layout.js"), "utf8"));
  return dom;
}

function createDomFromResearchFile(html = indexHtml, today = "2026-10-20") {
  const dom = new JSDOM(html, {
    runScripts: "outside-only",
    url: "https://miles.example.test/",
    pretendToBeVisual: true,
    beforeParse(window) {
      setFixedDate(window, today);
    },
  });
  dom.window.eval(researchDataSource);
  dom.window.eval(appSource);
  dom.window.eval(fs.readFileSync(path.join(ROOT, "calculator-layout.js"), "utf8"));
  return dom;
}

function dispatchInput(window, element, eventName = "input") {
  element.dispatchEvent(new window.Event(eventName, { bubbles: true }));
}

function value(dom, id) {
  return dom.window.document.getElementById(id).value;
}

function test(name, fn) {
  fn();
  process.stdout.write(`ok - ${name}\n`);
}

let passed = 0;
function run(name, fn) {
  test(name, fn);
  passed += 1;
}

run("fallback defaults render the shared SIN–HND example and actual model values", () => {
  const dom = createDom();
  const { document } = dom.window;
  assert.equal(value(dom, "destination"), "tokyo-hnd");
  assert.equal(value(dom, "economy-saving"), "858");
  assert.equal(value(dom, "upgrade-willingness"), "150");
  assert.equal(value(dom, "monthly-spend"), "1000");
  assert.equal(value(dom, "monthly-cap"), "1000");
  assert.equal(value(dom, "miles-rate"), "4");
  assert.equal(value(dom, "welcome-miles"), "16000");
  assert.equal(value(dom, "transfer-block"), "1");
  assert.equal(document.getElementById("idealised-transfer").checked, true);
  assert.equal(document.getElementById("transfer-block").disabled, true);
  assert.match(document.getElementById("award-route-display").textContent, /Tokyo/);
  assert.equal(document.getElementById("detail-net").textContent, "+S$638.00");
  assert.equal(document.querySelector('[data-output="earning-months"]').textContent, "10");
  assert.equal(document.querySelector('[data-output="total-cost"]').textContent, "S$370.00");
  assert.equal(document.querySelector('[data-output="cashback-cost"]').textContent, "S$170.00");
  assert.equal(document.getElementById("ongoing-fee"), null);
  assert.equal(document.querySelector('[data-output="fees-cost"]'), null);
  assert.match(document.querySelector(".fee-omission-warning").textContent, /annual card fees/i);
  assert.match(document.querySelector(".fee-omission-warning").textContent, /transfer fees/i);
  assert.match(document.getElementById("date-feasibility-note").textContent, /only 7 full calendar months remain/);
  assert.match(document.getElementById("date-feasibility-note").textContent, /cannot be earned by the flight date/);
  dom.window.close();
});

run("research chart populates all twelve routes and preserves route data as text", () => {
  const dom = createDom(indexHtml, { data: research });
  const { document } = dom.window;
  assert.equal(document.querySelectorAll("#award-chart-body tr").length, 12);
  assert.equal(document.querySelectorAll("#destination option").length, 12);
  assert.equal(document.querySelector("#award-chart-body tr td").textContent, "Zone 1");
  assert.match(document.getElementById("award-chart-body").textContent, /Via Hong Kong \(HKG\)/);
  assert.match(document.getElementById("award-chart-body").textContent, /Source note 12/);
  assert.equal(value(dom, "destination"), "tokyo-hnd");
  dom.window.close();
});

run("checked research-data.js feeds all twelve routes and Citi presets into the DOM", () => {
  const dom = createDomFromResearchFile();
  const { document } = dom.window;
  assert.equal(document.querySelectorAll("#award-chart-body tr").length, 12);
  assert.equal(value(dom, "destination"), "tokyo");
  assert.equal(value(dom, "promotion-picker"), "citi-rewards-16k");
  assert.equal(value(dom, "welcome-miles"), "16000");
  assert.equal(value(dom, "miles-rate"), "4");
  assert.equal(value(dom, "monthly-cap"), "1000");
  assert.equal(document.querySelector('[data-output="earning-months"]').textContent, "10");
  assert.equal(document.querySelector('[data-output="total-cost"]').textContent, "S$370.00");
  assert.match(document.getElementById("award-chart-body").textContent, /7: Japan & South Korea/);
  assert.match(document.getElementById("award-chart-body").textContent, /SIN–HKG–HND/);

  const picker = document.getElementById("promotion-picker");
  picker.value = "citi-premiermiles-8k";
  dispatchInput(dom.window, picker, "change");
  assert.equal(value(dom, "welcome-miles"), "8000");
  assert.equal(value(dom, "miles-rate"), "1.2");
  assert.equal(value(dom, "monthly-cap"), "1000000");
  assert.match(document.getElementById("promotion-note").textContent, /1\.2mpd/);

  const destination = document.getElementById("destination");
  const selectedFareTitle = document.getElementById("selected-fare-title");
  const selectedFareNote = document.getElementById("selected-fare-note");
  const economyHint = document.getElementById("economy-hint");
  const routeData = dom.window.MILES_RESEARCH.routes;
  assert.equal(routeData.length, 12);
  for (const route of routeData) {
    destination.value = route.id;
    dispatchInput(dom.window, destination, "change");
    assert.equal(value(dom, "economy-saving"), String(route.economySaving), `${route.id} economy price`);
    assert.ok(selectedFareTitle.textContent.includes(route.name));
    assert.ok(selectedFareTitle.textContent.includes(`(${route.fareStatus})`));
    assert.ok(selectedFareNote.textContent.includes(route.fareNote));
    assert.ok(economyHint.textContent.includes(route.fareNote));
    assert.equal(route.fareStatus, "listed fare");
    assert.match(selectedFareNote.textContent, /1 June 2027/);
    assert.ok(selectedFareNote.querySelector("a").href.includes("google.com/travel/flights"));
    assert.doesNotMatch(economyHint.textContent, /assumed amount/);
    assert.match(document.getElementById("date-feasibility-note").textContent, /1 June 2027/);
  }
  dom.window.close();
});

run("offer expiry is date-inclusive and historical options allow explicit illustration", () => {
  const dom = createDom(indexHtml, { data: research });
  const { document } = dom.window;
  assert.equal(value(dom, "promotion-picker"), "citi-rewards-16k");
  assert.equal(document.querySelector('#promotion-picker option[value="boundary-route"]').disabled, false);
  assert.equal(document.querySelector('#promotion-picker option[value="expired-route"]').disabled, false);
  assert.equal(document.querySelector('#promotion-picker option[value="historic-no-expiry"]').disabled, false);
  dom.window.close();
});

run("all seven shipped offers are selectable and fees enter the actual model", () => {
  const dom = createDomFromResearchFile();
  const d = dom.window.document, picker = d.getElementById("promotion-picker");
  const presets = dom.window.MILES_RESEARCH.promotions;
  assert.equal(presets.length, 7);
  for (const p of presets) {
    const o = d.querySelector(`option[value="${p.id}"]`);
    assert.equal(o.disabled, false, p.id);
    picker.value = p.id;
    dispatchInput(dom.window, picker, "change");
    assert.equal(value(dom,"welcome-miles"), String(p.bonusMiles));
    assert.equal(value(dom,"miles-rate"), String(p.milesRate));
    assert.equal(d.querySelector('[data-output="offer-fee"]').textContent, dom.window.MILES_CALCULATOR.formatMoney(p.fee || 0));
    const c=dom.window.MILES_CALCULATOR;
    const route=c.getDefaultRoute(c.getResearch().routes);
    const expected=c.calculateScenario(route,{...c.defaultExample,welcomeMiles:p.bonusMiles,milesRate:p.milesRate,monthlyCap:p.monthlyCap,offerFee:p.fee||0});
    assert.equal(d.querySelector('[data-output="total-cost"]').textContent,c.formatMoney(expected.totalCost));
  }
  picker.value="citi-rewards-16k";dispatchInput(dom.window,picker,"change");
  assert.equal(d.querySelector('[data-output="total-cost"]').textContent,"S$370.00");
  assert.match(d.querySelector('option[value="hsbc-travelone-new-customer-20k-2026-10"]').textContent,/assumed/);
  dom.window.close();
});

run("shared model ignores legacy fee inputs whether present or absent", () => {
  const dom = createDom();
  const { MILES_CALCULATOR } = dom.window;
  const route = MILES_CALCULATOR.getDefaultRoute(MILES_CALCULATOR.getResearch().routes);
  const base = {
    monthlySpend: 1000,
    monthlyCap: 1000,
    milesRate: 4,
    cashbackPercent: 1.7,
    welcomeMiles: 16000,
    displacedCashBonus: 0,
    awardCash: 100,
    minutesPerMonth: 15,
    hourlyValue: 40,
    economySaving: 450,
    willingness: 150,
    transferBlock: 1,
  };
  const withoutLegacyFee = MILES_CALCULATOR.calculateScenario(route, base);
  const withLegacyFee = MILES_CALCULATOR.calculateScenario(route, {
    ...base,
    ongoingFee: 226.2,
  });
  const withInvalidLegacyFee = MILES_CALCULATOR.calculateScenario(route, {
    ...base,
    ongoingFee: Number.NaN,
  });
  assert.equal(withoutLegacyFee.totalCost, 370);
  assert.equal(withLegacyFee.totalCost, 370);
  assert.equal(withLegacyFee.netBenefit, 230);
  assert.equal(withLegacyFee.feesCost, 0);
  assert.equal(withInvalidLegacyFee.available, true);
  assert.equal(withInvalidLegacyFee.totalCost, 370);
  dom.window.close();
});

run("a paid configured default cannot leave a bonus silently modeled as free", () => {
  const paidOnly = {
    routes: routeRows(1),
    promotions: [offers[2]],
    defaultPromotion: "paid-route",
    checked: "2026-10-20",
  };
  const dom = createDom(indexHtml, { data: paidOnly });
  assert.equal(value(dom, "promotion-picker"), "custom");
  assert.equal(value(dom, "welcome-miles"), "0");
  assert.equal(
    dom.window.document.querySelector('#promotion-picker option[value="paid-route"]').disabled,
    false,
  );
  assert.match(dom.window.document.getElementById("promotion-note").textContent, /selectable illustrations/i);
  dom.window.close();
});

run("a stale default offer is never selected automatically", () => {
  const stale = {
    ...research,
    promotions: [
      { ...offers[0], expiry: "2026-10-19" },
      { id: "custom-current", label: "Current offer", bonusMiles: 2000, milesRate: 1, monthlyCap: 5000, expiry: "2027-01-01" },
    ],
  };
  const dom = createDom(indexHtml, { data: stale });
  assert.equal(value(dom, "promotion-picker"), "custom");
  assert.equal(dom.window.document.querySelector('#promotion-picker option[value="citi-rewards-16k"]').disabled, false);
  assert.equal(value(dom, "welcome-miles"), "0");
  dom.window.close();
});

run("custom entry retains manual values and offer text/source cannot inject markup", () => {
  const dom = createDom(indexHtml, { data: research });
  const picker = dom.window.document.getElementById("promotion-picker");
  picker.value = "unsafe-copy";
  dispatchInput(dom.window, picker, "change");
  const note = dom.window.document.getElementById("promotion-note");
  assert.equal(note.querySelector("img"), null);
  assert.match(note.textContent, /<img src=x/);
  assert.equal(note.querySelector('a[href^="javascript:"]'), null);
  picker.value = "custom";
  const miles = value(dom, "welcome-miles");
  dispatchInput(dom.window, picker, "change");
  assert.equal(value(dom, "welcome-miles"), miles);
  assert.match(note.textContent, /manual/i);
  dom.window.close();
});

run("blank, zero-spend and zero-bonus-covered inputs are handled without NaN", () => {
  const dom = createDom();
  const { document } = dom.window;
  const spend = document.getElementById("monthly-spend");
  spend.value = "";
  dispatchInput(dom.window, spend);
  assert.equal(document.getElementById("input-errors").hidden, false);
  assert.match(document.getElementById("result-status").textContent, /correct/i);
  spend.value = "0";
  dispatchInput(dom.window, spend);
  assert.match(document.getElementById("result-status").textContent, /positive monthly miles/i);
  document.getElementById("welcome-miles").value = "54500";
  dispatchInput(dom.window, document.getElementById("welcome-miles"));
  assert.equal(document.querySelector('[data-output="earning-months"]').textContent, "0");
  assert.doesNotMatch(document.getElementById("full-result").textContent, /NaN/);
  dom.window.close();
});

run("spend cap, exact earning-month boundary and whole-month rounding update live", () => {
  const dom = createDom();
  const { document } = dom.window;
  const cap = document.getElementById("monthly-cap");
  cap.value = "500";
  dispatchInput(dom.window, cap);
  assert.equal(document.querySelector('[data-output="effective-spend"]').textContent, "S$500.00 / month");
  assert.equal(document.querySelector('[data-output="earning-months"]').textContent, "20");
  assert.equal(document.querySelector('[data-output="cashback-cost"]').textContent, "S$170.00");

  cap.value = "1000";
  const rate = document.getElementById("miles-rate");
  rate.value = "3.85";
  dispatchInput(dom.window, rate);
  assert.equal(document.querySelector('[data-output="earning-months"]').textContent, "10");
  assert.equal(document.querySelector('[data-output="month-excess"]').textContent, "0 miles");

  const idealised = document.getElementById("idealised-transfer");
  idealised.checked = false;
  dispatchInput(dom.window, idealised, "change");
  assert.equal(value(dom, "transfer-block"), "10000");
  assert.equal(document.querySelector('[data-output="earning-months"]').textContent, "11");
  idealised.checked = true;
  dispatchInput(dom.window, idealised, "change");
  assert.equal(value(dom, "transfer-block"), "1");
  assert.equal(document.querySelector('[data-output="earning-months"]').textContent, "10");
  dom.window.close();
});

run("personal time sensitivity and route selection change the rendered scenario", () => {
  const dom = createDom(indexHtml, { data: research });
  const { document } = dom.window;
  const minutes = document.getElementById("minutes-per-month");
  minutes.value = "30";
  dispatchInput(dom.window, minutes);
  assert.equal(document.querySelector('[data-output="time-cost"]').textContent, "S$200.00");
  assert.equal(document.getElementById("detail-net").textContent, "+S$140.00");

  const destination = document.getElementById("destination");
  destination.value = "route-2";
  dispatchInput(dom.window, destination, "change");
  assert.equal(document.querySelector('[data-output="target-miles"]').textContent, "25,000");
  assert.equal(document.getElementById("economy-saving").value, "300");
  assert.match(document.getElementById("economy-hint").textContent, /not a live quote/);
  assert.match(document.getElementById("award-route-display").textContent, /Destination 2/);
  dom.window.close();
});

run("economy cash alternative is labeled clearly and all twelve destination prices and notes follow the selected route", () => {
  const routeData = routeRows();
  const dom = createDom(indexHtml, { data: { ...research, routes: routeData } });
  const { document } = dom.window;
  assert.equal(
    document.querySelector('label[for="economy-saving"]').textContent.trim(),
    "Economy flight cost (cash alternative) SGD",
  );
  assert.match(document.getElementById("selected-fare-context").textContent, /Tokyo.*S\$460\.00.*assumed/i);
  assert.match(document.getElementById("selected-fare-context").textContent, /1 June 2027/);

  const destination = document.getElementById("destination");
  const economy = document.getElementById("economy-saving");
  const context = document.getElementById("selected-fare-context");
  for (const route of routeData) {
    destination.value = route.id;
    dispatchInput(dom.window, destination, "change");
    assert.equal(economy.value, String(route.economySaving), `${route.id} economy price`);
    assert.match(context.textContent, new RegExp(route.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(context.textContent, new RegExp(route.fareNote.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(document.getElementById("economy-hint").textContent, new RegExp(route.fareNote.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(context.textContent, /assumed/i);
    const dateNote = document.getElementById("date-feasibility-note").textContent;
    if (route.id === "tokyo-hnd") {
      assert.match(context.textContent, /June 2027|CAPTCHA/);
      assert.match(dateNote, /1 June 2027/);
    } else {
      assert.doesNotMatch(context.textContent, /Haneda|HND|June 2027|CAPTCHA/i);
      assert.match(dateNote, /general earning estimate/);
      assert.doesNotMatch(dateNote, /Haneda|HND|June 2027|CAPTCHA/i);
    }
  }
  dom.window.close();
});

run("a manually edited fare is marked user-entered and survives other input updates", () => {
  const routeData = routeRows();
  const dom = createDom(indexHtml, { data: { ...research, routes: routeData } });
  const { document } = dom.window;
  const destination = document.getElementById("destination");
  const economy = document.getElementById("economy-saving");
  destination.value = "route-2";
  dispatchInput(dom.window, destination, "change");

  economy.value = "987.65";
  dispatchInput(dom.window, economy);
  assert.match(document.getElementById("selected-fare-context").textContent, /user-entered/i);
  assert.match(document.getElementById("selected-fare-context").textContent, /not a retrieved quote/i);
  assert.equal(document.querySelector('[data-output="economy-value"]').textContent, "S$987.65");

  const minutes = document.getElementById("minutes-per-month");
  minutes.value = "30";
  dispatchInput(dom.window, minutes);
  assert.equal(economy.value, "987.65");
  assert.equal(document.querySelector('[data-output="economy-value"]').textContent, "S$987.65");
  assert.match(document.getElementById("selected-fare-context").textContent, /user-entered/i);

  destination.value = "route-3";
  dispatchInput(dom.window, destination, "change");
  assert.equal(economy.value, String(routeData[2].economySaving));
  assert.match(document.getElementById("selected-fare-context").textContent, /Illustrative one-way estimate/);
  dom.window.close();
});

run("slides execute the same exported model and match the calculator's default totals", () => {
  const dom = createDom(slidesHtml, { data: research });
  const inlineScript = Array.from(dom.window.document.scripts).find((script) => !script.src);
  assert.ok(inlineScript, "slide navigation script is present");
  dom.window.eval(inlineScript.textContent);
  const { document, MILES_CALCULATOR } = dom.window;
  assert.ok(MILES_CALCULATOR);
  assert.equal(document.getElementById("slide-earning-months").textContent, "10");
  assert.equal(document.getElementById("slide-total-cost").textContent, "S$370.00");
  assert.equal(document.getElementById("slide-break-even").textContent, "S$0.00");
  assert.equal(document.getElementById("slide-net").textContent, "+S$240.00");
  document.getElementById("next-slide").click();
  assert.equal(document.getElementById("slide-count").textContent, "Slide 2 of 6");
  dom.window.close();
});

run("dated fare defaults and real slides agree on the Tokyo example", () => {
  const dom = createDomFromResearchFile(slidesHtml);
  const script = Array.from(dom.window.document.scripts).find(s => !s.src);
  dom.window.eval(script.textContent);
  const d = dom.window.document;
  assert.equal(d.getElementById("slide-economy-saving").textContent, "S$858.00");
  assert.equal(d.getElementById("slide-total-value").textContent, "S$1,008.00");
  assert.equal(d.getElementById("slide-net").textContent, "+S$638.00");
  dom.window.close();
});

run("historical SC X offer applies explicitly with its unavoidable fee", () => {
  const dom = createDomFromResearchFile();
  const d = dom.window.document;
  const picker = d.getElementById("promotion-picker");
  assert.equal(d.querySelector('option[value="sc-x-2019"]').disabled, false);
  picker.value = "sc-x-2019";
  dispatchInput(dom.window, picker, "change");
  assert.equal(value(dom,"welcome-miles"), "60000");
  assert.equal(value(dom,"miles-rate"), "1.2");
  assert.equal(d.querySelector('[data-output="offer-fee"]').textContent, "S$695.50");
  assert.equal(d.querySelector('[data-output="total-cost"]').textContent, "S$795.50");
  assert.equal(d.getElementById("illustration-status").hidden, false);
  picker.value = "citi-rewards-16k";
  dispatchInput(dom.window, picker, "change");
  assert.equal(d.querySelector('[data-output="offer-fee"]').textContent, "S$0.00");
  assert.equal(d.querySelector('[data-output="total-cost"]').textContent, "S$370.00");
  assert.equal(d.getElementById("illustration-status").hidden, true);
  dom.window.close();
});

run("help disclosures start collapsed and remain operable", () => {
  const dom = createDomFromResearchFile();
  const d = dom.window.document;
  const helps = Array.from(d.querySelectorAll("details.input-help"));
  assert.ok(helps.length >= 20);
  assert.ok(helps.every(h => !h.open && h.querySelector("summary")));
  const details = d.getElementById("selected-fare-note").closest("details");
  assert.ok(details);
  details.querySelector("summary").click();
  assert.equal(details.open, true);
  assert.ok(d.getElementById("promotion-note").closest("details"));
  assert.ok(d.getElementById("date-feasibility-note").closest("details"));
  dom.window.close();
});

run("assumptions start visible and remain interactive when toggled", () => {
 const dom=createDomFromResearchFile(), d=dom.window.document;
 assert.equal(d.querySelectorAll(".advanced-inputs").length,2);
 assert.ok(Array.from(d.querySelectorAll(".advanced-inputs")).every(g => g.open));
 assert.ok(Array.from(d.querySelectorAll(".section-help")).every(g => !g.open));
 assert.ok(d.getElementById("miles-rate").closest(".advanced-inputs"));
 assert.ok(!d.getElementById("promotion-picker").closest(".advanced-inputs"));
 const group=d.getElementById("miles-rate").closest("details");
 group.querySelector("summary").click(); assert.equal(group.open,false);
 group.querySelector("summary").click(); assert.equal(group.open,true);
 d.getElementById("miles-rate").value="2";dispatchInput(dom.window,d.getElementById("miles-rate"));
 assert.equal(d.getElementById("sticky-months").textContent,"20");
 assert.equal(d.querySelectorAll(".section-jumps a").length,4);
 dom.window.close();
});

process.stdout.write(`\n${passed} runtime checks passed.\n`);
