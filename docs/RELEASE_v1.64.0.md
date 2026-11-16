# BlindIQ v1.64.0 — complete package

November 16, 2026. Full project for manual GitHub upload, combining the tested root-source repair with the locally prepared forecasting infrastructure. Built on existing BlindIQ; no replatforming.

## Included

- One-page hunting hub: state, official state source link, grouped species dropdown, independent Saw/Harvested counters and a fixed Save session action.
- Expandable session species, optional location/notes/photo and sharing; saved logbook and practice mode retained.
- Selected IQ monogram in app branding, manifest/home-screen icons, notification defaults and share cards.
- Bottom tabs: Hunt, Maps, Movement Forecast, Logbook, Account.
- Existing Waterfowl migration, deer planning/biology reference and a new turkey movement/gobbling development panel.
- Maps/property-lines architecture plan; no map provider or parcel feed activated.
- 16-source deer/turkey research registry, eight-table additive Supabase migration, NWS dry-run/write worker, private observation scaffolding and validation tests.
- Existing 29-state waterfowl data, source verification report, date-dependent bag calculations and non-waterfowl field logging.
- Matching root React source, production dist, version/cache markers and build consistency verification, addressing the prior upload where version metadata changed but root App.tsx remained old.

## Validation

All 41 Node regression/database tests pass. TypeScript, production Vite compilation and release verification pass. The pre-existing large-bundle advisory remains. Production-browser checks cover all restored hunt categories, sightings/harvest save, multiple species, logbook, practice reset, state protection, Maps, deer/turkey movement panels, unverified-state logging, waterfowl species limits and 320/390/768/1440 widths. Service-worker testing verifies an older controlled cache upgrades to this release and the new hub opens offline after login.

Test environment: Node 24.22.1 / pnpm 11.25.0. The project retains its declared Node 22 / pnpm 10.28.0 configuration. The new PGlite dependency is development-only. Hosted authentication/billing, private production photo uploads, native mobile sharing, hosted database migration and worker scheduling were not exercised against production.

## Coverage and deployment boundaries

Waterfowl guidance remains limited to the existing audited states and the documented current-session calculation scope. Other species and unsupported states use field logging only. Deer/turkey scores are not published: research, weather and biological context are groundwork for separately validated models. The live NWS pilot test accepted South Carolina weather and rejected stale Maryland data. Dryad file downloads returned HTTP 403; datasets remain referenced candidates, not imported training data.

Uploading this ZIP updates project files only after the user commits them and hosting rebuilds. It does not apply SQL or activate a weather job. See `START_HERE.md` for correct root-level upload and `docs/DEER_TURKEY_FORECASTING.md` for staged backend setup. This package excludes Git metadata, credentials, node_modules and local authentication binaries. Prior releases and baseline archives remain untouched.
