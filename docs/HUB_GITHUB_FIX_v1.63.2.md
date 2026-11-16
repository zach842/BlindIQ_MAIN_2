# v1.63.2 — restore the hunting hub in the active GitHub source

## Observed mismatch

GitHub main at `1fbc32cf9c63c6b77a427a7118e92b7dcc88ecad` has package version 1.63.1 and updated icon assets, but root `src/App.tsx` still renders the v1.62.1 dashboard. It does not define Maps or Movement views and still uses the old bird logo. Root `src/main.tsx` registers the v1.62.1 worker URL. The latest READY production Vercel deployment inspected is built from that exact main commit. This identifies a source mismatch, not merely a browser-cache hypothesis.

## Fixed behavior

The active root application now presents state, official rule link, grouped species selector, independent Saw/Harvested counters and Save session on one page. Notes/photos/sharing remain expandable. Bottom navigation contains Hunt, Maps, Movement Forecast, Logbook and Account. Maps is explicitly planned; Movement retains working Migration Pulse with the sourced deer planning panel. No parcel boundaries or unvalidated deer predictions are invented. The selected IQ monogram is used by header and share cards; existing updated manifest/icon files are retained.

Version/cache markers advance together to 1.63.2. The production build now runs `scripts/verify-release.mjs` to check the actual root source, compiled JavaScript entry, icon files and offline version alignment. Committed dist is regenerated, removing superseded hashed bundles. Existing regulation data, calculation modules, services and backend functions are unchanged. The separately prepared deer/turkey database foundation is not deployed or mixed into this UI repair.

## Verification

- All 25 existing regulation and species tests pass.
- TypeScript, Vite production build and the release consistency gate pass. Existing bundle-size advisory remains.
- Chrome tests run against the compiled production build, not the Vite development server: direct counts, multiple species, save, all categories, state protection, Maps/Movement navigation, unverified-state logging, waterfowl limits, practice reset, remembered login and 320/390/768/1440 widths.
- A real service-worker fixture upgrades a controlled v1.62.1 cache to v1.63.2, removes the old cache and opens the new hub offline after login.
- Production billing, private cloud photo uploads and native share sheets were not exercised. Installed iOS shortcut icons can retain OS-level cached artwork until re-added.

## Direct GitHub workflow

The connected GitHub account has push/admin permission on `zach842/BlindIQ_MAIN_2`. This repair is committed locally on `fix/one-screen-hunting-hub` for a pull request against main. GitHub connector branch creation returned 403, and command-line authentication did not complete in this session. No remote branch or pull request has been created yet. After merge, verify the Vercel deployment is READY for the merged commit and that the live app shows v1.63.2. A branch or successful local build alone does not change production. Use the repository root as the Vite project, `pnpm run build`, and output directory `dist` as configured in `vercel.json`. Do not deploy a nested historical project folder.
