# BlindIQ v1.68.0 — simple hunting logger

Implements the November 18 recording: authenticated Home has the IQ logo, “Hunt. Log. Share.”, Go Hunt and My Logbook. Navigation is Home / Log / Account. Go Hunt retains the existing state, official regulations link, hunting category and independent Saw / Harvested counters. Photo, Weather and Notes actions appear above counters; saved hunt sharing is visible without a disclosure. Weather is an optional observed-conditions text field stored in the existing notes column, not a forecast or automatic reading. Existing notes are unchanged.

Each saved log has a visible Delete log button and a confirmation. Confirmed owner-scoped server deletion removes the local cached record only after the server confirms success. Cancelled or failed deletions preserve the record. Offline queued hunts must sync before deletion, preserving protection against insertion/deletion races.

## Maps parked, not deleted

The production entry no longer imports or routes to `MapPage`; Vite emits neither MapPage nor MapLibre. `MapPage.tsx`, `mapData.ts`, `fieldMaps.css`, `scoutMap.css`, the MapLibre dependency, map data tests and the historical `tests/maps-browser.mjs` remain in source for future work. The latter targets the v1.67 map-enabled interface and is intentionally outside current app browser checks. Restore a reviewed route/import and update that test before reintroducing maps. `scripts/verify-release.mjs` asserts no map renderer ships; update that guard deliberately when re-enabling.

Local waypoint, map workspace, camera and settings keys are untouched. Parcel-provider architecture remains documented; no licensed Regrid parcel service is connected. No Supabase schema, authentication, billing or notification infrastructure is removed. Movement Forecast remains accessible from Account, preserving existing forecasts without adding a fourth bottom tab. Its styles now have a separate, map-free stylesheet.

## Verification

- Production TypeScript/Vite build and release guards, including excluded map bundles and matching app/service-worker versions.
- 71 unit/database tests: harvest rules, category/state isolation, map data, forecast input validation, owner-only deletion, notification and Vault protections.
- Mobile browser checks: responsive Home and login, all category logging, state/category locking, waterfowl caps, saved weather/notes, delete cancel/failure/confirmation/reload.
- Installed-app cache upgrade and offline Home.
