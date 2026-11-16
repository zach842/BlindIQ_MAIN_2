# BlindIQ v1.64.1 — category selector and complete species lists

November 16, 2026. Changes follow the supplied phone recording, where a long individual-species dropdown made logging cumbersome.

## Behavior

The short Hunting category menu has nine categories: Waterfowl, Deer, Wild Turkey, Dove & Migratory Birds, Upland Game Birds, Other Big Game, Small Game, Predators & Furbearers, and Other Legal Game. Selecting a category shows its rows together with independent Saw and Harvested counters. There is no second individual-species selection step. The duplicate session-species disclosure is removed because the list itself shows the counts. State and category lock once logging begins; Save/New session or Discard preserve the existing protections against moving counts to another category or jurisdiction.

Waterfowl uses the full existing state-specific bird list and existing calculations. Deer uses a display catalog filtered by state. Examples: Maryland displays whitetail buck/doe, sika stag/hind and Other Legal Deer; Alaska displays Sitka buck/doe and Other Legal Deer; Hawaii includes axis and black-tailed deer. Axis buck/doe are added without changing any existing saved-entry identifiers. Other categories retain their existing complete field-log catalogs.

The deer display catalog is not a new 50-state legal/season audit or a guarantee every species is allowed at every location. Common huntable deer families are curated by state; use Other Legal Deer with identifying notes for uncommon/exotic lawful deer outside the named rows. Other categories do not receive new state-by-state species verification in this patch. Existing non-waterfowl field-log coverage notices and official links remain. No new bag or permit calculations are invented.

## Agency references for display catalog distinctions

- [Maryland DNR deer species background](https://dnr.maryland.gov/wildlife/Documents/WT_Deer_curriculum_Guide.pdf): native whitetail and introduced sika.
- [Alaska ADF&G Sitka hunting](https://www.adfg.alaska.gov/index.cfm?adfg=deerhunting.opportunities): Sitka black-tailed deer.
- [Hawaii DLNR game mammals](https://dlnr.hawaii.gov/recreation/hunting/mammal/): axis and black-tailed deer.
- [California DFW deer](https://wildlife.ca.gov/Conservation/Mammals/Deer): mule and black-tailed deer.
- [Arizona Game & Fish deer identification](https://www.azgfd.com/hunting/arizona-deer-identification/): mule/white-tailed distinctions.
- [New Mexico deer](https://wildlife.dgf.nm.gov/hunting/information-by-animal/big-game/deer/): mule, Coues and Texas white-tailed deer.
- [Texas TPWD exotics](https://tpwd.texas.gov/regulations/outdoor-annual/hunting/nongame-and-other-species): exotic deer context, with separate land/access requirements.

## Preserved and verified

The full v1.64.0 application, IQ branding, 29-state waterfowl audit, saved logs/photos/sharing, Maps/Movement panels, source registry and forecasting SQL/worker/tests remain included. No hosted database or GitHub deployment was changed.

45 Node tests pass (29 regulation/species/category tests and 16 forecasting tests), including new category-wide list and state-deer checks. TypeScript, production build and release verification pass. Chrome checks against production output cover the nine-option menu, multiple rows visible together, Maryland deer filtering, all category save flows, practice sessions, waterfowl limits, Maps/Movement panels and 320/390/768/1440 layouts. Service-worker upgrade/offline checks pass for the updated version. Existing large-bundle advisory remains. Real production billing/photo storage/native sharing are outside these local checks.

Use START_HERE.md to upload the complete extracted folder contents to the existing repository root. Forecast migrations and jobs remain separate setup steps; maps and deer/turkey activity predictions remain in development.
