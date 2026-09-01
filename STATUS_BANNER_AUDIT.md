# BlindIQ v1.56 Status Banner Audit

Audit date: September 1, 2026

## What was tested

- All 29 loaded state records resolve to one of four supported dashboard states: `open`, `partial`, `closed`, or `reference`.
- All 27 states with machine-readable calendars were evaluated for every day from August 1, 2026 through May 31, 2027.
- Every loaded season start date and end date was tested as inclusive.
- Every period was checked for a valid date order, waterfowl category, name, and zone.
- The production TypeScript and Vite build completed successfully.

## September 1, 2026 expected results

- **Open Today:** Michigan, Wisconsin
- **Partially Open:** Arkansas, Idaho, Illinois, Maryland, North Carolina, North Dakota, South Carolina, South Dakota, Virginia
- **Closed Today:** California, Florida, Iowa, Kansas, Louisiana, Minnesota, Missouri, Montana, Nebraska, New Jersey, Ohio, Oregon, Pennsylvania, Texas, Washington
- **Status Check Required:** Delaware, New York
- **Current Data Pending:** West Virginia

`Open Today` means both a loaded duck-category period and goose-category period are active somewhere in the state. `Partially Open` means at least one loaded waterfowl category is active, but not both. These are statewide summaries; hunters must still verify their zone, residency, eligibility, permit, shooting-hour, and property-specific requirements.

## Maryland correction

The dashboard now recognizes Maryland's Eastern Zone early resident Canada goose season from September 1–15, 2026 and Western Zone season from September 1–25, 2026. Therefore Maryland correctly shows **Partially Open** on September 1, 2026.

Official reference: https://www.eregulations.com/maryland/hunting/migratory-game-bird-seasons-limits

## Safe handling of incomplete data

Delaware and New York do not have enough complete final zone periods in the current BlindIQ package to safely declare every waterfowl season closed on dates with no active loaded period. They show **Status Check Required** instead. West Virginia remains an archived reference package and shows **Current Data Pending**.
