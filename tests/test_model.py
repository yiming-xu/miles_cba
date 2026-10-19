"""Specification-level checks for the static miles/CBA teaching tool.

These standard-library tests use a Python reference model and inspect the
static-page contract. They do not execute app.js; run a browser smoke test for
JavaScript behavior when a JS runtime is available.
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
    "ongoing_fee": D("30"),
    "transfer_block": 10000,
    "welcome_miles": D("0"),
    "welcome_delay_months": 0,
    "welcome_fee": D("0"),
    "displaced_cash_bonus": D("0"),
    "miles_cash_gift": D("0"),
}

ROUTES = {
    "Perth": {"award_miles": 42500, "economy_saving": D("300"), "willingness": D("100")},
    "Tokyo": {"award_miles": 54500, "economy_saving": D("450"), "willingness": D("150")},
    "Heathrow": {"award_miles": 108500, "economy_saving": D("700"), "willingness": D("500")},
}


def reference_model(route, overrides=None):
    """Mirror the documented whole-month, one-pool calculation for test vectors."""
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
    delay = values["welcome_delay_months"]
    if isinstance(delay, bool) or not isinstance(delay, int):
        raise ValueError("welcome delay must be a whole number of months")

    target = D(values["award_miles"])
    usable_welcome = min(target, D(values["welcome_miles"]))
    regular_target = target - usable_welcome
    if regular_target:
        transfer_goal = ((int(regular_target) + block - 1) // block) * block
    else:
        transfer_goal = 0

    eligible_monthly = min(D(values["monthly_spend"]), D(values["monthly_cap"]))
    miles_per_month = eligible_monthly * D(values["miles_per_dollar"])
    if transfer_goal and miles_per_month <= 0:
        return {"available": False, "reason": "no positive monthly miles earning"}

    months = 0 if transfer_goal == 0 else int(
        (D(transfer_goal) / miles_per_month).to_integral_value(rounding=ROUND_CEILING)
    )
    accrued = miles_per_month * months
    ready_months = max(months, delay if D(values["welcome_miles"]) > 0 else 0)
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
        + D(values["ongoing_fee"])
        + D(values["welcome_fee"])
        + D(values["displaced_cash_bonus"])
    )
    base_value = D(values["economy_saving"])
    cash_gift = D(values["miles_cash_gift"])
    net = base_value + D(values["willingness"]) + cash_gift - total_cost
    raw_break_even = total_cost - base_value - cash_gift
    return {
        "available": True,
        "months": months,
        "ready_months": ready_months,
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
        self.headings = []
        self._in_h1 = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "section" and "slide" in attrs.get("class", "").split():
            self.slides += 1
        if tag == "h1":
            self._in_h1 = True
        if tag == "script" and attrs.get("src", "").startswith(("http:", "https:")):
            self.external_assets.append(attrs["src"])
        if tag == "link" and attrs.get("href", "").startswith(("http:", "https:")):
            if attrs.get("rel") in {"stylesheet", "preload", "modulepreload"}:
                self.external_assets.append(attrs["href"])

    def handle_endtag(self, tag):
        if tag == "h1":
            self._in_h1 = False

    def handle_data(self, data):
        if self._in_h1 and data.strip():
            self.headings.append(data.strip())


class ReferenceModelTests(unittest.TestCase):
    def test_default_routes_use_full_award_rates_and_whole_month_costs(self):
        perth = reference_model("Perth")
        tokyo = reference_model("Tokyo")
        heathrow = reference_model("Heathrow")

        self.assertEqual((perth["transfer_goal"], perth["months"], perth["leftover"]), (D("50000"), 13, D("9500")))
        self.assertEqual((tokyo["transfer_goal"], tokyo["months"], tokyo["leftover"]), (D("60000"), 15, D("5500")))
        self.assertEqual((heathrow["transfer_goal"], heathrow["months"], heathrow["leftover"]), (D("110000"), 28, D("3500")))
        self.assertEqual(tokyo["cashback_cost"], D("255.00"))
        self.assertEqual(tokyo["time_cost"], D("150"))
        self.assertEqual(tokyo["total_cost"], D("535.00"))
        self.assertEqual(tokyo["break_even_willingness"], D("85.00"))
        self.assertEqual(tokyo["net"], D("65.00"))

    def test_one_mile_block_is_idealised_but_months_still_round_up(self):
        result = reference_model("Tokyo", {"transfer_block": 1})
        self.assertEqual(result["transfer_goal"], D("54500"))
        self.assertEqual(result["months"], 14)
        self.assertEqual(result["accrued"], D("56000"))
        self.assertEqual(result["leftover"], D("1500"))
        self.assertEqual(result["cashback_cost"], D("238.00"))
        self.assertEqual(result["time_cost"], D("140"))

    def test_single_monthly_spend_pool_respects_cap(self):
        result = reference_model("Tokyo", {"monthly_spend": D("1500"), "monthly_cap": D("1000")})
        self.assertEqual(result["months"], 15)
        self.assertEqual(result["cashback_cost"], D("255.00"))

    def test_welcome_miles_reduce_earning_and_credit_delay_is_parallel(self):
        result = reference_model("Tokyo", {
            "welcome_miles": D("20000"),
            "welcome_delay_months": 12,
            "transfer_block": 10000,
        })
        self.assertEqual(result["transfer_goal"], D("40000"))
        self.assertEqual(result["months"], 10)
        self.assertEqual(result["ready_months"], 12)
        self.assertEqual(result["leftover"], D("5500"))
        self.assertEqual(result["cashback_cost"], D("170.00"))

    def test_bonus_that_covers_award_leaves_no_earning_cost_and_has_delay(self):
        result = reference_model("Perth", {
            "welcome_miles": D("50000"),
            "welcome_delay_months": 3,
            "monthly_spend": D("0"),
        })
        self.assertEqual(result["months"], 0)
        self.assertEqual(result["ready_months"], 3)
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

    def test_optional_cash_gift_offsets_cost_but_displaced_cash_offer_is_a_cost(self):
        baseline = reference_model("Tokyo")
        adjusted = reference_model("Tokyo", {
            "miles_cash_gift": D("400"),
            "displaced_cash_bonus": D("200"),
            "welcome_fee": D("50"),
        })
        self.assertEqual(adjusted["total_cost"], baseline["total_cost"] + D("250"))
        self.assertEqual(adjusted["break_even_willingness"], D("0"))
        self.assertEqual(adjusted["net"], baseline["net"] + D("150"))


class StaticContractTests(unittest.TestCase):
    def test_required_static_files_exist_and_calculator_has_local_script_and_styles(self):
        for name in ("index.html", "app.js", "styles.css", "slides.html"):
            self.assertTrue((ROOT / name).is_file(), name)
        self.assertTrue((ROOT / "tests" / "test_model.py").is_file())
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        self.assertIn('src="app.js"', html)
        self.assertIn('href="styles.css"', html)
        self.assertIn("Value", html)
        self.assertIn("Earn", html)
        self.assertIn("Cost", html)

    def test_javascript_declares_model_and_explicit_finite_number_guard(self):
        js = (ROOT / "app.js").read_text(encoding="utf-8")
        self.assertRegex(js, r"function\s+calculateScenario\s*\(")
        self.assertIn("Number.isFinite", js)
        self.assertIn("Math.ceil", js)
        self.assertNotRegex(js, r"fetch\s*\(")
        self.assertNotRegex(js, r"XMLHttpRequest")

    def test_route_presets_match_the_one_way_saver_awards(self):
        js = (ROOT / "app.js").read_text(encoding="utf-8")
        expected = {
            "Perth": 42500,
            "Tokyo": 54500,
            "London Heathrow": 108500,
        }
        for city, miles in expected.items():
            self.assertIn(f'name: "{city}"', js)
            self.assertIn(f"awardMiles: {miles}", js)
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        self.assertIn('value="1000"', html)
        self.assertIn('value="4"', html)
        self.assertIn('value="1.7"', html)
        self.assertIn('value="15"', html)
        self.assertIn('value="40"', html)
        self.assertIn('value="30"', html)
        self.assertIn('value="10000"', html)

    def test_slide_deck_has_five_slides_and_no_external_asset_dependencies(self):
        inspector = MarkupInspector()
        inspector.feed((ROOT / "slides.html").read_text(encoding="utf-8"))
        self.assertEqual(inspector.slides, 5)
        self.assertFalse(inspector.external_assets)
        self.assertIn("yiming-xu.github.io/miles_cba/", (ROOT / "slides.html").read_text(encoding="utf-8"))

    def test_styles_do_not_import_external_fonts_or_assets(self):
        css = (ROOT / "styles.css").read_text(encoding="utf-8")
        self.assertNotRegex(css, re.compile(r"@import\s+url\s*\(", re.IGNORECASE))
        self.assertNotRegex(css, re.compile(r"url\s*\(\s*['\"]?https?://", re.IGNORECASE))


if __name__ == "__main__":
    unittest.main()
