# BlindIQ Deployment Notes

## v1.29 — Any-device account access message

- Updated the login screen to explain that members can sign in on any internet-connected device.
- Kept the message focused on access to past hunts, regulations, and starting today’s hunt.
- Advanced the visible release marker and service-worker cache to v1.29.

## v1.28 — Waterfowl field guide and hunt sharing

- Replaced hunt-row letter placeholders with public-domain U.S. Fish & Wildlife Service reference photos.
- Added an in-hunt **Not sure?** action that opens a mobile field guide with common duck, goose, coot, swan, and snipe references, bullet-point identification markers, source credits, and category filters.
- Clearly marks broad-category thumbnails as representative so they are not mistaken for an exact species identification.
- Added the complete official USFWS *Ducks at a Distance* guide as an extended reference.
- Added private, on-device creation of a branded 1080 × 1350 BlindIQ hunt card.
- Added native phone sharing for compatible installed apps plus an image-download fallback.
- Shared cards exclude precise GPS coordinates and show state and selected zone only.
- Keeps the summary available after saving so the hunter can share before opening My Hunts.
- Advanced the visible release marker and service-worker cache to v1.28.

## v1.27 — Welcome-screen annual price

- Added **Only $10.99/year** directly beneath “Log hunts. Know the regs.” on the welcome screen.
- Styled the price in BlindIQ gold for clear visibility without competing with the primary headline.
- Advanced the visible release marker and service-worker cache to v1.27.

## v1.26 — $10.99 annual membership

- Standardized every in-app annual membership price at $10.99.
- Updated the locked Start Hunt call-to-action and Account membership card.
- Updated the README and secure membership instructions for the new recurring annual Stripe price and Payment Link.
- Retained permanent account-scoped hunt history and Test Hunt mode from v1.25.
- Advanced the visible release marker and service-worker cache to v1.26.

## v1.25 — Permanent hunt history and Test Hunt mode

- Added the account-owned `public.hunts` Supabase table with authenticated-user Row Level Security.
- Saves each live or test hunt atomically with its state, zone, date, season package, mode, bird count, and harvest entries.
- Restores hunt history from Supabase after login and across devices using the same account.
- Saves zero-bird hunts instead of silently discarding them.
- Added a distinct **Test Hunt** action for off-season practice and labels every saved test record.
- Excluded test hunts and test birds from the live season statistics.
- Added loading, empty, success, and database-error states to My Hunts.
- Tightened the existing account-trigger permissions and optimized the existing profile/subscription RLS policies after a Supabase advisor review.
- Advanced the visible release marker and service-worker cache to v1.25.

## v1.24 — Dashboard placement and mobile icon release

- Locked **Better the Community** into a final dashboard footer after all season dates, restrictions, zones, bag rules, official sources, and the legal disclaimer.
- Added a visible v1.24 marker directly beneath the dashboard feedback card so the deployed layout is easy to confirm.
- Added dedicated 180px iPhone, 192px Android, 512px Android, and 512px maskable Android icons using the BlindIQ duck-and-shield mark.
- Added explicit favicon and Apple touch-icon metadata and expanded the web-app manifest for both standard and maskable Android installs.
- Disabled browser caching for the service worker and manifest on Vercel, advanced the runtime cache, and made installed devices actively check for the latest release.

## v1.23 — Idaho, Oregon, and Washington expansion

- Added complete available 2026–27 regulation packages for Idaho, Oregon, and Washington.
- Expanded BlindIQ from 25 to 28 selectable states while preserving alphabetical dashboard and default-state lists.
- Added three Idaho duck areas, species-specific Idaho goose areas, controlled swan rules, shooting-hour guidance and official access links.
- Added Oregon duck and goose zones, Northwest Permit Goose requirements, sea-duck and brant permits, Lake County white-fronted-goose limit, reservation resources and official shooting-hour links.
- Added Washington’s statewide duck dates, five goose management areas, southwest goose certification, sea-duck and snow-goose harvest-card requirements, conditional brant rules and WDFW Hunt Planner.
- Added seven-duck aggregate logic for all three states and zone-aware goose limits for Oregon and Washington.
- Advanced the visible release marker and service-worker cache to v1.23.

