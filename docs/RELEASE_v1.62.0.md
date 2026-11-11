# BlindIQ v1.62.0 — multi-species field sessions

Built on the existing v1.61.1 application, preserving the v1.60 feature foundation and v1.61 waterfowl audit. No replatforming, deployment, database migration or remote publication performed.

## Using the logger

Choose a hunt type, choose the state, and start. Waterfowl continues to use the existing 29-state verified bag guidance. Deer, turkey, other migratory birds, upland birds, big game, small game, predators/furbearers and other game open a field logger. Field logging supports 50 state locations without claiming regulation coverage in all 50 states.

Search species, tap + to add, and − to correct a count. State and hunt type lock while a session is open; returning to Hunt offers Resume Session instead of silently resetting the harvest. Optional area/unit/property stays separate from waterfowl zones. Finish opens the existing notes, location, equipment, photo and sharing workflow. Zero-harvest and practice sessions remain supported. Open Hunt Logbook finishes the session; all categories can be filtered in the logbook. Practice sessions stay out of live totals.

The catalog includes whitetail, Sitka black-tailed deer, separate sika stag/hind, elk, three squirrel choices and the earlier species catalog. Stable existing IDs are retained. Non-waterfowl categories use icons rather than misleading waterfowl identification images. Search includes partial names, so “Whitetail” also finds Coues whitetail. The category's Other Legal Game entry can record an animal not otherwise listed; identify it in the notes.

## Regulation coverage and sources

Non-waterfowl records explicitly show **Field log only**. No non-waterfowl season, tag, permit, daily, possession or seasonal allowance is calculated. The previous placeholder 999 limits have been removed; field-log entries use a zero sentinel that is bypassed by the logger and never presented as a legal allowance. Species menus are not claims that each species can be hunted in every selected state. Agency landing links and a federal reference provide research access, not completed regulation verification. Waterfowl rules, source report, calendar and calculation modules remain unchanged.

See [multi-species research and official sources](MULTISPECIES_EXPANSION.md) for the next regulation expansion and [waterfowl verification](REGULATION_VERIFICATION_2026-2027.md) for the audited coverage. The UI has state wildlife agency links; the federal reference is [USFWS General Hunting Laws](https://www.fws.gov/law/general-hunting-laws). Existing Migration Pulse and active-waterfowl notification telemetry remain scoped to waterfowl.

## Validation

- 23 Node regression tests pass: the original 19 waterfowl checks plus catalog IDs/coverage, no placeholder allowances, sika/Sitka separation, 50 location choices and legacy category fallback.
- TypeScript and production Vite build pass. Existing large-bundle advisory remains.
- Chrome demo browser tests pass for all eight restored categories: increment, decrement, pause/resume, area entry, summary, save, category/state persistence, reload and history filtering.
- Layout overflow checks pass at 320, 390, 768 and 1440 pixels in each restored logger.
- Original browser smoke passes six SC ducks plus separate merganser and coot, total eight, save, logbook and remembered login reload.
- Zero-harvest practice saving, sika selection and downloadable category-specific share-card generation pass.
- New desktop and mobile captures and the generated share card reviewed. Browser tests use demo/local storage with service workers blocked to isolate application flow.

Run `pnpm test` and `pnpm build`. Optional browser regression is `node tests/species-browser.mjs` with a running demo server, Playwright installed in the test environment, and Chrome installed by Playwright or supplied via CHROME_PATH. BLINDIQ_TEST_URL overrides the URL; screenshots and the test share card are written under /tmp. Browser tests use disposable browser storage and do not send real hunts to production.

## Practical limits

Saved records persist through reload. An unfinished session is held in application memory and survives screen navigation, not browser refresh or termination; save a zero-harvest session to keep a record. This is an individual field log; multi-hunter group sessions remain in development. Live authentication, billing, production database, private photo storage, native share sheets, push delivery and offline service-worker upgrades were not exercised against production. Existing category-aware save/queue/schema paths are reused unchanged. Confirm the existing hunt-category database setup is installed in the target backend before production rollout; no remote database was modified for this package.
