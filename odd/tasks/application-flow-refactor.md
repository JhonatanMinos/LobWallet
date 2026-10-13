# Improve local-first application flows

Refactor synchronization, session/cache lifecycle, and wallet reads without redesigning the UI or blocking the initial render.

## Scope and constraints

- User authorized general project refactoring and explicitly approved `gpt-6.1-sol` for delegated exploration and implementation in this session.
- Preserve existing edits, especially `AuthService.php`, `DashboardTest.php`, package manifests/locks, and existing frontend tests; never commit unrelated user changes.
- Keep the remote API as sync source, Query Builder conventions, transactional ingestion, and separate auth/sync/wallet responsibilities.
- Preserve existing account-selection semantics within authorized accounts; do not introduce a new primary-account policy.
- Preserve two-factor behavior and local user/passkey records; credential/cache cleanup must not become broad account deletion.
- No dependency changes, remote operations, publishing, or UI redesign.

## Delivery

- Feature: `application-flow-refactor`.
- Initial forecast: 670–980 authored changed lines. Revised behavior/test forecast after FLOW-001: 1,125–1,345, excluding generated files and task-document overhead. Keep coherent coverage rather than compressing tests.
- Strategy: `ask-on-risk`; user selected `feature-branch-chain` (option 2). Verify the complete feature on a dedicated local branch; remote tracker/child PRs remain unauthorized.
- Initial boundary: `d173f2d6db8797b94d618c1002879727d41a700f` on `ux/ui-consistency`.
- Active local branch: `refactor/application-flow`; created without publishing or staging existing user changes.
- Running authored changes: 0. No implementation commits or PRs created.
- RDD: enabled by default; candidate consent remains separate. Assess each work-unit commit against the last reviewed boundary and follow native returned continuations.

## Tasks

- [ ] **FLOW-001 — Repair sync ingestion and dashboard refresh.**
  - Route: delegated; backend/frontend behavior and tests require multiple non-trivial files and preparation reading.
  - Files: `app/Services/SyncService.php`, `resources/js/services/sync.ts`, `tests/Feature/Sync/SyncFlowTest.php`, `tests/frontend/sync.test.ts`, `tests/frontend/dashboard-sync.test.tsx`.
  - Return accurate `has_changes`, reload singular `account`/`card` and `transactions`, and match the ownership pivot by both key columns.
  - Acceptance: authenticated sync, isolated incremental cursor, preserved previous rows, offline preservation and transaction rollback; unchanged/empty deltas do not report wallet changes; initial cached UI stays visible while sync is pending or fails.
  - Test-first: observe deterministic RED for refresh contract/composite pivot, then GREEN and refactor.
  - Checks: `vendor/bin/phpunit tests/Feature/Sync`; `npm run test:frontend -- tests/frontend/sync.test.ts tests/frontend/dashboard-sync.test.tsx`; focused normalizers/checks for modified files.
  - Implemented and normalized: truthful `has_changes`, singular prop reload, composite pivot, and explicit `since` query argument (the HTTP wrapper discarded inline queries).
  - Observed RED: initial sync run had 3 failures/9 errors; frontend had 3 failures. Final GREEN: sync 18 tests/54 assertions, dashboard 6/40, frontend 17 tests across 3 files; TypeScript, ESLint and scoped PHP/Prettier checks passed.
  - Parent spot-check: sync 18/54 passed after final PHPDoc correction; scoped PHPStan for `SyncService.php` passed with zero errors; `git diff --check` passed.
  - Actual source/tests: 695 authored lines (418 backend, 277 frontend). Coverage includes offline preservation, incremental cursor, rollback and cached first rendering. No schema changes.
  - One honest future-PR slicing pass: backend and frontend are coherent slices; backend is 18 lines above the nominal 400-line PR budget. No remote PR is authorized; preserve coverage and seek a size exception if that backend slice is later published unsplit.
  - Rollback: revert this task's two production-file changes and remove its three new tests, without affecting unrelated user changes.
  - Local work-unit commit and native assessment/review: pending; do not confuse green tests with review consent or approval.

