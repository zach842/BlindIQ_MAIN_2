import type { BirdRule } from "./types";

// Verified 2026–27 date-dependent bag caps. See docs/REGULATION_VERIFICATION_2026-2027.md.
export const bagLimitPeriods: Record<string, Record<string, NonNullable<BirdRule["limitPeriods"]>>> = {
  "MD": {
    "scaup": [
      {"startDate": "2027-01-08", "endDate": "2027-01-30", "limit": 2},
    ],
    "canada-goose": [
      {"startDate": "2026-11-21", "endDate": "2026-11-23", "limit": 5, "zone": "Late Southern Resident Goose Zone"},
      {"startDate": "2027-02-01", "endDate": "2027-03-10", "limit": 5, "zone": "Late Southern Resident Goose Zone"},
      {"startDate": "2026-09-01", "endDate": "2026-09-30", "limit": 0},
    ],
    "early-canada-goose": [
      {"startDate": "2026-09-01", "endDate": "2026-09-15", "limit": 8},
      {"startDate": "2026-09-16", "endDate": "2026-09-25", "limit": 8, "zone": "Early Goose Western Zone"},
    ],
  },
  "DE": {
    "scaup": [
      {"startDate": "2027-01-12", "endDate": "2027-01-31", "limit": 2},
    ],
    "early-canada-goose": [
      {"startDate": "2026-09-01", "endDate": "2026-09-25", "limit": 15},
    ],
    "canada-goose": [
      {"startDate": "2026-09-01", "endDate": "2026-09-30", "limit": 0},
    ],
  },
  "VA": {
    "scaup": [
      {"startDate": "2027-01-12", "endDate": "2027-01-31", "limit": 2},
    ],
    "black-duck": [
      {"startDate": "2026-10-09", "endDate": "2026-10-12", "limit": 0},
    ],
  },
  "NC": {
    "scaup": [
      {"startDate": "2027-01-08", "endDate": "2027-01-30", "limit": 2},
    ],
  },
  "WV": {
    "scaup": [
      {"startDate": "2027-01-12", "endDate": "2027-01-31", "limit": 2},
      {"startDate": "2026-09-19", "endDate": "2026-09-19", "limit": 2},
      {"startDate": "2026-10-31", "endDate": "2026-10-31", "limit": 2},
    ],
  },
  "PA": {
    "scaup": [
      {"startDate": "2026-12-18", "endDate": "2027-01-09", "limit": 2, "zone": "North Duck Zone"},
      {"startDate": "2026-12-26", "endDate": "2027-01-18", "limit": 2, "zone": "South Duck Zone"},
      {"startDate": "2026-11-26", "endDate": "2026-11-27", "limit": 2, "zone": "Northwest Duck Zone"},
      {"startDate": "2026-12-21", "endDate": "2027-01-09", "limit": 2, "zone": "Northwest Duck Zone"},
      {"startDate": "2026-11-25", "endDate": "2026-12-17", "limit": 2, "zone": "Lake Erie Duck Zone"},
    ],
  },
  "NY": {
    "scaup": [
      {"startDate": "2026-12-22", "endDate": "2027-01-10", "limit": 2, "zone": "Western Waterfowl Zone"},
      {"startDate": "2026-11-19", "endDate": "2026-11-29", "limit": 2, "zone": "Northeast Waterfowl Zone"},
      {"startDate": "2026-12-12", "endDate": "2026-12-20", "limit": 2, "zone": "Northeast Waterfowl Zone"},
      {"startDate": "2026-12-08", "endDate": "2026-12-27", "limit": 2, "zone": "Lake Champlain Waterfowl Zone"},
      {"startDate": "2026-12-08", "endDate": "2026-12-27", "limit": 2, "zone": "Southeast Waterfowl Zone"},
      {"startDate": "2027-01-12", "endDate": "2027-01-31", "limit": 2, "zone": "Long Island Waterfowl Zone"},
    ],
  },
  "SC": {
    "scaup": [
      {"startDate": "2026-11-14", "endDate": "2026-11-14", "limit": 2},
      {"startDate": "2026-11-21", "endDate": "2026-11-28", "limit": 2},
      {"startDate": "2026-12-12", "endDate": "2026-12-22", "limit": 2},
      {"startDate": "2027-02-06", "endDate": "2027-02-06", "limit": 2},
      {"startDate": "2027-02-13", "endDate": "2027-02-13", "limit": 2},
    ],
    "early-canada-goose": [
      {"startDate": "2026-09-01", "endDate": "2026-09-30", "limit": 15},
    ],
    "canada-goose": [
      {"startDate": "2026-09-01", "endDate": "2026-09-30", "limit": 0},
    ],
  },
  "WI": {
    "scaup": [
      {"startDate": "2026-09-26", "endDate": "2026-11-09", "limit": 2, "zone": "Northern Duck Zone"},
      {"startDate": "2026-10-23", "endDate": "2026-12-06", "limit": 2, "zone": "Southern Duck Zone"},
      {"startDate": "2026-10-17", "endDate": "2026-11-30", "limit": 2, "zone": "Open Water Duck Zone"},
    ],
    "canada-goose": [
      {"startDate": "2026-09-01", "endDate": "2026-09-15", "limit": 5},
      {"startDate": "2026-12-19", "endDate": "2027-01-02", "limit": 5, "zone": "Southern Goose Zone"},
    ],
  },
  "MN": {
    "scaup": [
      {"startDate": "2026-10-11", "endDate": "2026-11-24", "limit": 2, "zone": "North Waterfowl Zone"},
      {"startDate": "2026-10-16", "endDate": "2026-11-29", "limit": 2, "zone": "Central Waterfowl Zone"},
      {"startDate": "2026-10-23", "endDate": "2026-12-06", "limit": 2, "zone": "South Waterfowl Zone"},
    ],
  },
  "IA": {
    "scaup": [
      {"startDate": "2026-10-25", "endDate": "2026-12-08", "limit": 2, "zone": "North Zone"},
      {"startDate": "2026-11-01", "endDate": "2026-12-15", "limit": 2, "zone": "Central Zone"},
      {"startDate": "2026-11-08", "endDate": "2026-12-22", "limit": 2, "zone": "South Zone"},
    ],
    "canada-goose": [
      {"startDate": "2026-09-26", "endDate": "2026-10-11", "limit": 2, "zone": "North Zone"},
      {"startDate": "2026-10-03", "endDate": "2026-10-18", "limit": 2, "zone": "Central Zone"},
      {"startDate": "2026-10-10", "endDate": "2026-10-25", "limit": 2, "zone": "South Zone"},
    ],
  },
  "MI": {
    "scaup": [
      {"startDate": "2026-09-26", "endDate": "2026-11-09", "limit": 2, "zone": "North Zone"},
      {"startDate": "2026-10-19", "endDate": "2026-11-29", "limit": 2, "zone": "Middle Zone"},
      {"startDate": "2026-12-12", "endDate": "2026-12-13", "limit": 2, "zone": "Middle Zone"},
      {"startDate": "2026-11-02", "endDate": "2026-12-13", "limit": 2, "zone": "South Zone"},
      {"startDate": "2026-12-26", "endDate": "2026-12-27", "limit": 2, "zone": "South Zone"},
    ],
  },
  "MO": {
    "scaup": [
      {"startDate": "2026-10-31", "endDate": "2026-12-14", "limit": 2, "zone": "North Zone"},
      {"startDate": "2026-11-07", "endDate": "2026-12-13", "limit": 2, "zone": "Middle Zone"},
      {"startDate": "2026-12-19", "endDate": "2026-12-26", "limit": 2, "zone": "Middle Zone"},
      {"startDate": "2026-11-26", "endDate": "2026-11-29", "limit": 2, "zone": "South Zone"},
      {"startDate": "2026-12-07", "endDate": "2027-01-16", "limit": 2, "zone": "South Zone"},
    ],
  },
  "NJ": {
    "scaup": [
      {"startDate": "2026-12-23", "endDate": "2027-01-14", "limit": 2, "zone": "North Zone"},
      {"startDate": "2026-12-30", "endDate": "2027-01-21", "limit": 2, "zone": "South Zone"},
      {"startDate": "2027-01-07", "endDate": "2027-01-29", "limit": 2, "zone": "Coastal Zone"},
      {"startDate": "2026-10-03", "endDate": "2026-10-03", "limit": 2},
      {"startDate": "2026-10-10", "endDate": "2026-10-10", "limit": 2},
      {"startDate": "2026-10-31", "endDate": "2026-10-31", "limit": 2},
      {"startDate": "2026-11-14", "endDate": "2026-11-14", "limit": 2},
      {"startDate": "2027-02-06", "endDate": "2027-02-06", "limit": 2},
    ],
  },
  "OH": {
    "scaup": [
      {"startDate": "2026-11-01", "endDate": "2026-11-01", "limit": 2, "zone": "Duck Zone A"},
      {"startDate": "2026-11-14", "endDate": "2026-12-27", "limit": 2, "zone": "Duck Zone A"},
      {"startDate": "2026-11-27", "endDate": "2027-01-10", "limit": 2, "zone": "Duck Zone B"},
      {"startDate": "2026-12-18", "endDate": "2027-01-31", "limit": 2, "zone": "Duck Zone C"},
    ],
  },
  "CA": {
    "scaup": [
      {"startDate": "2026-10-03", "endDate": "2026-11-29", "limit": 2, "zone": "Northeastern Zone"},
      {"startDate": "2026-12-17", "endDate": "2027-01-13", "limit": 2, "zone": "Northeastern Zone"},
      {"startDate": "2026-11-07", "endDate": "2027-01-31", "limit": 2, "zone": "Southern San Joaquin Valley Zone"},
      {"startDate": "2026-11-07", "endDate": "2027-01-31", "limit": 2, "zone": "Southern California Zone"},
      {"startDate": "2026-11-07", "endDate": "2027-01-31", "limit": 2, "zone": "Colorado River Zone"},
      {"startDate": "2026-11-07", "endDate": "2027-01-31", "limit": 2, "zone": "Balance of State Zone"},
    ],
  },
  "ID": {
    "scaup": [
      {"startDate": "2026-11-07", "endDate": "2027-01-31", "limit": 2, "zone": "Duck Area 1"},
      {"startDate": "2026-10-03", "endDate": "2026-12-27", "limit": 2, "zone": "Duck Area 2"},
      {"startDate": "2026-10-29", "endDate": "2027-01-22", "limit": 2, "zone": "Duck Area 3"},
      {"startDate": "2026-09-26", "endDate": "2026-09-26", "limit": 2},
      {"startDate": "2026-09-27", "endDate": "2026-09-27", "limit": 2},
    ],
  },
  "OR": {
    "scaup": [
      {"startDate": "2026-11-07", "endDate": "2027-01-31", "limit": 2, "zone": "Duck Zone 1"},
      {"startDate": "2026-10-10", "endDate": "2026-11-29", "limit": 2, "zone": "Duck Zone 2"},
      {"startDate": "2026-12-03", "endDate": "2027-01-06", "limit": 2, "zone": "Duck Zone 2"},
      {"startDate": "2026-09-26", "endDate": "2026-09-26", "limit": 2},
      {"startDate": "2026-09-27", "endDate": "2026-09-27", "limit": 2},
      {"startDate": "2027-02-06", "endDate": "2027-02-06", "limit": 2},
    ],
  },
  "WA": {
    "scaup": [
      {"startDate": "2026-11-07", "endDate": "2027-01-31", "limit": 2},
      {"startDate": "2026-09-26", "endDate": "2026-09-26", "limit": 2},
      {"startDate": "2026-10-03", "endDate": "2026-10-03", "limit": 2},
      {"startDate": "2027-02-06", "endDate": "2027-02-06", "limit": 2},
    ],
  },
  "MT": {
    "scaup": [
      {"startDate": "2026-10-03", "endDate": "2026-12-27", "limit": 2, "zone": "Pacific Flyway"},
      {"startDate": "2026-08-01", "endDate": "2027-05-31", "limit": 1, "zone": "Central Flyway — Zone 1"},
      {"startDate": "2026-08-01", "endDate": "2027-05-31", "limit": 1, "zone": "Central Flyway — Zone 2"},
    ],
    "bonus-bluewing-teal": [
      {"startDate": "2026-10-03", "endDate": "2026-10-11", "limit": 2, "zone": "Central Flyway — Zone 1"},
      {"startDate": "2026-10-03", "endDate": "2026-10-11", "limit": 2, "zone": "Central Flyway — Zone 2"},
    ],
  },
  "FL": {
    "scaup": [
      {"startDate": "2027-01-12", "endDate": "2027-01-31", "limit": 2},
      {"startDate": "2026-11-14", "endDate": "2026-11-14", "limit": 2},
      {"startDate": "2027-02-06", "endDate": "2027-02-07", "limit": 2},
      {"startDate": "2027-02-13", "endDate": "2027-02-13", "limit": 2},
    ],
    "wood-duck": [
      {"startDate": "2026-09-19", "endDate": "2026-09-23", "limit": 2},
    ],
  },
  "SD": {
    "bonus-bluewing-teal": [
      {"startDate": "2026-09-26", "endDate": "2026-10-04", "limit": 2, "zone": "Low Plains North Duck Zone"},
      {"startDate": "2026-09-26", "endDate": "2026-10-04", "limit": 2, "zone": "Low Plains Middle Duck Zone"},
      {"startDate": "2026-10-24", "endDate": "2026-11-01", "limit": 2, "zone": "Low Plains South Duck Zone"},
      {"startDate": "2026-10-10", "endDate": "2026-10-18", "limit": 2, "zone": "High Plains Duck Zone"},
    ],
  },
  "ND": {
    "bonus-bluewing-teal": [
      {"startDate": "2026-09-26", "endDate": "2026-10-04", "limit": 2},
    ],
    "canada-goose": [
      {"startDate": "2026-08-15", "endDate": "2026-09-07", "limit": 15, "zone": "Missouri River Canada Goose Zone"},
      {"startDate": "2026-08-15", "endDate": "2026-09-15", "limit": 15, "zone": "Western Canada Goose Zone"},
      {"startDate": "2026-08-15", "endDate": "2026-09-22", "limit": 15, "zone": "Eastern Canada Goose Zone"},
    ],
  },
  "TX": {
    "dusky-duck": [
      {"startDate": "2026-10-24", "endDate": "2026-10-28", "limit": 0, "zone": "High Plains Mallard Management Unit"},
      {"startDate": "2026-11-14", "endDate": "2026-11-18", "limit": 0, "zone": "North Duck Zone"},
      {"startDate": "2026-11-07", "endDate": "2026-11-11", "limit": 0, "zone": "South Duck Zone"},
    ],
  },
  "LA": {
    "scaup": [
      {"startDate": "2026-12-06", "endDate": "2026-12-06", "limit": 2, "zone": "East Waterfowl Zone"},
      {"startDate": "2026-12-19", "endDate": "2027-01-31", "limit": 2, "zone": "East Waterfowl Zone"},
      {"startDate": "2027-02-06", "endDate": "2027-02-06", "limit": 2, "zone": "East Waterfowl Zone"},
      {"startDate": "2026-11-29", "endDate": "2026-12-06", "limit": 2, "zone": "West Waterfowl Zone"},
      {"startDate": "2026-12-19", "endDate": "2027-01-24", "limit": 2, "zone": "West Waterfowl Zone"},
      {"startDate": "2027-01-30", "endDate": "2027-01-30", "limit": 2, "zone": "West Waterfowl Zone"},
    ],
    "mottled-duck": [
      {"startDate": "2026-11-14", "endDate": "2026-12-05", "limit": 0, "zone": "East Waterfowl Zone"},
      {"startDate": "2026-11-07", "endDate": "2026-11-28", "limit": 0, "zone": "West Waterfowl Zone"},
    ],
    "black-bellied-whistling": [
      {"startDate": "2026-10-03", "endDate": "2026-10-11", "limit": 4},
    ],
  },
  "IL": {
    "scaup": [
      {"startDate": "2026-11-15", "endDate": "2026-12-13", "limit": 2, "zone": "Central Waterfowl Zone"},
      {"startDate": "2026-12-19", "endDate": "2027-01-03", "limit": 2, "zone": "Central Waterfowl Zone"},
      {"startDate": "2026-11-13", "endDate": "2026-12-27", "limit": 2, "zone": "North Waterfowl Zone"},
      {"startDate": "2026-11-29", "endDate": "2026-12-06", "limit": 2, "zone": "South Waterfowl Zone"},
      {"startDate": "2026-12-19", "endDate": "2027-01-24", "limit": 2, "zone": "South Waterfowl Zone"},
    ],
    "canada-goose": [
      {"startDate": "2026-09-01", "endDate": "2026-09-15", "limit": 5, "zone": "North Waterfowl Zone"},
      {"startDate": "2026-09-01", "endDate": "2026-09-15", "limit": 5, "zone": "Central Waterfowl Zone"},
      {"startDate": "2026-09-01", "endDate": "2026-09-15", "limit": 2, "zone": "South Waterfowl Zone"},
    ],
  },
  "KS": {
    "early-teal": [
      {"startDate": "2026-09-19", "endDate": "2026-09-27", "limit": 6, "zone": "High Plains Unit"},
      {"startDate": "2026-09-12", "endDate": "2026-09-20", "limit": 6, "zone": "Low Plains Early Zone"},
      {"startDate": "2026-09-12", "endDate": "2026-09-20", "limit": 6, "zone": "Low Plains Late Zone"},
      {"startDate": "2026-09-12", "endDate": "2026-09-20", "limit": 6, "zone": "Low Plains Southeast Zone"},
    ],
  },
  "NE": {
    "early-teal": [
      {"startDate": "2026-09-05", "endDate": "2026-09-13", "limit": 6},
    ],
  },
  "AR": {
    "canada-goose": [
      {"startDate": "2026-09-01", "endDate": "2026-10-15", "limit": 5},
    ],
  },
};