## v1.22 — Eight-state 2026–27 expansion

- Added California, Florida, Iowa, Michigan, Missouri, Nebraska, New Jersey, and Ohio.
- Expanded BlindIQ from 17 to 25 selectable states while preserving alphabetical dashboard and default-state lists.
- Added the available official duck, goose, zone, special-hunt, shooting-hour, species-limit, public-area, and source information for every new state.
- Added date-dependent scaup guidance, California special-management warnings, Nebraska two-tier guidance, Florida limited-hunting-day rules, and New Jersey’s Sunday closure.
- Marked Missouri’s commission-approved package as tentative until final federal approval is reflected in the current MDC digest.
- Advanced the visible release marker and service-worker cache to v1.22.

## v1.21 — Community card follows the regulations

- Moved **Better the Community** to the bottom of the state dashboard.
- Hunters now see season dates, restrictions, zone information, bag rules, reviewed sources, and the legal disclaimer before the feedback invitation.
- Retained the second feedback entry on the Account screen and the complete email-preparation form.
- Advanced the visible release marker and service-worker cache to v1.21.

## v1.20 — Visible community feedback and deployment confirmation

- Added **Better the Community** directly below Start Hunt on the main dashboard.
- Retained the matching community-feedback entry on the Account screen.
- Added context-aware Back navigation so hunters return to the screen where they opened the form.
- Added a visible `BlindIQ v1.20` marker at the bottom of Account to confirm the correct release is deployed.
- Advanced the service-worker cache version so installed devices retrieve the new release.

## v1.19 — Better the Community

- Added a prominent **Better the Community** card to the Account screen.
- Added a guided submission form for regulation errors, app bugs, feature ideas, and general feedback.
- Includes the hunter's selected state and account email in each prepared report to make follow-up easier.
- Opens the hunter's email app with a message addressed to `office@blindiq.app`, where screenshots can be attached before sending.
- Connected the existing Contact support button to `office@blindiq.app`.
- Requires no new backend credentials or email-service setup for this release.

## v1.18 — 2026–27 regulations consolidation

- Replaced Maryland, Virginia, North Carolina, and South Carolina demo/reference packages with detailed 2026–27 season data.
- Added Eastern and Western Maryland duck dates, black-duck segments, goose population zones, light geese, brant, special days, and date-sensitive restrictions.
- Added full Virginia duck, Canada goose, light goose, brant, swan, teal, youth and veteran dates from Virginia DWR.
- Added North Carolina Inland and Coastal duck zones, goose zones, sea-duck dates, tundra swan, Sunday closure, and date-sensitive restrictions.
- Promoted South Carolina from archived to current with its 2026–27 dates, I-95 black/mottled rule, five-bird black-bellied whistling limit, scaup schedule, and goose seasons.
- Loaded Delaware’s official proposal options without presenting an unselected option as final.
- Corrected Minnesota’s early-goose dates, added youth waterfowl dates, and changed its pintail limit to two.
- Added multiple reviewed source links on state dashboards, including eRegulations and primary wildlife-agency pages.
- Kept West Virginia locked to archived reference data because the WVDNR download path still exposed the prior waterfowl PDF during the August 11 audit.
- Removed remaining “demo hunt” wording from the live hunt experience.

## v1.17 — Shorter welcome headline

- Shortened the lead message to **“Log hunts. Know the regs.”**
- Kept the formal word “regulations” in legal, safety, and detailed informational copy where precision matters.

## v1.16 — Hunt logging leads the product story

- Changed the welcome message to **“Log hunts. Know the regulations.”**
- Repositioned account creation as the beginning of the user’s hunt log.
- Repositioned login as the place to continue a hunt log, review past hunts, check regulations, or start today’s hunt.
- Updated the website and installable-app descriptions to emphasize hunt logging and daily harvest tracking.
- Preserved all 17 states, alphabetical state selectors, Maryland Eastern and Western Duck Zones, weather, subscriptions, hunt history, and remaining-harvest guidance.

This file is intended to supply the human-readable rundown in future successful-deployment emails.
