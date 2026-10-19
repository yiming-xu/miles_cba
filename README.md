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

The application conservatively rounds accumulation to whole months and uses an editable hypothetical 10,000-mile transfer block. Leftover miles are valued at zero. This differs intentionally from the earlier continuous-accrual research examples: default Tokyo is 15 months, S$535 cost and S$65 net benefit at S$150 upgrade willingness. These are hypothetical assumptions, not quotes. Optional welcome credits must already be net usable miles; required qualifying spend and card-specific fulfilment conditions are not automatically modelled. The tool is a teaching scenario, not a card optimiser or existing-mile valuation tool.

Verification: 13 Python reference/static tests; separate actual app.js DOM execution using Node and jsdom covering defaults, route changes, time sensitivity, zero spending, blank validation, cap and welcome delay. DOM simulation is not a full visual/mobile browser acceptance test.

Run reference tests: `python3 -m unittest discover -s tests -v`.
