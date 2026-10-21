# Contextual field help UX update

Prior release e0e14b90c0700d5e4f544bd72f6f2024177ed496 (previous Pages queue pending at prior report). User requested contextual question buttons/hover and UX review.

Executed: input-specific help remains within its original field and receives a ? button beside label. Accessible name includes exact label, aria-controls identifies associated help, expanded state maintained. Click/tap toggles and pins; desktop hover-capable devices preview; Escape closes. Help expands in document flow below matching input, avoiding offscreen popovers. Generic About this input copy replaced with field-specific help summaries. Editable assumptions stay open; non-field help remains in section-level disclosures. Existing control nodes, hint IDs and dynamic fare text preserved. No model/offer/slide edits.

Verification: scripts/check.sh passed13Python,20DOM/runtime checks and2JSsyntax checks. Regression exercises every field button for context, click andEscape, alongside all7preset/all12route tests. Local desktop browser clicked rate help.390px mobile viewport: no horizontal overflow; button44×44, panel readable and directly related to rate field; assumptions open. Screenshot /home/hermes/.hermes/browser_screenshots/browser_screenshot_3e23cf43.png is host-local, not portable preservation. No physicalphone, nativekeyboard or screenreader test. Hover event implemented but physical pointer interaction not independently exercised. Deployment pending.

Rollback: git revert <contextual-help release commit>, then push origin main with project runner. No approval-policy, service, secret or Hermes changes. Used file tools and named check command, no inline Python/execute_code.
