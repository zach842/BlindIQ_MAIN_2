# BlindIQ v1.65.2 — hunting-first landing page

Replaces the duck-photo/marketing-led welcome with a responsive, multi-species introduction to the actual product: pick a state and category, count Saw and Harvested, and save a hunt. The selected IQ logo and forest/cream/gold palette remain. Login is available in the header and below the trial action; signup pricing is preserved.

A clearly labeled illustrative Maryland deer session explains the logging layout without creating a hunt, adding saved data or collecting location. The example is static and is not a working logger. Three short steps explain the workflow. Maps and forecast pilot capabilities appear as supporting context with parcel/model availability explicit. Logged-in hub behavior, routes, membership, regulation data and calculations are unchanged by this landing-page change.

Includes all v1.65.1 mobile input sizing/password visibility and confirmed hunt-deletion work, plus v1.65.0 MapLibre/USGS maps, browser-local hunting pins and deer/turkey weather/research pilots. Cloud deletion still requires the included one-time HUNT_DELETE_SETUP.sql update; no hosted SQL or deployment was performed.

Validation: production TypeScript/Vite build and compiled release checks passed. Landing tested in Chrome at 320/375/390/768/1024/1440 widths without horizontal overflow. Header login, returning-user login and trial/signup routes passed. Example controls are noninteractive and no hunt data is created. Login and delete regression browser test passed. 51 automated regulation/species/weather/database/forecast tests passed. Physical iPhone Safari remains untested, as documented in the prior release.

Screenshots in preview/landing-desktop.png and preview/landing-mobile.png show the production build. Local interactive preview is available through pnpm run preview after building. Previous feature screenshots remain historical evidence.
