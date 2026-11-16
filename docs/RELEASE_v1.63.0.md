# BlindIQ v1.63.0 — one-page hunting hub

November 16, 2026. Incremental redesign of the existing application following the user's phone sketch; no replatforming or remote deployment.

## Main screen

State dropdown, official rules link, one species dropdown grouped by hunt category, Saw and Harvested counters, session totals and a fixed Save session action. A first counter tap opens the session automatically. Selecting another species in the same group accumulates entries without leaving the page. State and category lock while a session is active; save or discard before reassigning the session. The exact species can still change. Saved sessions remain locked until New session, preventing accidental extra counts after saving.

Notes, location, photo and sharing are available on the same page in expandable sections. Practice mode is in the optional details section before logging starts. The logbook stays a bottom tab. Waterfowl references, dates, restrictions, zone selector and identification guide are in an expandable section when audited rules are available. Existing billing/account/notification features remain available through their existing screens.

Location logging supports 50 states. Waterfowl bag calculations are enabled only for the existing audited 29 states; other states use the logging catalog without calculated bag allowances. Other species remain field-log only. Rule links lead to the current loaded waterfowl source, Maryland deer hub, or the selected state's wildlife agency landing page when no species-specific source has been curated. These links do not represent a new all-species/all-state legal audit.

## Bottom navigation and icon

Hunt, Maps, Movement Forecast, Logbook, Account. Maps currently explains the planned basemap/parcel/waypoint feature and its unavailable state; it does not display boundaries. Movement Forecast includes the existing Migration Pulse page and a clearly labeled deer planning panel. Maryland whitetail has linked DNR breeding context; no deer score, prediction or nationwide rut calendar is invented.

A new SVG field-journal and compass mark replaces the bird-specific mark in the header, favicon, manifest icons, Apple touch icon, notification defaults and shared card logo. New icon filenames are versioned and service-worker cache version advances. Old assets remain for compatibility. Some installed home-screen shortcuts may require removal and re-addition to update their cached icon.

## Validation and limits

25 Node regression tests pass. TypeScript and production Vite build pass, with the pre-existing large-bundle advisory. Chrome demo checks cover direct Saw/Harvested logging, selecting multiple species in a session, save, state/category protection, Maps/Movement navigation, all species categories, zero-harvest practice reset, unverified-state isolation, species bag enforcement, reload of saved data, and layout overflow at 320/390/768/1440 widths. The new icon and mobile hub are visually reviewed. The hub browser regression is included as `tests/hub-browser.mjs`; legacy browser entrypoints forward to this current regression.

Browser tests use disposable demo/local storage and block service workers. Live billing, production backend, private cloud photo storage, native mobile share sheets and installed-PWA upgrade behavior were not exercised against production. No parcel vendor/API license was purchased, no GPS collection was added, no database schema or server functions changed. Unfinished sessions remain in application memory across tabs; save before refreshing or closing the app. A session still covers one hunt category; multi-hunter/group logging remains out of scope.

Run `pnpm test` and `pnpm build`. Optional browser testing requires a running demo server and Playwright in the testing environment: `BLINDIQ_TEST_URL=http://127.0.0.1:5173 node tests/hub-browser.mjs`. Set CHROME_PATH to a local Chrome executable if needed. Test screenshots are written under /tmp. See [the infrastructure plan](HUB_MAPS_MOVEMENT_PLAN.md) for data/licensing architecture and source links.
