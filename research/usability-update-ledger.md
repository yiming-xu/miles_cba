# Calculator and slide usability changes

Prior release:7d7db20226e38f8c89fe1bb752eabf68bf2bbaa1. Scope authorised: collapsible caveats, selectable historical illustration offers, slide guidance, explicit cost subtraction, redemption tips.

Executed: calculator details moved into native keyboard/touch accessible details/summary disclosures; input values and fare provenance remain visible. Historical offers selectable explicitly, never auto-default; stated historical fee added automatically to total and shown separately. Current paid offers remain disabled. SC X2019 scenario can illustrate60000 miles but includes695.50 annual fee. Invalid fee/expiry remains blocked.

Slides revised separately within six-slide format. Validation/deployment pending.

Rollback: git revert <this release commit> in deployment checkout then push origin main via scripts/github/miles-gh.py. Prior release above. No services/credentials changed; unrelated Node assets untouched.
