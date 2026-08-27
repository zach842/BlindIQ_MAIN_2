# BlindIQ Deployment Notes

## v1.52 — Pacific Flyway + Nationwide Flyway Coverage

This release completes the four-flyway Migration Pulse interface by adding Alaska & North Pacific, Pacific Northwest, and Pacific Southwest planning regions. It identifies divided western states with an asterisk, adds automatic Pacific selection for the eight complete Pacific member states, expands member alert preferences, advances offline caching, and updates the scheduled function from nine to twelve regions. The cumulative `202608270003_add_pacific_flyway.sql` update can take an existing two-flyway or three-flyway database directly to all four.

## v1.51 — Central Flyway Migration Pulse

This release adds the official Central Flyway as the third complete Migration Pulse report. It includes Northern Central, Central Plains, and Southern Central planning regions; automatic state-aware selection; live and preview `##/100` scores; offline caching; Central Flyway notification preferences; and nine-region scheduled refresh coverage. Existing projects must run `supabase/migrations/202608270002_add_central_flyway.sql` once and redeploy the updated `migration-refresh` Edge Function before the Central report can show live data.

## v1.50 — Field Alerts + Notification Center

This release adds opt-in website-app push notifications and a private in-app Notification Center. Members can choose season, regulation, Migration Pulse, unfinished-hunt, trial, and saved-hunt alerts; follow states and the Atlantic/Mississippi Flyways; and select a `45/100`, `65/100`, or `80/100` migration threshold. The server-side scheduler deduplicates events, checks every 15 minutes, and disables expired device endpoints. Complete `PUSH_NOTIFICATIONS_SETUP.md` before expecting real push delivery.

## v1.44 — Restored Closed Logo Border

This release restores the complete lower gold border around the BlindIQ **Hunt. Log. Share** badge everywhere the primary logo is displayed, including the device-check screen, authentication experience, app header, and generated hunt-sharing visuals. It retains the remembered-device reliability improvements and all Migration Pulse functionality from v1.43.

## v1.43 — Hunt. Log. Share + Remembered-Device Reliability

- Replaced the main welcome message with **Hunt. Log. Share**.
- Added a matching transparent BlindIQ logo asset with **HUNT. LOG. SHARE** in place of the previous tagline.
- Updated generated hunt-share cards to use the new logo and brand line.
- Made Supabase browser-session persistence, token refresh, and confirmation-link handling explicit.
- Preserved the 30-day device choice during temporary network or Supabase verification failures instead of treating them as a logout.
- Preserved the remember-device choice when signup requires email confirmation.
- Restored the signed-in user before refreshing subscription and default-state details, preventing a nonessential refresh failure from returning the app to the welcome screen.
- Clarified that remembered access applies separately to the current browser or installed Home Screen app.

## v1.42 — Migration Pulse Score Clarity

- Changed the flyway-wide Migration Pulse score to an explicit **##/100** display.
- Retained the Atlantic and Mississippi Flyway early-access interface, Group Hunt Mode preview, and all v1.41 functionality.

## v1.41 — Atlantic + Mississippi Migration Pulse

- Added a dedicated **Migration** destination to the member navigation and a prominent dashboard entry point.
- Added Atlantic and Mississippi Flyway tabs with North, Mid, and South planning regions for each flyway.
- Added flyway pulse, current weather-condition signal, 48-hour movement potential, trend, direction, confidence, source transparency, and explanatory drivers.
- Added explicit live, offline-cache, and preview modes so a missing backend feed never creates a broken or misleading screen.
- Added Supabase tables for regions, snapshots, private normalized observations, and server-only source-run health records with Row Level Security.
- Added a server-only Supabase Edge Function that retrieves National Weather Service forecasts and calculates a transparent weather-and-season movement-potential score.
- Added a four-times-daily Supabase Cron script and complete one-time setup guide; after setup, migration data updates do not require GitHub commits or Vercel deployments.
- Kept observation and radar partner feeds out of this release until commercial-use permission and attribution are approved.
- Advanced package, visible release markers, hunt metadata, service-worker registration, and offline cache to **v1.41**.

## v1.40 — Group Hunt preview

- Restored **Group Hunt Mode — In Development** directly below Test Hunt on the dashboard.
- Kept the preview intentionally non-interactive so hunters do not mistake it for a finished hunt mode.
- Advanced package, visible release markers, hunt metadata, service-worker registration, and offline cache to **v1.40**.

## v1.39 — Private harvest photos

- Added an optional **Add a harvest photo** card to the live-hunt Save Hunt screen.
- Added direct phone-camera capture and photo-library selection using the device’s native picker.
- Added an on-screen preview plus replace and remove controls before the hunt is saved.
- Added browser-side resizing and JPEG compression before upload, with clear 20 MB source and 5 MB stored-image limits.
- Added a private Supabase Storage bucket, account-folder access policies, and an owner-prefixed hunt-table constraint.
- Added secure one-hour signed photo links and harvest thumbnails in My Hunts; selecting a thumbnail opens the saved image.
- Preserved offline hunt saving for hunts without photos. Photo-backed hunts clearly request a connection rather than silently dropping the image.
- Added the required `20260823235658_hunt_photos.sql` deployment migration and advanced visible release markers, hunt metadata, package version, and offline cache to **v1.39**.

