# BlindIQ v1.65.2 — hunting-first landing page

The landing page now introduces the state/category/Saw/Harvested flow with a labeled example, clear login/signup actions and accurate feature availability.

This full package retains v1.65.0 maps, pins and forecast pilots, plus the existing logger.

**Cloud hunt deletion needs a one-time database update:** open the existing project in Supabase → SQL Editor and run `supabase/HUNT_DELETE_SETUP.sql` once. This grants owner-only deletion; it does not delete any hunts. Uploading files to GitHub does not apply SQL. Demo deletion works without a database.

Login now puts the form first, includes Show/Hide password, and uses mobile-safe input sizing while preserving pinch zoom. Hunt Logbook has a Delete button on each saved hunt with confirmation. Cloud deletion requires a connection. Unsynced offline hunts must sync before deletion.

See `docs/RELEASE_v1.65.2.md` and screenshots in `preview/`.

## Preview

Run `pnpm install --frozen-lockfile`, `pnpm run build`, then `pnpm run preview` from this directory. Open the local URL printed by Vite. With no Supabase environment configured, use the existing demo login: hunter / confidence. Open Maps or Movement Forecast. Preview screenshots are in `preview/`.

## What works now

- Lazy-loaded MapLibre 5.15.0 map with live USGS Topo tiles, zoom/scale/attribution and user-requested device location.
- Tap to place, name, save, revisit and delete stand/blind/roost/parking/access/other pins. Pins are browser-local and account-scoped, not uploaded or synced. Anyone with access to this browser/device storage may access local data. Do not treat this as encrypted storage.
- Deer and turkey panels with manually selected Central Maryland and South Carolina coastal pilot weather points. Refresh fetches NWS hourly forecasts directly; timestamps, units and locations are visible. Stale or expired results are hidden. No automatic background refresh.
- Source-linked Maryland whitetail breeding context and Eastern turkey research context. These are labeled regional references, not daily animal movement predictions.

## Not connected

Regrid parcel boundaries, owner lookup, verified public hunting access layers, satellite imagery, offline tile downloads, cloud waypoint sync and validated deer/turkey activity models are not included. No simulated parcel polygons, owners or animal scores are displayed. Existing server-side forecast database/worker files are retained but not deployed, scheduled or connected by this release.

## Upload to GitHub

Extract the ZIP. Open `BlindIQ_MAIN_2-v1.65.2`. Upload its CONTENTS into the existing repository root, not the ZIP or the outer folder. Include src, public, scripts, package.json and pnpm-lock.yaml together. Wait for all files to upload, then commit once. This prevents partial commits with mixed app versions. Wait for Vercel READY and verify BlindIQ v1.65.2 appears.

No new environment variables or paid services are required. Apply the deletion SQL above for cloud hunt deletion. Existing production Supabase settings continue to apply to the original app. Do not upload credentials.

See `docs/RELEASE_v1.65.0.md` for verification and remaining work.
