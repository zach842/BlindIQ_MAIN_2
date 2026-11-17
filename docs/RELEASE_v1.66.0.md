# v1.66.0 — nationwide field-alert foundation

## Delivered

All 50 states available in alert preferences, independent of residence. Nationwide scope for season/regulation events; existing accounts retain their saved scope and new preference creation defaults to nationwide. Push remains opt-in. Optional inactivity logging nudges default off with 7/14/30-day cooldown, user IANA time zone and daytime hour selection; deterministic day/user jitter picks a 15-minute slot. New settings are explicitly saved and persist in demo/local or production database after setup.

Season generation now requires a current, explicitly reviewed source-linked period with a valid hunting-zone time zone and a review no older than 90 days. Tentative/legacy/unreviewed records are blocked. Individual date segments retain category/zone/eligibility text. Tomorrow/start/final-day/ended-yesterday messages refer to calendar dates and legal-hour verification, not legal permission to hunt. Queued events recheck the current period before delivery and cancel on withdrawal/date changes or expired wording.

Regulation notices remain a manually reviewed publication workflow, with only the past seven days considered and withdrawn/re-versioned events cancelled. No automatic agency crawler, legal change classifier or automatic package-upload announcement is implemented.

Delivery changes: paginated calendar/preferences/device queries; failed push attempts retained for up to five tries; accepted devices skipped; expired subscriptions disabled; no-send diagnostic mode; SQL errors on delivery records surface. Existing event-claim mechanism remains. No exactly-once or device receipt guarantee is claimed. Serial fan-out and Edge runtime throughput need live load testing. No nationwide digest, global quiet hours or total daily push cap is implemented.

Added SQL upgrade, readiness report for every state, source-review workflow, activation guide, pure scheduling tests, PostgreSQL permission tests, preference browser test and screenshot. Error loading notification setup now gives a readable setup error instead of an endless loading spinner. Inbox source links are real external links, separate from read/navigation actions.

## Observed hosted state / remaining work

Read-only Supabase inspection on November 17, 2026 found no notification-related public tables or notification Edge Functions. No hosted schema, function, secret, cron job or Vercel setting was changed. No real pushes or user messages were sent.

All 50 states are selectable; zero legacy seed rows were promoted to verified. The original seed covers only a few waterfowl calendars and is not a nationwide calendar. Official state/species/zone/date/eligibility/time-zone review remains outstanding. The app displays available reviewed-state counts without claiming complete coverage.

Live activation requires base schema plus upgrade, VAPID and cron secrets, deployment of both functions/shared imports, Vercel public key, device permission, a real closed-app test, and scheduler setup. Supabase connector available here does not expose secret-setting capability. Existing phone/browser permission cannot be granted by the package.

## Validation

- Production TypeScript/Vite build and version/cache/lazy-module release guard passed; existing large-chunk advisory remains.
- 59 automated tests passed: 41 regulation/species/category/weather/notification-policy tests plus 18 forecasting/database tests.
- Scheduling tests: zone date vs UTC, DST/Alaska time zones, tentative/stale/future review rejection, split boundaries/stable keys, nudge opt-in/inactivity/cooldown/one-slot scheduling and nationwide vs selected-state targeting.
- Real embedded PostgreSQL executes the base schema and the actual upgrade twice, checks defaults preserve opt-ins, owner-only preference access, rejected short cooldown, inaccessible unreviewed calendar rows and no client calendar writes.
- Local processor TypeScript compatibility check passed using the installed Supabase SDK and declared Deno/Web Push interfaces. This is NOT a Deno runtime or deployed-function integration test.
- Chrome production-build test passed: 50 choices, scope switch, follow Alaska from Maryland, nudge opt-in/cadence/timezone validation, save/remount persistence, four widths and no push permission prompt or uncaught JS error.
- PWA upgrade/offline hub check passed from v1.62.1 to v1.66.0. Physical iOS/Android background receipt, VAPID validity, hosted retries, cron/Vault health and load testing remain unverified.

Prior v1.65.2 landing, v1.65.1 login/deletion and v1.65.0 field-map/conditions work is retained. No new regulation/harvest-data changes were made in this update.
