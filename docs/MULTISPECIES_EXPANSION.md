# Multi-species restoration investigation

Reviewed November 11, 2026. Proposal and source inventory; not an implemented regulation expansion. The v1.61.1 ZIP remains unchanged.

## Existing foundation

`src/gameCatalog.ts` already defines nine hunt categories: waterfowl, deer, turkey, other migratory birds, upland birds, other big game, small game, predators/furbearers, and other game. Whitetail, Sitka black-tailed deer, elk and three squirrel choices are present. Sika deer is absent. Non-waterfowl entries are explicitly field-log mode and use a placeholder limit of 999. That number must never be displayed as a legal limit or used for regulation guidance.

The current App does not import the catalog. Its selected state birds, counters, saved hunt category, sharing labels, and dashboard statistics are waterfowl-specific. Category types and category-aware persistence code exist; production database compatibility still requires verification before rollout. Existing records without a category default to waterfowl and must keep that behavior.

The current 29-state dataset excludes Alaska and Colorado. Sitka deer in Alaska and a Colorado elk pilot would require separate jurisdiction records; they cannot inherit a waterfowl state's zones or dates.

## Proposed delivery order

1. Restore category selection and species logging with explicit “Field log — regulations not loaded” status wherever rules have not been verified. Keep waterfowl calculations and Migration Pulse scoped to waterfowl. Save category on entries and hunts, make history filters category-aware, and update sharing labels and totals without changing existing record IDs.
2. Add a verified pilot: South Carolina whitetail and squirrel/rabbit, Maryland whitetail and sika, and Idaho elk. These states already exist in the app. Verify each exact species, method, zone, land type and season before enabling calculation guidance. Species availability must be jurisdiction-specific.
3. Add Alaska Sitka black-tailed deer with game management unit selection and applicable state/federal subsistence distinctions. Expand elk by state and hunt unit. Colorado is a useful additional pilot but is outside the current state list.
4. Extend the same framework to turkey, upland birds and other migratory game birds. Predators/furbearers need separate hunting/trapping coverage and should follow later.

## Initial official source inventory

These links establish research paths, not completed audits or extracted limits. Always follow the agency's current-season link, amendments and emergency orders; do not trust a PDF filename or search snippet alone.

| Coverage | Primary source | Why it matters |
| --- | --- | --- |
| SC deer | [SCDNR deer hub](https://www.dnr.sc.gov/wildlife/deer/) | Links current 2026–2027 guide; start with zones, sex, tags and land-specific rules. |
| SC small game | [Official published seasons](https://www.eregulations.com/southcarolina/hunting/small-game-seasons) | Squirrel and rabbit rules; verify species exceptions and WMA differences. |
| MD whitetail and sika | [Maryland DNR deer hub](https://dnr.maryland.gov/wildlife/pages/hunt_trap/deer-hunting-in-maryland.aspx) | Agency links seasons, bag limits, Sunday calendars, tags and check-in. |
| MD sika identification | [Maryland DNR sika deer](https://dnr.maryland.gov/wildlife/pages/hunt_trap/sikadeer_about.aspx) | Distinguishes the Maryland species from Sitka black-tailed deer. |
| AK Sitka black-tailed deer | [ADF&G hunt opportunities](https://www.adfg.alaska.gov/index.cfm?adfg=deerhunting.opportunities), [current regulations hub](https://www.adfg.alaska.gov/index.cfm?adfg=wildliferegulations.hunting) | Agency identifies GMUs 1–6 and 8; tickets, dates and bags vary within and between units. |
| ID elk | [Idaho Fish and Game big-game rules](https://idfg.idaho.gov/rules/big-game) | State's 2026 rules and hunt-specific tables. |
| CO elk | [CPW elk hub](https://cpw.state.co.us/activities/hunting/big-game/hunting-elk), [2026 brochure](https://cpw.state.co.us/sites/default/files/dam/erjzbk48be/colorado-big-game-hunting-brochure.pdf) | Unit, hunt code, sex, method and license conditions require structured coverage. |
| Federal refuge overlay | [USFWS General Hunting Laws](https://www.fws.gov/law/general-hunting-laws) | Refuge-specific rules can add restrictions; a state rule alone is insufficient for a refuge hunt. |

## Regulation model required

Keep a species catalog independent from rules. Each rule record needs jurisdiction, species, season year, effective date ranges, unit/county, hunting method, sex/antler definition, land/area scope, eligibility and permit conditions, source URL, document page/section, checked date and verification status. Separate daily, possession, seasonal, tag and combined-species constraints. An unknown constraint is unknown, not unlimited. Official federal/refuge/park or subsistence overlays need their own applicability and source records.

Big-game guidance needs a season harvest ledger across hunts and user-declared tag/permit information. Earlier harvest and harvest outside BlindIQ must be accounted for. A counter for the current hunt cannot substantiate a remaining seasonal entitlement. Logging should remain possible when coverage is incomplete, with calculation status visible.

## Acceptance checks before release

- Old waterfowl hunts, accounts, photos, offline queue and sharing continue working; existing 19 regulation tests pass.
- Missing categories on legacy records still resolve to waterfowl.
- Non-waterfowl entries never affect duck/goose limits or migration forecasts.
- Unknown/unverified rules never produce unlimited or affirmative remaining-harvest guidance.
- Same species in different states, methods, units and land types resolves independently.
- Seasonal/tag constraints aggregate previous hunts, including declared outside harvest; editing/deleting and queued sync do not double count.
- Closed dates, sex restrictions, shared quotas, missing permits and stale-source states have explicit test fixtures.
- Browser checks cover each restored category through save, reload, filter and share on mobile and desktop.

No application behavior or regulation limits changed during this investigation. This document is the implementation starting point for a staged multi-species release.
