# UI Consistency Refactor

## Objective
Improve frontend accessibility, visual token consistency, and language consistency without changing backend behavior or disturbing pre-existing worktree changes.

## Scope
- Make interactive shop results keyboard-accessible and provide accessible labels for icon-only controls.
- Replace page-specific hard-coded visual values with shared semantic color tokens where practical.
- Translate authentication and welcome flow copy to the application's existing Spanish language.

## Constraints
- Preserve existing uncommitted changes outside `resources/js` and `resources/css`.
- Keep mobile compatibility and existing component behavior.
- Use English for code and artifact content.

## Tasks
- [ ] UI-001: Fix shop-list and shop-detail accessibility semantics.
- [ ] UI-002: Consolidate shared visual tokens and apply them to dashboard, promotions, and maps.
- [ ] UI-003: Align authentication and welcome copy with Spanish UI language.

## Acceptance Criteria
- Shop results are usable by mouse, keyboard, and assistive technology.
- Icon-only controls have accessible names and visible focus states.
- Main frontend surfaces use shared semantic tokens instead of divergent page palettes.
- Authentication and welcome copy are consistently Spanish.
- Existing behavior remains intact and focused frontend checks pass.

## Verification
- `npm run format:check`
- `npm run lint:check`
- `npm run types:check`
- `npm run test:frontend`

## Progress
- Exploration complete.
- Implementation blocked: the delegated writer could not run because the session's agent thread capacity is exhausted and the configured `gpt-6.1-luna` model is unavailable. No source files were modified.

## Delivery
- Strategy: ask-on-risk.
- Route: delegated direct writer because the authorized change spans multiple non-trivial frontend files.
- Forecast: under 400 authored lines; reassess before commit.

## Next Step
Retry the bounded writer when an agent slot and compatible configured model are available, then verify and commit as one coherent work unit if the diff remains reviewable.
