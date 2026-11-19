# BlindIQ v1.72.0 — useful hunting history

The existing Log tab now includes season summaries, named-spot history, waterfowl renewal reference totals, and official reporting resources. Home / Log / Account navigation, native sharing, weather, preferences, billing, notifications, and the parked map infrastructure are preserved.

## Season and spot tools

Summaries count actual logged hunts, recorded sightings, harvests, zero-harvest outings, species and states; practice hunts are excluded from totals and CSVs while remaining visibly labeled in the log list. July 1–June 30 is an explicitly labeled organizational logbook season, not a legal hunting season. Date, state, category and spot filters apply consistently to totals, the list and exports. Custom dates support the period a licensing agency actually asks about. Missing sighting counts remain unknown, not zero. New records save the local hunt date; old records without it use UTC with a visible explanation.

Spot names are optional during logging, with suggestions from that hunter's existing spots in the selected state. Existing saved hunts can be assigned/renamed in Reporting details, including zero-harvest hunts. Names match ignoring case and repeated whitespace within the same state. Generic waterfowl management zones are not treated as named blinds. “This spot last season” selects the previous July–June logbook window for the selected spot.

## Waterfowl renewal reference

The renewal view shows the exact selected period, logged hunting dates, ducks, geese and other waterfowl, plus duck/goose totals by state. Its CSV excludes practices and includes a missing-log/non-submission notice. It does not choose HIP screening answers, claim completeness, renew a license, certify HIP or submit a federal/state survey. Zero logged harvest is not evidence that the hunter did not hunt. Federal context is linked to https://www.fws.gov/program/migratory-bird-harvest-surveys/what-we-do .

## Reporting and data storage

Each actual hunt has Reporting details. Hunters complete the official process themselves, then optionally store one or more agency confirmations with harvested species, harvest date, county/parish/town and method. Entries are labeled user-entered, not agency verified, and are not substitutes for required tags, official harvest records or in-person checks. They are not included in social-share captions/cards. Official resources for all 50 states are reviewed in [the source report](reporting/SOURCE_REVIEW_2026-11-19.md); this is a reporting-resource directory, not a verified nationwide rule/deadline engine.

The additive `supabase/LOGBOOK_TOOLS_SETUP.sql` upgrade adds `hunt_local_date`, `spot_name` and bounded JSON reporting details; it is applied to the hosted project. Existing rows are preserved, with no inferred local dates or confirmation numbers backfilled. Owner-only SELECT/UPDATE checks and confirmed returned rows protect saves; optimistic comparisons reject conflicting details edits. Reporting edits require online access for cloud/queued records. Demo records remain browser-local.

Logbook reads now paginate beyond the default API row limit. Offline/stale copies show an explicit notice and a Refresh logbook control. New offline-sync writes use the queued UUID to avoid duplicate inserts on retry; pending/server IDs are deduplicated before totals. CSV cells are quoted and protected against spreadsheet formula execution.

## Validation

90 unit/database tests, including season boundaries, local/legacy dates, unknown sightings, zero/practice isolation, state-scoped spot names, renewal totals, CSV safety, confirmation validation, all-state directory coverage, additive/idempotent RLS migration, and a real-client/mock-transport 1,201-record pagination test with per-result cache notices. Browser checks cover prior-spot filtering, renewal CSV contents, multiple confirmation entries, storage-failure retry, renaming and reload persistence, all 50 reporting choices and responsive widths. Existing login/deletion, logger/category/bag-limit and installed-cache upgrade/offline checks pass. Production guards keep map rendering excluded and app/service-worker versions aligned.
