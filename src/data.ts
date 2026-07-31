import type { StateData } from "./types";

const coreDucks = [
  { id: "mallard-drake", label: "Mallard — Drake", group: "Ducks" as const, limit: 4, sex: "Drake" as const, parent: "mallard", note: "Counts toward 4-mallard and 6-duck limits." },
  { id: "mallard-hen", label: "Mallard — Hen", group: "Ducks" as const, limit: 2, sex: "Hen" as const, parent: "mallard", note: "Maximum 2 hens; counts toward 4 mallards." },
  { id: "black-duck", label: "American Black Duck", group: "Ducks" as const, limit: 2 },
  { id: "wood-duck", label: "Wood Duck", group: "Ducks" as const, limit: 3 },
  { id: "pintail", label: "Northern Pintail", group: "Ducks" as const, limit: 1 },
  { id: "canvasback", label: "Canvasback", group: "Ducks" as const, limit: 2 },
  { id: "scaup", label: "Scaup", group: "Ducks" as const, limit: 1, note: "Date-dependent limits may apply." },
  { id: "teal", label: "Teal", group: "Ducks" as const, limit: 6 },
  { id: "other-duck", label: "Other legal duck", group: "Ducks" as const, limit: 6 },
  { id: "coot", label: "Coot", group: "Other" as const, limit: 15 },
];

const sources = {
  MD: "https://dnr.maryland.gov/wildlife/Pages/hunt_trap/waterfowl.aspx",
  DE: "https://dnrec.delaware.gov/fish-wildlife/hunting/",
  VA: "https://dwr.virginia.gov/hunting/regulations/migratory-gamebirds/",
  NC: "https://www.ncwildlife.gov/hunting/hunting-regulations",
};

export const states: StateData[] = [
  {
    code: "MD",
    name: "Maryland",
    verifiedLabel: "Demo season package • verify current DNR rules",
    officialUrl: sources.MD,
    shootingHours: "Generally ½ hour before sunrise to sunset; exceptions apply.",
    overview: "Eastern and Western duck zones, plus goose population zones and special sea-duck rules.",
    zones: ["Eastern Duck Zone", "Western Duck Zone", "Atlantic Population Goose Zone"],
    seasons: [
      { name: "Regular Duck", dates: "Oct 11–18 • Nov 15–28 • Dec 16–Jan 31", open: false, zone: "Eastern Duck Zone" },
      { name: "Sea Ducks", dates: "Nov 8–Jan 10", open: false, zone: "Special Sea Duck Area" },
      { name: "Canada Goose", dates: "Nov 22–28 • Dec 16–Jan 31", open: false, zone: "AP Goose Zone" },
      { name: "Snow Goose", dates: "Oct 1–Jan 31", open: false, zone: "Statewide" },
    ],
    birds: [...coreDucks, { id: "canada-goose", label: "Canada Goose", group: "Geese", limit: 2 }, { id: "snow-goose", label: "Snow / Ross’s Goose", group: "Geese", limit: 25 }, { id: "brant", label: "Brant", group: "Geese", limit: 1 }],
  },
  {
    code: "DE",
    name: "Delaware",
    verifiedLabel: "Demo season package • verify current DNREC rules",
    officialUrl: sources.DE,
    shootingHours: "Generally ½ hour before sunrise to sunset; exceptions apply.",
    overview: "Statewide duck dates with separate goose zones, special-area rules, and public-area permits.",
    zones: ["Statewide Duck Zone", "AP Canada Goose Zone", "Special Sea Duck Area"],
    seasons: [
      { name: "Regular Duck", dates: "Oct 24–Nov 1 • Nov 24–29 • Dec 12–Jan 31", open: false, zone: "Statewide" },
      { name: "Canada Goose", dates: "Nov 24–29 • Dec 12–Jan 31", open: false, zone: "AP Zone" },
      { name: "Snow Goose", dates: "Oct 1–Jan 31", open: false, zone: "Statewide" },
    ],
    birds: [...coreDucks, { id: "canada-goose", label: "Canada Goose", group: "Geese", limit: 2 }, { id: "snow-goose", label: "Snow / Ross’s Goose", group: "Geese", limit: 25 }],
  },
  {
    code: "VA",
    name: "Virginia",
    verifiedLabel: "Demo season package • verify current DWR rules",
    officialUrl: sources.VA,
    shootingHours: "Generally ½ hour before sunrise to sunset; exceptions apply.",
    overview: "Duck seasons are statewide; Canada goose rules vary among AP, resident, and special zones.",
    zones: ["Statewide Duck Zone", "Atlantic Population Zone", "Resident Population Zone"],
    seasons: [
      { name: "Regular Duck", dates: "Oct 10–13 • Nov 19–30 • Dec 19–Jan 31", open: false, zone: "Statewide" },
      { name: "Canada Goose", dates: "Nov 19–30 • Dec 19–Jan 31", open: false, zone: "Varies by goose zone" },
      { name: "Light Goose", dates: "Oct 17–Jan 31", open: false, zone: "Statewide" },
    ],
    birds: [...coreDucks, { id: "canada-goose", label: "Canada Goose", group: "Geese", limit: 2 }, { id: "light-goose", label: "Snow / Blue Goose", group: "Geese", limit: 25 }, { id: "brant", label: "Brant", group: "Geese", limit: 1 }],
  },
  {
    code: "NC",
    name: "North Carolina",
    verifiedLabel: "Demo season package • verify current Wildlife Commission rules",
    officialUrl: sources.NC,
    shootingHours: "Generally ½ hour before sunrise to sunset; exceptions apply.",
    overview: "Statewide duck framework with Canada goose zones and permit-only waterfowl opportunities.",
    zones: ["Statewide Duck Zone", "Northeast Hunt Zone", "Resident Population Zone"],
    seasons: [
      { name: "Regular Duck", dates: "Oct 2–4 • Nov 15–29 • Dec 13–Jan 31", open: false, zone: "Statewide" },
      { name: "Canada Goose", dates: "Varies by management zone", open: false, zone: "Select zone" },
      { name: "Light Goose", dates: "Oct 14–Feb 14", open: false, zone: "Statewide" },
    ],
    birds: [...coreDucks, { id: "canada-goose", label: "Canada Goose", group: "Geese", limit: 5 }, { id: "light-goose", label: "Snow / Ross’s Goose", group: "Geese", limit: 25 }, { id: "brant", label: "Brant", group: "Geese", limit: 1 }],
  },
];
