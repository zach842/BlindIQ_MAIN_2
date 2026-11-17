# v1.67.0 — BlindIQ field map workspace

## Functionality

The map now occupies the available window below the app header and above the main navigation. The forest/cream/gold controls and spot cards are native BlindIQ UI. Standard hunting-map workflows informed the implementation; no competitor code, icons, screenshots or proprietary tiles are included.

- Floating locate/zoom/north controls; explicit permission for a single GPS fix with device-reported accuracy.
- USGS Topo and Aerial basemaps with source attribution, provider/date link and remembered layer settings. Imagery resolution and collection dates vary; it is not live imagery. Basemap requests go to USGS for the viewed area. No background tracking is performed.
- Saved spots with category, notes, editable names, explicit move-and-save, deletion confirmation, marker selection and list filtering. Search finds saved names/notes or a latitude, longitude coordinate pair; it is not a place/address geocoder.
- Line and simple-area drawing, undo/clear, save/edit/delete and spherical planning estimates in yards/miles/acres. No terrain/elevation distance, turn-by-turn routing, survey accuracy or legal access is implied. Self-crossing/degenerate areas are rejected; dateline-spanning saved drawings are not supported.
- Collapsible detail panels let phone users draw on the map while keeping measurements available. Panels scroll independently; source credits remain visible.
- GeoJSON export and validated additive import of 2D WGS84 Points, LineStrings and simple Polygons. Import has file/feature/vertex limits, rejects unsupported geometry and confirms additions before saving. Imported IDs are regenerated to prevent collisions; names, kind, notes, geometry and valid creation timestamps are preserved. No GPX, polygon holes or MultiPolygon import.

## Data preservation

Reads existing blindiq-waypoints-v1 account-scoped pins when no v2 map document exists. First successful save writes a single account-scoped v2 document containing spots and drawings; the original v1 key remains untouched. Corrupt/unreadable saved data blocks overwrites rather than silently replacing content. Backup files contain precise locations and should be shared intentionally. This is browser-local storage, not cloud sync or encryption. Clearing site data removes it; exporting provides a portable copy. Older app versions will not display new v2 drawings, but v2 data remains stored for a later upgrade.

## Availability

No Regrid license/account is connected. Parcel boundaries, ownership and verified hunting-access layers remain unavailable. Offline basemap downloads, cloud sync, elevation, place geocoding, turn-by-turn navigation and foreground/background track recording are not implemented. The user chose to finish map tools before parcel integration. A saved area is a personal drawing, not a property or access boundary. Existing waterfowl/deer/turkey forecast behavior is unchanged and is not driven by saved map pins yet.

## Verification

- Production TypeScript/Vite build and version/cache/lazy-module guard passed.
- 71 automated tests passed, including legacy storage preservation, corrupt-data rejection, coordinate parsing, known-distance and small-square area checks, backup round-trip, invalid geometry/size limits and invalid acreage rejection.
- Chrome production-build map test passed: legacy pin retained, create/move/edit, layer toggles, spherical line/area saves, search, GeoJSON download/import, invalid import preservation, delete, tab remount persistence, remembered basemap and four responsive widths with no horizontal overflow or page scrolling. No real account or user location was used; screenshots show temporary test annotations.
- Logger/category/save/state protection/waterfowl-cap browser regression and installed PWA cache upgrade/offline hub tests passed.
- Weather fixture success/failure regression passed. A live NWS request in the automated browser failed to fetch; the UI handled the failure. This is not evidence of live forecast availability or a new forecasting model.
- No Supabase schema, billing, notifications or private keys changed. Physical mobile hardware, offline tile coverage and parcel accuracy have not been validated in this release.

## Sources

- MapLibre renderer: https://maplibre.org/maplibre-gl-js/docs/
- USGS Topo: https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer
- USGS Aerial service/collection dates: https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer
- General workflow reference: https://support.onxmaps.com/hc/en-us/articles/32659615053069-How-to-use-onX-Hunt
