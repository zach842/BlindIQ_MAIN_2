# v1.65.0 — map and deer/turkey conditions preview

Built November 16, 2026 from the complete v1.64.1 category logger source. An additive extension, not an application rebuild. Regulation tables and harvest calculations are unchanged by this release; this release does not constitute a new regulation audit.

## User story and boundaries

Maps tab → bundled MapLibre module → USGS Topo tile service → interactive map. Tap map → explicit save → account-scoped localStorage → restored waypoint list and markers. Device location requires a button press and browser permission. GPS accuracy is displayed as device-reported meters; coordinates alone do not establish accuracy.

Movement Forecast → Deer or Turkey → select named pilot point → explicit refresh → NWS points endpoint → validated NWS hourly endpoint → freshness/unit/coverage validation → six upcoming forecast periods where available. Weather data is not wildlife observation data. Direct client requests use the browser User-Agent and NWS CORS support; production scale should use the prepared server worker for centralized caching, monitored identification, rate limits and health checks. No secrets are included.

Location/source metadata, timestamps and failure messages are shown. A refresh removes previously displayed values before requesting new data. Issue age must be at most six hours, issue times cannot be more than five minutes ahead, and usable near-current coverage is required. Current-hour expiry hides weather and requires refresh. Missing precipitation/temperature remain unavailable, never zero-filled. A timer rechecks expiry every 30 seconds. Pilot points are representative locations and are independent of the Hunt tab state selector. No forecasts are attached to saved map pins yet.

Map tiles are online-only. Existing PWA cache ignores cross-origin requests; this preview does not bulk-cache USGS tiles or NWS results. Maps loads on demand, with a recoverable module-load error panel so an unavailable map chunk does not replace the whole logger. USGS is a public service with no application-specific uptime guarantee. Large-module build warnings remain; MapLibre is kept outside the initial bundle.

## Accuracy and service limits

- Topographic lines show terrain, not parcel lines or hunting access.
- Regrid is not connected. Before activation, obtain a licensed plan, check target-county coverage/freshness against county GIS, record required attributions, confirm service limits/support/offline rights and implement a protected provider adapter. No Regrid purchase or API account was created.
- No statewide or national transfer of Maryland whitetail dates or Southeastern Eastern turkey study findings is implied. Numeric movement/gobbling scores await separate model acquisition, training and validation.
- Pins are local, account-scoped storage only; clearing site data loses them. No encryption, import/export, cloud backup or multi-device sync is provided in this preview.

## Verification

- TypeScript, production Vite build and release consistency guard passed. Guard checks version, offline registration/cache, IQ icons, hub and compiled lazy map/forecast modules.
- 50 automated tests passed: 34 regulation/species/category/weather tests and 16 forecasting pipeline/database tests. New weather tests cover stale/future/missing data, unit validation, coverage, null values and expiry.
- Chrome production-build browser test passed: real map canvas and USGS tiles, save/remount/delete pin, 320/390/768/1440 widths, Deer/Turkey navigation, weather success fixtures, service failure clearing old values, and no uncaught browser errors.
- Live browser NWS request succeeded for the Central Maryland pilot on November 16. Screenshot captures genuine returned weather; it is historical preview evidence, not permanently current weather.
- Existing logger flow and PWA cache-upgrade/offline checks passed: category lists, zero-harvest practice, multiple species counts, state protection, waterfowl caps, unverified-state isolation, reload and cache upgrade from v1.62.1 to v1.65.0.
- Frozen lockfile validation and the complete build command also passed with pnpm 10.28.0. Local build/test runtime: Node 24.22.1; package continues to declare Node 22.x and pnpm 10.28.0. No hosted deployment was performed.

## Primary references

- MapLibre: https://maplibre.org/maplibre-gl-js/docs/
- USGS basemaps: https://www.usgs.gov/faqs/what-are-base-map-services-or-urls-used-national-map
- USGS Topo service: https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer
- NWS API: https://www.weather.gov/documentation/services-web-api
- Maryland whitetail biology: https://dnr.maryland.gov/wildlife/Pages/hunt_trap/wtdeerbiology.aspx
- USDA turkey research: https://research.fs.usda.gov/treesearch/64503
- Regrid parcel accuracy: https://regrid.com/library/parcel-data-quality/how-to-evaluate-parcel-data-quality
