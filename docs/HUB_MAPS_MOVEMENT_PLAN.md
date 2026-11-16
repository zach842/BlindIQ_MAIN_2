# BlindIQ: hunting hub, maps and movement

Design and architecture review: November 16, 2026. Existing React/Vite app extended in place.

## One-page field hub

The user's sketch is the primary layout reference: state → official rules link → species → Saw / Harvested. One grouped species dropdown covers species across hunt categories; selecting a group variant shows one counter card. Species can change within a session's category while accumulating several entries. State and category lock after logging starts, preventing harvest from being reassigned to another jurisdiction. Save and New session remain on the same page. Notes, photo, area, sharing, practice mode and loaded waterfowl references use expandable sections. Other tabs preserve the in-memory session. Save before refresh or closing; unfinished drafts are not durable storage in this release.

Bottom navigation: Hunt, Maps, Movement Forecast, Logbook, Account. Existing waterfowl identification, dates, restrictions, bag calculations, sharing, photo workflow, membership, alerts and Migration Pulse remain accessible. Non-waterfowl guidance and waterfowl outside the audited 29 states are field-log only. The all-state link points to the official wildlife agency when a more specific loaded source is unavailable; it is not an assertion that one page contains every applicable federal, tribal or area rule. Maryland deer and loaded waterfowl have direct rule links.

## Maps: planned, not a functional parcel service yet

A real Maps tab establishes the destination and explains its current availability. No fake parcel polygons, owner records or location permission prompts. No paid vendors activated or API credentials added.

Suggested architecture:

1. Lazy-load the map renderer only when Maps opens. Evaluate MapLibre GL JS for raster/topo/satellite and vector overlays through the same interface. Keep renderer choice separate from basemap licensing and parcel data procurement.
2. Define a provider adapter returning coverage, attribution, vintage, geometry/tile URL, parcel ID, accuracy caveat and allowed cache duration. Evaluate licensed parcel data (for example Regrid) against county/state open GIS where legally reusable. Do not equate ownership with hunting access or survey accuracy.
3. Basemap, public-land, parcel boundary, ownership label and private waypoint layers remain independently configurable. Query only the viewport and zoom levels that need parcel detail; prefer vector tiles over downloading county-wide GeoJSON into a phone.
4. Keep secret provider keys on a backend gateway, with user authorization, request limits and usage accounting. Only a provider's explicitly public, restricted map token belongs in the client. Signed tile URLs and private waypoint authorization need a separate access design before launch.
5. Waypoints should have stable IDs, owner user, geometry, name, category (blind/stand/access), timestamps and local sync state. Default private. Add explicit consent before collecting GPS; give the user manual placement and deletion. No automatic connection to existing hunt photos or history locations.
6. Offline regions require provider permission, bounded download sizes, attribution, source vintage and stale-data indicators. Existing PWA caching is not a license to bulk-download tiles or parcel records.
7. Ship a single-state pilot after coverage, pricing, attribution, privacy, accuracy and mobile performance are reviewed. Test no-coverage, expired credentials, offline mode, slow loads and provider outages before widening coverage.

References checked: [MapLibre vector tile source](https://maplibre.org/maplibre-gl-js/docs/API/classes/VectorTileSource/), [raster source example](https://maplibre.org/maplibre-gl-js/docs/examples/add-a-raster-tile-source/), [Regrid API terms](https://regrid.com/terms/api). These establish technical/licensing options; no provider has been selected or purchased.

## Movement Forecast: staged expansion

The new destination contains working Waterfowl migration (the existing Migration Pulse page) and a Deer movement planning panel. No synthetic deer score is shown. Maryland whitetail has a linked regional biological reference; other states explicitly say timing has not been loaded. Sika, Sitka, mule deer and elk must not inherit a whitetail rut calendar.

Proposed forecast record: species/taxon, region geometry or management unit, date and timezone, observation horizon, source publication, retrieved time, biological breeding window, weather inputs, model version, confidence/coverage, explanation and expiry. Store biological context separately from daily prediction output.

Phase 1: curate agency/research breeding windows by region and species, with source/date coverage. Phase 2: add location/timezone-aware weather and daylight inputs, showing their age and outages. Phase 3: test a transparent movement model against held-out observations before presenting confidence or accuracy claims. Separate migration and deer breeding models; do not rename a breeding calendar a validated daily forecast. Do not transfer exact user locations to providers without an explicit design and consent.

[Maryland DNR whitetail biology](https://dnr.maryland.gov/wildlife/Pages/hunt_trap/wtdeerbiology.aspx) describes breeding from October into mid-December and most pregnancies beginning in the first half of November. This is regional context, not a personalized activity prediction. Northern-state timing must not be generalized nationwide.

## Broader app identity

New native SVG mark: a field journal and compass, in the existing forest/cream/gold palette. It represents a hunting field tool across species rather than a single bird. Simplified geometry keeps the installed app recognizable at small sizes. The app header, manifest, favicon, Apple touch icon, notification defaults and share-card logo use the updated mark. Old image assets remain packaged for compatibility. Versioned PNG filenames allow updated installs to fetch fresh assets. Existing iOS home-screen icons can remain cached until the shortcut is removed and re-added; no automatic refresh is promised.