- [ ] **FLOW-002 — Reconcile authenticated identity and local cache lifecycle.**
  - Route: delegated; auth/provider/sync behavior and tests require multiple non-trivial files.
  - Files: `app/Services/AuthService.php`, `app/Providers/FortifyServiceProvider.php`, `app/Services/SyncService.php`, `tests/Feature/Auth/RemoteSessionLifecycleTest.php`, `tests/Feature/Sync/SyncIdentityTest.php`.
  - Wire logout cleanup, prevent wallet/cursor leakage across successful account changes, validate stored remote identity against the Laravel session, and prevent mixed credentials after local persistence failure.
  - Acceptance: logout removes remote credentials and wallet/cursor cache; account switch cannot expose the prior snapshot; mismatched identities are rejected before API access; existing two-factor behavior and user/passkey records remain intact.
  - Test-first: observe RED for lifecycle/identity cases with faked HTTP and stray requests prohibited, then GREEN and refactor.
  - Checks: `vendor/bin/phpunit tests/Feature/Auth/RemoteSessionLifecycleTest.php`; `vendor/bin/phpunit tests/Feature/Sync`; focused normalizers/checks.
  - Forecast: 280–420 lines. Commit, observed checks, risk and review outcome: pending.

- [ ] **FLOW-003 — Restrict local wallet reads to the authenticated owner.**
  - Route: delegated; service/controller queries and isolation tests require multiple non-trivial files.
  - Files: `app/Services/WalletService.php`, `app/Http/Controllers/DashboardController.php`, `tests/Feature/DashboardTest.php`, `tests/Feature/Wallet/WalletIsolationTest.php`.
  - Use `owners.user_id` and `account_owner` to scope account/card/history and add-card account listing without network calls.
  - Acceptance: unrelated seeded users never share account/card/history; missing ownership returns empty data; necessary selected columns and ten-item history limit remain; initial dashboard makes zero HTTP requests.
  - Test-first: observe RED for multi-user isolation, then GREEN and refactor. Augment dirty dashboard fixtures without replacing existing assertions.
  - Checks: `vendor/bin/phpunit tests/Feature/Wallet/WalletIsolationTest.php tests/Feature/DashboardTest.php`; focused normalizers/checks.
  - Forecast: 150–230 lines. Commit, observed checks, risk and review outcome: pending.

## Verification and environment

- Baseline measured before source edits: dashboard PHPUnit passed (6 tests, 40 assertions); frontend passed (4 tests); TypeScript and ESLint passed.
- Baseline Pint failed on 26 pre-existing files; normalize only authorized modified files, not the repository.
- Baseline PHPStan initially hit sandbox TCP restrictions; approved escalation ran and found 64 pre-existing errors. Final scoped analysis of modified SyncService passed; the full baseline is still not clean.
- Full PHP suite is not safe to run yet: existing authentication tests call remote login without HTTP fakes. Do not contact the real API.
- Available runners: PHPUnit, Pint, PHPStan and Vitest. No Pest.
- Node 22.22.1 is below jsdom 30.1.2's declared minimum, but actual baseline frontend tests passed. Do not install/change dependencies; report this runtime support mismatch separately from observed results.
- Closure checks: `vendor/bin/phpunit`, `npm run test:frontend`, `npm run types:check`, `npm run lint:check`, `vendor/bin/pint --test`, `vendor/bin/phpstan analyse --no-progress`.
- Normalize modified source before functional proof and native candidate freeze; checks after freeze must be non-mutating.
- Verification evidence, failures/skips, rollback boundaries, commit IDs, and review slice boundaries will be recorded per task.

## Progress and next step

- Read-only explorer completed; parent spot-check confirmed missing `has_changes`, plural reload keys, and incomplete ownership pivot key.
- Existing initial rendering is local-first and will be preserved.
- FLOW-001 implementation and focused checks are complete; close its local work-unit commit and follow the native assessment before continuing FLOW-002. Do not alter session timeout.
- Session lifetime inquiry: `.env:34` declares `SESSION_LIFETIME=120`, read by `config/session.php:35` in idle minutes; remote token expiry is separate and not tracked locally. Do not change the timeout as part of this refactor.
- Engram mirror: `odd/application-flow-refactor/tasks` (full document and this locator).

