# TODOs

## Design

### Extract Lightweight Design Foundation Into `DESIGN.md`
- What: Create a dedicated `DESIGN.md` after the first UI implementation pass, using the design foundation in `docs/codex/personal-growth-habit-tracker.md` as the starting point.
- Why: Prevent visual drift as more screens and components get added.
- Pros: Easier consistency, clearer design tokens, and less guesswork later.
- Cons: Small extra documentation step after the first implementation pass.
- Context: The repo currently has no design system file, and the plan now contains enough design rules that they will eventually deserve their own home.
- Depends on / blocked by: Best done after the first real UI exists.

## Engineering

### Add Lower-Level Regression Coverage For Date And Status Logic
- What: After v1 is working, add a small lower-level regression suite for date-boundary logic, derived-status rules, and template-schema parsing.
- Why: Protect the easiest subtle regressions that browser-level E2E tests are worst at isolating.
- Pros: Faster debugging, more stable future refactors, and less pressure on the E2E suite to explain pure logic failures.
- Cons: Extra test work after the first implementation pass.
- Context: The riskiest pure logic in this app is local-date ownership, completion/day-strength derivation, and strict template validation. These are easy to break and slower to diagnose if only covered through end-to-end tests.
- Depends on / blocked by: Best done after the first implementation exists and the real helper boundaries are visible.
