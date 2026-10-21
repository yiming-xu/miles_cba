# Slide consistency release

Prior deployment e3d7ca704d4ebe64b6c4864528fab5558db6f580. User authorised UX/UI consistency review, changes and deployment.

Changes: new slide-only stylesheet overrides projection typography and spacing across six slides; no calculator/model change. At1920canvas audience prompts29.76px (previous16), body and labels scale from canvas without tiny rem caps. Retained all six slides, QR, photographs, sources, wines and First Class comparison. Explicit economic cost wording, complete value sum, visible10months versus7available, fixed shared-example handoff, other-route header for tips, transfer-delay caution. FirstClass benefits labelled not part ofBusiness; table-service dining dated28October2026.

Validation:13Python and18JSDOM checks passed. Browser geometry checks all6slides at1920×1080 and1280×720 showed no tested text/card crossing control boundary. Slide2/6 visual checks found no overlap. Source notes remain outside canvas; no physical projector/phone or printedPDF test. Photo dependencies remote. Previous content/model review issues not related to slide consistency remain open; no silent fare/card-term refresh.

Rollback: git revert <slide-consistency release commit> in deployment checkout then push origin main via approved scripts/github/miles-gh.py runner. Restore code only, not fare or award availability. No services or credential configuration changed. Deployment verification pending.