## v1.38 — South Dakota 2026–2027 waterfowl package

- Added South Dakota as BlindIQ’s twenty-ninth selectable state with final 2026–2027 agency dates and limits.
- Added all four duck zones, both regular Canada goose units, the resident-only August Management Take, Early Fall Canada Goose, youth waterfowl, white-fronted goose, fall light goose, 2027 Spring Conservation Order, tundra swan and Wilson’s snipe.
- Added date-aware South Dakota status periods; during August 15–31 the dashboard correctly shows **PARTIALLY OPEN** for the resident-only August Canada Goose Management Take.
- Added the Traditional six-duck bag with mallard, hen, wood duck, pintail, redhead, canvasback and scaup restrictions plus the first-nine-days bonus blue-winged teal rule.
- Added a prominent warning that the live species logger models only the Traditional option; hunters selecting South Dakota’s season-long Three-Duck option must use its three-any-duck limit instead.
- Added finalized 2026 goose limits: eight during the August Management Take and Early Fall season, eight in regular Unit 1, four in Unit 2, three white-fronted geese and fifty fall light geese.
- Added nonresident unit/duration guidance, permit and stamp notes, youth rules, nontoxic-shot requirements and official GFP source links.
- Advanced visible release markers, hunt metadata, package version, and offline cache to **v1.38**.

## v1.37 — Self-service membership and trial cancellation

- Added **Manage or cancel free trial** and **Manage or cancel membership** controls to the Account page.
- Added an authenticated Supabase Edge Function that creates short-lived Stripe Customer Portal sessions for the signed-in member only.
- Kept the Stripe secret key and service-role key entirely server-side; the browser supplies only the member's authenticated Supabase session.
- Documented Stripe Customer Portal activation, cancellation settings, the required `BLINDIQ_APP_URL` secret, and deployment steps.
- Confirmed the existing Stripe webhook handles subscription updates and cancellations made through the portal.
- Advanced visible release markers, hunt metadata, package version, and offline cache to **v1.37**.

## v1.36 — Seven-day launch trial

- Extended the new-member free trial from three days to **seven days**.
- Updated the welcome, login, signup, Account membership, Stripe setup, deployment documentation, visible release markers, hunt metadata, and offline cache version.
- Retained the automatic post-login Home Screen installation prompt and offline field mode introduced in v1.35.

## v1.35 — Three-day trial, guided installation, and offline field mode

- Added prominent **3 DAYS FREE** messaging to the welcome, login, signup, and Account membership screens, with the $10.99 yearly price clearly stated.
- Added automatic post-login **Add BlindIQ to Your Home Screen** guidance for active and trialing members who have not installed the website app.
- Expanded the installation guide with one-tap, offline, and automatic-sync benefits plus iPhone and Android instructions.
- Added a visible connectivity banner whenever the device is offline.
- Rebuilt the service worker to cache the production app shell, interface assets, loaded regulation data, and the complete waterfowl reference-image library.
- Added offline account, membership, default-state, and hunt-history snapshots for field access after the first connected load.
- Added an offline hunt queue: hunts saved without service stay visible on the device and sync to Supabase automatically after reconnection.
- Added **OFFLINE** labels to unsynced history entries and precise field-mode limitations in the UI and README.
- Advanced the visible release marker, package version, checkout metadata, and PWA cache to **v1.35**.

## v1.34 — Clear installation action and focused hunt modes

- Removed the **Group Hunt Mode — In Development** placeholder from the dashboard.
- Replaced the ambiguous **+ HOME** control with an explicit **ADD TO HOME SCREEN** action.
- Kept the complete iPhone and Android installation guide behind the newly labeled action.
- Advanced the visible release marker, package version, and PWA cache to **v1.34**.

## v1.33 — Digital field guide and field log brand alignment

- Defined BlindIQ consistently as the **digital field guide and field log for waterfowl hunters**.
- Rebuilt welcome, login, and signup copy around the product promise: **Know the regulations. Log the birds. Save the hunts.**
- Added a compact three-part product explainer to the welcome and authentication screens.
- Updated dashboard, season overview, bird-identification guide, active hunt logger, live guidance, hunt summary, history, account membership copy, metadata, sharing language, and legal disclaimer where the new positioning improves clarity.
- Updated the visible release marker, package version, and PWA cache to **v1.33**.

## v1.31 — North Dakota live season status and focused dashboard

- Replaced the hard-coded closed banner with date-aware **Open Today**, **Partially Open**, **Closed Today**, and reference states.
- Added structured North Dakota status periods for early Canada goose, special youth/veteran/military waterfowl, regular ducks, and regular geese.
- On August 16, North Dakota now displays **PARTIALLY OPEN** and identifies Early Canada Goose as the active season in three loaded zones.
- Added reminders to verify residency, zone, license, and eligibility requirements whenever a season is active.
- Removed the weather widget and forecast controls from the dashboard for now.
- Advanced the visible release marker and service-worker cache to v1.31.

## v1.30 — Prominent any-device messaging

- Added a visible **Use BlindIQ on any internet-connected device** badge to the main welcome screen.
- Added a dedicated callout on the login form explaining that members can sign in from a phone, tablet, or computer.
- Advanced the visible release marker and service-worker cache to v1.30.

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
