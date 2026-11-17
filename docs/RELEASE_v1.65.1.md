# BlindIQ v1.65.1 — login sizing and hunt deletion

## Login

Simplified returning-user screen: short welcome, credentials, remember-device checkbox, submit and account switch. Trial/brand marketing remains on signup. Added Show/Hide password, no email autocapitalization/autocorrection, keyboard hints, double-submit guard and autofill support. All text inputs/selects/textarea now use at least 16px at normal text size. The responsive auth card uses bounded widths and small-viewport height. Pinch zoom is preserved; viewport is not restricted with maximum-scale or user-scalable=no. Auth brand contrast corrected.

## Delete logged hunts

Each Logbook card has a Delete action with a date/state confirmation. Cancellation and errors preserve the card. A confirmed successful deletion removes it and recalculates history totals. Demo deletion persists to localStorage. Cloud deletion validates the signed-in user, filters by hunt ID and user ID, requires a returned deleted row, and then updates the device cache. A private photo is removed using only the owner-prefixed path returned by the database; a cleanup failure reports partial success without pretending the hunt still exists.

Cloud deletion is online-only. Unsynced queued hunts cannot be deleted until sync completes, preventing a deletion from racing an active insert. Offline delete queues/undo are not implemented.

## Required cloud setup

Run `supabase/HUNT_DELETE_SETUP.sql` once in the existing project's Supabase SQL editor. This enables RLS, grants authenticated DELETE and adds an owner-only policy using auth.uid(). Existing SELECT policy from Logbook Setup is required. Fresh setup in `HUNT_LOGBOOK_SETUP.sql` includes the same policy and grant. SQL was tested locally, not applied to a hosted database. A GitHub upload does not execute it. No credentials are included and no live user records were deleted during development.

## Verification

- Full TypeScript/Vite production build and version/cache/IQ/lazy-module consistency checks passed.
- 51 automated tests passed (34 regulation/species/category/weather tests plus 17 forecasting/database tests).
- New embedded PostgreSQL test applies actual deletion SQL twice and verifies owner deletion, cross-user denial, missing identity denial and anon denial. Hosted Supabase REST/storage integration has not been exercised.
- Mobile-emulated Chrome tested login widths 320/375/390/430/768/1440, no horizontal overflow, input computed size >=16px, focus scale 1, password reveal/hide, confirmed and cancelled deletion, storage-failure preservation and deleted record staying absent after reload.
- Existing browser logger and installed PWA cache-upgrade/offline checks passed for v1.65.1.
- Physical iPhone Safari/keyboard behavior has not been tested. CSS addresses the common small-input focus zoom cause without disabling accessibility zoom.
- No dependency changes from v1.65.0. Prior map/forecast/regulation functionality retained; no new regulation audit or animal forecast model is claimed.

Preview screenshots: `preview/login.png` and `preview/logbook-delete.png`. Existing map/weather screenshots are retained as v1.65.0 feature evidence.
