# Miles: a personal cost–benefit analysis

Five-minute interactive talk: personal value → earning → cash and time costs.

- [Live calculator](https://yiming-xu.github.io/miles_cba/)
- [Six-slide presentation](https://yiming-xu.github.io/miles_cba/slides.html)

## Fare snapshot
All12 destinations now use Google Flights listed one-way economy fares for1June2027, oneadult,SGD, checked20October2026. Route data includes source, airline, times and routing. Shanghai and NewYork involve connections. Prices may change; baggage, fare rules and checkout price require verification. Award inventory is not checked.

Shared Tokyo example: SQ nonstop858SGD listed economy,150SGD hypothetical extra willingness; modeled cost370SGD, value1008SGD, net638SGD. Ten full earning months do not fit the seven full calendar months to departure from the snapshot date. Fees and bonus timing remain simplified; positive net is not a booking recommendation.

## Validation
`python3 -m unittest discover -s tests`
`node tests/runtime.cjs` (JSDOM supplied by the existing scratch environment).

See research/dated-fare-update-ledger.md for prior state, scope and rollback. Historical research documents retain their original illustrative assumptions; current application data is research-data.js.
