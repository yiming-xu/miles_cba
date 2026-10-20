"""Specification checks for the miles-versus-cash calculator and talk.

The Python reference model covers boundary vectors. tests/runtime.cjs separately
executes the shipped JavaScript against a DOM so input wiring and rendering are
exercised at the actual application boundary.
"""
from decimal import Decimal, ROUND_CEILING
from html.parser import HTMLParser
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
D = Decimal

DEFAULTS = {
    "monthly_spend": D("1000"),
    "monthly_cap": D("1000"),
    "miles_per_dollar": D("4"),
    "cashback_percent": D("1.7"),
    "minutes_per_month": D("15"),
    "hourly_value": D("40"),
    "award_cash": D("100"),
    "transfer_block": 1,
    "welcome_miles": D("16000"),
    "displaced_cash_bonus": D("0"),
}

ROUTES = {
    "Perth": {"award_miles": 42500, "economy_saving": D("300"), "willingness": D("100")},
    "Tokyo": {"award_miles": 54500, "economy_saving": D("450"), "willingness": D("150")},
    "Heathrow": {"award_miles": 108500, "economy_saving": D("700"), "willingness": D("500")},
}


def reference_model(route, overrides=None):
    """Mirror the whole-month, one-pool model; welcome timing is not simulated."""
    values = dict(DEFAULTS)
    values.update(ROUTES[route])
    if overrides:
        values.update(overrides)

    for key, value in values.items():
        if isinstance(value, (int, Decimal)) and D(str(value)) < 0:
            raise ValueError(f"{key} must not be negative")
    block = values["transfer_block"]
    if isinstance(block, bool) or not isinstance(block, int) or block < 1:
        raise ValueError("transfer_block must be a positive integer")

    target = D(values["award_miles"])
    usable_welcome = min(target, D(values["welcome_miles"]))
    regular_target = target - usable_welcome
    transfer_goal = (
        ((int(regular_target) + block - 1) // block) * block
        if regular_target
        else 0
    )

    eligible_monthly = min(D(values["monthly_spend"]), D(values["monthly_cap"]))
    miles_per_month = eligible_monthly * D(values["miles_per_dollar"])
    if transfer_goal and miles_per_month <= 0:
        return {"available": False, "reason": "no positive monthly miles earning"}

    months = 0 if transfer_goal == 0 else int(
        (D(transfer_goal) / miles_per_month).to_integral_value(rounding=ROUND_CEILING)
    )
    accrued = miles_per_month * months
    cashback_cost = eligible_monthly * months * D(values["cashback_percent"]) / D("100")
    time_cost = D(months) * D(values["minutes_per_month"]) / D("60") * D(values["hourly_value"])
    transfer_remainder = D(transfer_goal) - regular_target
    whole_month_excess = accrued - D(transfer_goal)
    welcome_excess = D(values["welcome_miles"]) - usable_welcome
    leftover = transfer_remainder + whole_month_excess + welcome_excess

    total_cost = (
        D(values["award_cash"])
        + cashback_cost
        + time_cost
        + D(values["displaced_cash_bonus"])
    )
    net = D(values["economy_saving"]) + D(values["willingness"]) - total_cost
    raw_break_even = total_cost - D(values["economy_saving"])
    return {
        "available": True,
        "months": months,
        "transfer_goal": D(transfer_goal),
        "accrued": accrued,
        "transfer_remainder": transfer_remainder,
        "whole_month_excess": whole_month_excess,
        "welcome_excess": welcome_excess,
        "leftover": leftover,
        "cashback_cost": cashback_cost,
        "time_cost": time_cost,
        "total_cost": total_cost,
        "break_even_willingness": max(D("0"), raw_break_even),
        "raw_break_even": raw_break_even,
        "net": net,
    }


class MarkupInspector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.slides = 0
        self.external_assets = []
        self.ids = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "section" and "slide" in attrs.get("class", "").split():
            self.slides += 1
        if attrs.get("id"):
            self.ids.append(attrs["id"])
        if tag == "script" and attrs.get("src", "").startswith(("http:", "https:")):
            self.external_assets.append(attrs["src"])
        if tag == "link" and attrs.get("href", "").startswith(("http:", "https:")):
            if attrs.get("rel") in {"stylesheet", "preload", "modulepreload"}:
                self.external_assets.append(attrs["href"])


class ReferenceModelTests(unittest.TestCase):
    def test_default_sin_hnd_example_cost_and_break_even(self):
        result = reference_model("Tokyo")
        self.assertEqual(result["transfer_goal"], D("38500"))
        self.assertEqual(result["months"], 10)
        self.assertEqual(result["leftover"], D("1500"))
        self.assertEqual(result["cashback_cost"], D("170.00"))
        self.assertEqual(result["time_cost"], D("100"))
        self.assertEqual(result["total_cost"], D("370.00"))
        self.assertEqual(result["break_even_willingness"], D("0"))
        self.assertEqual(result["net"], D("230.00"))

    def test_transfer_block_rounding_and_idealised_one_mile_boundary(self):
        normal = reference_model("Tokyo", {"transfer_block": 10000, "miles_per_dollar": D("3.85")})
        idealised = reference_model("Tokyo", {"transfer_block": 1, "miles_per_dollar": D("3.85")})
        self.assertEqual((normal["transfer_goal"], normal["months"]), (D("40000"), 11))
        self.assertEqual((idealised["transfer_goal"], idealised["months"]), (D("38500"), 10))
        self.assertEqual(idealised["whole_month_excess"], D("0.00"))

    def test_single_monthly_spend_pool_respects_cap(self):
        result = reference_model("Tokyo", {"monthly_spend": D("1500"), "monthly_cap": D("1000")})
        self.assertEqual(result["months"], 10)
        self.assertEqual(result["cashback_cost"], D("170.00"))

    def test_welcome_miles_reduce_earning_and_credit_timing_is_not_modelled(self):
        result = reference_model("Tokyo", {"welcome_miles": D("20000"), "transfer_block": 10000})
        self.assertEqual(result["transfer_goal"], D("40000"))
        self.assertEqual(result["months"], 10)
        self.assertEqual(result["leftover"], D("5500"))
        self.assertNotIn("ready_months", result)

    def test_bonus_that_covers_award_needs_no_monthly_earning(self):
        result = reference_model("Perth", {
            "welcome_miles": D("50000"),
            "monthly_spend": D("0"),
        })
        self.assertEqual(result["months"], 0)
        self.assertEqual(result["cashback_cost"], D("0"))
        self.assertEqual(result["leftover"], D("7500"))

    def test_zero_earning_with_miles_still_needed_is_unavailable_not_nan(self):
        result = reference_model("Tokyo", {"monthly_spend": D("0")})
        self.assertFalse(result["available"])
        self.assertIn("no positive", result["reason"])

    def test_negative_values_and_zero_transfer_block_are_rejected(self):
        with self.assertRaises(ValueError):
            reference_model("Tokyo", {"monthly_spend": D("-1")})
        with self.assertRaises(ValueError):
            reference_model("Tokyo", {"transfer_block": 0})

    def test_legacy_fee_input_is_ignored_but_displaced_cash_still_counts(self):
        baseline = reference_model("Tokyo")
        adjusted = reference_model("Tokyo", {
            "ongoing_fee": D("226.20"),
            "displaced_cash_bonus": D("200"),
        })
        self.assertEqual(baseline["total_cost"], D("370.00"))
        self.assertEqual(adjusted["total_cost"], baseline["total_cost"] + D("200"))
        self.assertEqual(adjusted["break_even_willingness"], D("120.00"))
        self.assertEqual(adjusted["net"], D("30.00"))


class StaticContractTests(unittest.TestCase):
    def test_required_static_files_and_research_script_are_local(self):
        for name in ("index.html", "app.js", "research-data.js", "styles.css", "slides.html"):
            self.assertTrue((ROOT / name).is_file(), name)
        self.assertTrue((ROOT / "tests" / "test_model.py").is_file())
        self.assertTrue((ROOT / "tests" / "runtime.cjs").is_file())
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        self.assertIn('src="research-data.js"', html)
        self.assertIn('src="app.js"', html)
        self.assertIn('href="styles.css"', html)
        self.assertLess(html.index('src="research-data.js"'), html.index('src="app.js"'))

    def test_javascript_exports_shared_model_and_rejects_nonfinite_inputs(self):
        js = (ROOT / "app.js").read_text(encoding="utf-8")
        self.assertIn("window.MILES_CALCULATOR", js)
        self.assertRegex(js, r"function\s+calculateScenario\s*\(")
        self.assertIn("Number.isFinite", js)
        self.assertIn("Math.ceil", js)
        self.assertNotRegex(js, r"fetch\s*\(")
        self.assertNotRegex(js, r"XMLHttpRequest")

    def test_default_inputs_and_removed_controls_match_the_shared_example(self):
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        for value in ('value="858"', 'value="150"', 'value="1000"',
                      'value="4"', 'value="16000"', 'value="100"',
                      'value="15"', 'value="40"', 'value="1"'):
            self.assertIn(value, html)
        self.assertIn("1 June 2027", html)
        self.assertIn("unverified", html.lower())
        self.assertIn('id="selected-fare-note"', html)
        self.assertIn('id="idealised-transfer" name="idealised-transfer" type="checkbox" checked', html)
        for forbidden in ('id="welcome-fee"', 'id="welcome-delay"', 'id="miles-cash-gift"',
                          'id="ongoing-fee"', 'data-output="fees-cost"'):
            self.assertNotIn(forbidden, html)
        self.assertRegex(html, r"(?is)annual card fees.*transfer fees.*not included")
        self.assertRegex(html, r"(?is)paid-fee offer presets.*disabled")
        js = (ROOT / "app.js").read_text(encoding="utf-8")
        for forbidden in ("welcomeFee", "welcomeDelayMonths", "milesCashGift"):
            self.assertNotIn(forbidden, js)

    def test_slides_have_six_pages_and_only_credited_official_images(self):
        inspector = MarkupInspector()
        slides = (ROOT / "slides.html").read_text(encoding="utf-8")
        inspector.feed(slides)
        self.assertEqual(inspector.slides, 6)
        self.assertTrue(all(url.startswith("https://assets.singaporeair.com/") for url in inspector.external_assets))
        self.assertEqual(len(inspector.ids), len(set(inspector.ids)))
        self.assertIn("1 June 2027", slides)
        self.assertIn("S$858", slides)
        self.assertIn('src="research-data.js"', slides)
        self.assertIn('src="app.js"', slides)

    def test_styles_do_not_import_external_fonts_or_assets_and_support_dynamic_tables(self):
        css = (ROOT / "styles.css").read_text(encoding="utf-8")
        self.assertNotRegex(css, re.compile(r"@import\s+url\s*\(", re.IGNORECASE))
        self.assertNotRegex(css, re.compile(r"url\s*\(\s*['\"]?https?://", re.IGNORECASE))
        self.assertRegex(css, r"\.award-chart-wrap\s*\{")


if __name__ == "__main__":
    unittest.main()
