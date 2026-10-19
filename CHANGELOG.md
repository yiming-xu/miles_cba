# Change and rollback record

## One-way content upload
- Prior remote state: private `yiming-xu/miles_cba`, branch `main`, containing LICENSE.
- Scope: add README.md, presentation.md, research/sweet-spots.md, research/worked-examples.json and this log; preserve LICENSE.
- Changes: convert all worked redemption scenarios to one-way Singapore-origin; recalculate costs and time; separate standard sweet spots from time-limited promotions; retain cited card examples.
- No credentials included. No repository settings, visibility, Pages, runtime or services changed.
- Verification: Decimal recalculation locally; citation-ID checks; remote exact-file content readback after upload. The completion reply records the resulting commit.
- Rollback: revert the upload commit (the commit adding this file), then push the revert to main. Do not delete the repository or LICENSE. Example: `git revert <upload-commit-sha> && git push origin main`.
