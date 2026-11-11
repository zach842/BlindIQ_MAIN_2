# BlindIQ v1.61 validation

Baseline: `d8876d82c2b2a3411dd8340b7cb292e297a73b03` (v1.60.0). Review: November 11, 2026.

## Results

| Check | Result | Evidence / scope |
|---|---|---|
| Locked dependency installation | PASS | Existing `pnpm-lock.yaml` retained without dependency changes. |
| Regression suite | PASS | `pnpm test`: 19 tests, 19 passed, 0 failed. Includes all 29 states, every loaded state/zone/bird bag calculation, report coverage, representative agency-specific date changes, separate/combined bags, totals, Sunday closures and calendar start/end boundaries. |
| TypeScript | PASS | `pnpm lint` equivalent (`tsc --noEmit`) and `tsc -b` completed without errors. |
| Production compilation | PASS | Existing Vite build compiles the root application into `dist`. This is compilation of the existing app, not a replacement application. Bundle-size advisory remains; no framework or dependency upgrade was introduced. |
| Mobile UI / current hunt | PASS | Headless Chrome, 390×844, existing demo login and installation dialog. South Carolina: four drake mallards plus two wood ducks fills six ducks; separate merganser remains enabled. Add one merganser and one coot: logger shows eight. Screenshot inspected. |
| Summary / persistence / logbook | PASS | Summary shows eight; save to existing demo store preserves all eight logged birds; Waterfowl Logbook opens; remembered login survives reload. No uncaught browser errors. |
| Feature preservation | PASS for source preservation | Existing auth/billing/services, photos, location/weather, bird guide, Migration Pulse, notifications, styles, backend functions, schema/migrations and legacy app source remain unchanged. See `RELEASE_MANIFEST_v1.61.json` for exact file hashes and modified paths. |
| Live production integrations | NOT RUN | No production account/database/billing credentials were supplied. No production writes, purchases, messages or deployment performed. Demo/local persistence evidence is not presented as a live-backend test. |

The available local runtime was Node **24.22.1** with pnpm **11.25.0**. The repository's existing Node **22.x** and pnpm **10.28.0** declarations are preserved. Installation emitted an engine-version warning because the local runtime differs; type checks, tests and compilation succeeded. The test runner uses standard Node APIs and the repository's locked TypeScript compiler.

## Reproduce

At the repository root, using the declared Node 22 environment:

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm lint
pnpm build
```

`scripts/run-tests.mjs` compiles only the data/calculation/calendar modules into a temporary directory, runs Node's test runner and removes that temporary directory. No extra test dependency is required. The ZIP excludes `node_modules`, Git metadata and local environment files.

For the browser check, run the existing app locally without production environment variables, sign in with the prefilled demo account, dismiss installation instructions, select South Carolina, start a hunt, and follow the bird sequence above. Review, save and open the logbook. This deliberately exercises the existing demo path without production side effects.

## Upgrade and rollback

1. Review the [state-by-state audit](REGULATION_VERIFICATION_2026-2027.md) and source changes before deployment.
2. Use the extracted repository root, preserving the deployment's existing environment settings. The nested v1.23 folder is legacy material.
3. Run the commands above, then deploy through the repository's existing process. No new database migration is required.
4. Confirm the dashboard/Account marker reads v1.61. Its query-versioned service worker and cache name are v1.61 so connected clients can replace the old cached application.
5. Roll back using the untouched v1.60 baseline ZIP or baseline commit. Existing saved-hunt schema and IDs remain compatible.

Bag guidance covers the current hunt and the loaded restrictions; it does not replace official rules or automatically calculate possession, previous hunts, permit eligibility, alternate license tiers, or every special-area condition. Those limits are explicit in the audit and UI.
