# Upload this complete project — BlindIQ v1.64.1

This is the full application, with the redesigned source and matching compiled output included. It is not the earlier forecasting add-on.

1. Extract the ZIP. Open the folder **BlindIQ_MAIN_2-v1.64.1**.
2. In GitHub, open `zach842/BlindIQ_MAIN_2` and the repository root, where the existing `package.json`, `src`, `public`, and `vercel.json` live.
3. Upload the **contents inside** the extracted folder into that root, replacing the matching files. Do not upload the ZIP itself, and do not nest `BlindIQ_MAIN_2-v1.64.1` inside the repository.
4. Include the whole package, particularly `src/App.tsx`, `src/main.tsx`, `src/refresh.css`, `public/sw.js`, `scripts`, `tests`, `package.json`, `pnpm-lock.yaml`, and `dist`. Updating only package.json or icons leaves the old screen in place.
5. Commit the upload. Wait for Vercel to finish a successful deployment for that commit. The root Vite project uses `pnpm install --frozen-lockfile`, `pnpm run build`, and output directory `dist`, as configured in `vercel.json`.
6. Open the site online. After signing in, confirm the hub heading **Hunt. Log. Done.**, state and hunting-category dropdowns, all species rows in that category with Saw/Harvested counters, Maps and Movement Forecast tabs, IQ icon, and version **v1.64.1**. The upgraded service worker should reload the app once. An iOS shortcut may need removal and re-addition to refresh its OS-cached icon.

The build now fails if the root source, compiled app, visible version, icon references or offline cache markers disagree. This prevents another deployment that only changes a version label.

## Included but not switched on remotely

The deer/turkey forecasting SQL migration, sources, worker and tests are included. A GitHub frontend upload does **not** apply the SQL to Supabase or schedule the worker. Follow `docs/DEER_TURKEY_FORECASTING.md` when ready for staging setup. Raw research datasets have not been imported. Maps, property lines, and deer/turkey activity predictions are still in development; no fake live forecast is displayed.

Your current GitHub main and live deployment are not changed by downloading this ZIP. No GitHub credentials or local authentication tools are included.
