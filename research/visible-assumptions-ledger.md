# Visible assumptions and UX pass

Prior release bbf4ca7adaf33010cd600eae84b1ebe1fc7a8307. User requested assumptions shown, overall UX pass and less inline execution/approval friction.

Executed: earning and time/transfer assumption groups open by default, retain user collapse capability. Explanation/help remains closed. Group names now describe contents instead of Advanced. Mobile fare provenance/title restored visibly (listed versus user-entered), summary target sizing and jump-link focus styling strengthened. No financial model, offer values or slide changes.

Validation: sh scripts/check.sh runs13Python tests,19actual-JS/DOM checks plus app/layout syntax checks. Regression verifies both assumption groups initially open, help closed, collapse/reopen and rate editing still work. Browser desktop tree and390px mobile viewport confirmed open groups; no page horizontal overflow;16px inputs,68px sticky. Mobile screenshot showed centred rate field unobscured and readable. No physical-phone/native-keyboard test. Review did not re-research card terms or resolve existing welcome-qualification modelling limitations.

Workflow: added scripts/check.sh, with reviewable named commands rather than execute_code/inline Python. No approval-policy, Hermes, credential or service changes. Publication uses existing approved GitHub runner. Fewer distinct commands improve reviewability but do not guarantee bypassing required approvals.

Rollback: git revert <this release commit> in deployment checkout, push origin main using approved runner. Review scope limited to calculator presentation. Deployment verification pending.
