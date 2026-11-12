# BlindIQ v1.62.1 — Saw and Harvested

November 12, 2026. Incremental update to the existing v1.62.0 multi-species app, matching the requested separate sightings and harvest controls.

Each species has independently labeled Saw and Harvested counters, with plus/minus corrections. On phones the two counters sit side by side under the species name; wider screens show them as columns beside the name. Sightings do not imply harvest, and adding a harvest does not automatically add a sighting. Count observations as entered; the app does not identify repeat sightings of the same animal.

Summary, saved logbook and share-card rows show both counts. Sighting-only species are saved with a zero harvest count, so a zero-harvest session can still record wildlife activity. Existing saved records without sightings keep their harvest counts and do not acquire invented historical sighting totals. Hunt totals, dashboard harvest totals and waterfowl bags continue to sum harvest only. Saw remains enabled when a waterfowl harvest limit is filled.

Storage uses an optional `saw` property within the existing entries JSON. Existing count remains harvest. No new database columns or remote migrations are introduced. The existing saved-record, local/demo, offline queue and cloud entry-array paths carry the data unchanged. Live production cloud/offline synchronization was not exercised; browser tests use demo storage and block service workers. Unsaved sessions remain in memory as in v1.62.0; save before closing or refreshing the browser.

Validation: 25 Node tests pass, TypeScript and production build pass, and Chrome checks cover independent increments/corrections, a sighting-only species, summary totals, save/reload, logbook labels, generated share image, four viewport widths (320/390/768/1440), non-overlapping controls, and waterfowl sighting/harvest isolation at a filled species bag. The original regulation modules and 29-state audit remain unchanged. Non-waterfowl regulation coverage remains field-log only.

Run `pnpm test` and `pnpm build`. Optional browser test: with a running demo server and Playwright installed, run `node tests/sightings-browser.mjs`; BLINDIQ_TEST_URL sets the server URL and CHROME_PATH optionally chooses a local Chrome executable. Outputs are written under /tmp. No remote deployment or GitHub push performed.
