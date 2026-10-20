# Miles: a personal cost–benefit analysis

A five-minute interactive presentation for Singapore colleagues: start with what the experience is worth to you, then compare miles with the cash and time you give up.

- [Presentation content and calculator specification](presentation.md)
- [SQ sweet spots and current promotional examples](research/sweet-spots.md)
- [Recalculated one-way worked examples](research/worked-examples.json)
- [Change and rollback record](CHANGELOG.md)

All redemption examples are one-way, per person. Actual award availability, cash fares and charges have not been checked for specific dates. Cash travel inputs in the worked examples are illustrative, not quotations. Card promotions are time-limited; follow their cited terms.

## Application and presentation

- [Live calculator](https://yiming-xu.github.io/miles_cba/)
- [Five-slide browser presentation](https://yiming-xu.github.io/miles_cba/slides.html)

Static HTML/CSS/JavaScript, no backend, analytics, external assets or collection of financial inputs. GitHub still handles ordinary hosting request metadata. Use arrow keys or on-screen controls for slides; print to PDF if needed.

The application rounds accumulation to whole months and defaults to idealised 1-mile transfer blocks. Shared demo: SIN–HND, 1 June 2027, Citi Rewards 16,000-mile welcome offer; 4mpd on S$1,000 eligible monthly spending. Model:10 months,S$400 cost,+S$200 net. Economy S$450 and other cash values remain assumptions, not verified quotes; SQ blocked the exact-date fare search. The pace cannot establish readiness by the flight date. Bonus fulfillment delay is explained, not numerically modelled. General fees remain editable; welcome-fee/delay/cash-gift fields removed. All12 Singapore-origin award zones and indicative Cathay routings are shown. See research/refresh-notes.md for current terms and limitations. No already-expired historical offer has been sufficiently verified to add a preset; current offers disable after their actual expiry. The tool is not a card optimiser or existing-mile valuation tool.

Verification: 13 Python reference/static tests; separate actual app.js DOM execution using Node and jsdom covering defaults, route changes, time sensitivity, zero spending, blank validation, cap and welcome delay. DOM simulation is not a full visual/mobile browser acceptance test.

Run reference tests: `python3 -m unittest discover -s tests -v`.
