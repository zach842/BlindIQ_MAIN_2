export type FlywayName = "Atlantic" | "Mississippi" | "Central" | "Pacific";

export type MigrationRegion = {
  id: string;
  flyway: FlywayName;
  name: string;
  shortName: string;
  states: string[];
  description: string;
  latitude: number;
  longitude: number;
  displayOrder: number;
};

export type MigrationSnapshot = {
  regionId: string;
  observedIndex: number;
  forecastIndex: number;
  confidence: number;
  direction: "northbound" | "southbound" | "staging";
  trend: "rising" | "steady" | "falling";
  status: string;
  summary: string;
  drivers: string[];
  sources: string[];
  generatedAt: string;
  validThrough: string;
};

export type MigrationDataMode = "live" | "cached" | "preview";

export type MigrationData = {
  regions: MigrationRegion[];
  snapshots: MigrationSnapshot[];
  mode: MigrationDataMode;
  retrievedAt: string;
};

export const migrationRegions: MigrationRegion[] = [
  {
    id: "atlantic-north",
    flyway: "Atlantic",
    name: "Northern Atlantic",
    shortName: "North",
    states: ["ME", "NH", "VT", "MA", "RI", "CT", "NY", "PA", "NJ"],
    description: "New England, Great Lakes, upper Mid-Atlantic, and northern coastal staging areas.",
    latitude: 42.65,
    longitude: -73.75,
    displayOrder: 1,
  },
  {
    id: "atlantic-mid",
    flyway: "Atlantic",
    name: "Mid-Atlantic",
    shortName: "Mid",
    states: ["MD", "DE", "VA", "WV"],
    description: "Chesapeake, Delaware Bay, and central Appalachian movement corridor.",
    latitude: 38.48,
    longitude: -76.2,
    displayOrder: 2,
  },
  {
    id: "atlantic-south",
    flyway: "Atlantic",
    name: "Southern Atlantic",
    shortName: "South",
    states: ["NC", "SC", "GA", "FL"],
    description: "Carolina sounds, coastal marshes, and southern wintering areas.",
    latitude: 33.84,
    longitude: -78.72,
    displayOrder: 3,
  },
  {
    id: "mississippi-north",
    flyway: "Mississippi",
    name: "Northern Mississippi",
    shortName: "North",
    states: ["MN", "WI", "MI"],
    description: "Prairie transition, Great Lakes, and upper Mississippi staging areas.",
    latitude: 44.95,
    longitude: -92.95,
    displayOrder: 1,
  },
  {
    id: "mississippi-mid",
    flyway: "Mississippi",
    name: "Central Mississippi",
    shortName: "Mid",
    states: ["IA", "IL", "IN", "OH", "MO", "KY", "TN"],
    description: "Major river confluences and central agricultural stopover habitat.",
    latitude: 39.45,
    longitude: -90.55,
    displayOrder: 2,
  },
  {
    id: "mississippi-south",
    flyway: "Mississippi",
    name: "Southern Mississippi",
    shortName: "South",
    states: ["AR", "MS", "LA", "AL"],
    description: "Lower Mississippi alluvial valley and Gulf Coast wintering habitat.",
    latitude: 32.62,
    longitude: -91.45,
    displayOrder: 3,
  },
  {
    id: "central-north",
    flyway: "Central",
    name: "Northern Central",
    shortName: "North",
    states: ["MT*", "ND", "SD"],
    description: "Northern Great Plains, prairie potholes, and upper Central Flyway staging areas.",
    latitude: 45.45,
    longitude: -101.2,
    displayOrder: 1,
  },
  {
    id: "central-mid",
    flyway: "Central",
    name: "Central Plains",
    shortName: "Mid",
    states: ["WY*", "CO*", "NE", "KS"],
    description: "High Plains reservoirs, Platte corridor, and central agricultural stopover habitat.",
    latitude: 40.45,
    longitude: -99.45,
    displayOrder: 2,
  },
  {
    id: "central-south",
    flyway: "Central",
    name: "Southern Central",
    shortName: "South",
    states: ["NM*", "OK", "TX"],
    description: "Southern High Plains, Red River corridor, and Gulf Coast wintering habitat.",
    latitude: 34.75,
    longitude: -99.25,
    displayOrder: 3,
  },
  {
    id: "pacific-north",
    flyway: "Pacific",
    name: "Alaska & North Pacific",
    shortName: "North",
    states: ["AK"],
    description: "Alaska breeding and staging areas feeding the Pacific coastal and interior migration corridors.",
    latitude: 61.22,
    longitude: -149.9,
    displayOrder: 1,
  },
  {
    id: "pacific-mid",
    flyway: "Pacific",
    name: "Pacific Northwest",
    shortName: "Mid",
    states: ["WA", "OR", "ID", "MT*", "WY*"],
    description: "Pacific Northwest wetlands, Columbia Basin, and northern Intermountain staging habitat.",
    latitude: 43.62,
    longitude: -116.2,
    displayOrder: 2,
  },
  {
    id: "pacific-south",
    flyway: "Pacific",
    name: "Pacific Southwest",
    shortName: "South",
    states: ["CA", "NV", "UT", "AZ", "CO*", "NM*"],
    description: "California valleys, Great Basin, desert wetlands, and southwestern wintering habitat.",
    latitude: 36.74,
    longitude: -119.78,
    displayOrder: 3,
  },
];

const ATLANTIC_STATE_CODES = new Set(["ME", "NH", "VT", "MA", "RI", "CT", "NY", "PA", "NJ", "DE", "MD", "VA", "WV", "NC", "SC", "GA", "FL"]);
const MISSISSIPPI_STATE_CODES = new Set(["MN", "WI", "MI", "IA", "IL", "IN", "OH", "MO", "KY", "TN", "AR", "MS", "LA", "AL"]);
const CENTRAL_STATE_CODES = new Set(["MT", "WY", "CO", "NM", "TX", "OK", "KS", "NE", "SD", "ND"]);
const PACIFIC_STATE_CODES = new Set(["AK", "AZ", "CA", "ID", "NV", "OR", "UT", "WA"]);

export function migrationStatus(index: number) {
  if (index >= 82) return "Peak movement";
  if (index >= 65) return "Strong push";
  if (index >= 45) return "Moving";
  if (index >= 25) return "Building";
  return "Holding";
}

function seasonalDirection(date: Date): MigrationSnapshot["direction"] {
  const month = date.getMonth() + 1;
  if (month >= 8 || month <= 1) return "southbound";
  if (month >= 2 && month <= 5) return "northbound";
  return "staging";
}

function seasonalBase(region: MigrationRegion, date: Date) {
  const month = date.getMonth() + 1;
  const north = region.displayOrder === 1;
  const mid = region.displayOrder === 2;
  if (month === 8) return north ? 38 : mid ? 24 : 16;
  if (month === 9) return north ? 62 : mid ? 42 : 25;
  if (month === 10) return north ? 73 : mid ? 66 : 43;
  if (month === 11) return north ? 48 : mid ? 76 : 67;
  if (month === 12 || month === 1) return north ? 25 : mid ? 48 : 76;
  if (month === 2) return north ? 20 : mid ? 40 : 65;
  if (month === 3) return north ? 44 : mid ? 65 : 55;
  if (month === 4) return north ? 68 : mid ? 58 : 35;
  if (month === 5) return north ? 45 : mid ? 30 : 20;
  return 18;
}

export function previewMigrationData(now = new Date()): MigrationData {
  const generatedAt = new Date(now);
  generatedAt.setMinutes(0, 0, 0);
  const validThrough = new Date(generatedAt.getTime() + 6 * 60 * 60 * 1000);
  const direction = seasonalDirection(now);
  const dayVariation = ((now.getDate() * 7) % 13) - 6;

  return {
    regions: migrationRegions,
    snapshots: migrationRegions.map((region) => {
      const forecastIndex = Math.max(8, Math.min(88, seasonalBase(region, now) + dayVariation));
      const observedIndex = Math.max(5, forecastIndex - 7);
      return {
        regionId: region.id,
        observedIndex,
        forecastIndex,
        confidence: 45,
        direction,
        trend: forecastIndex > observedIndex + 4 ? "rising" : "steady",
        status: migrationStatus(forecastIndex),
        summary: `Seasonal ${direction === "staging" ? "staging" : `${direction} movement`} conditions are ${migrationStatus(forecastIndex).toLowerCase()} across the ${region.name} region.`,
        drivers: ["Seasonal timing baseline", "Regional flyway position", "Live weather feed pending setup"],
        sources: ["BlindIQ seasonal preview"],
        generatedAt: generatedAt.toISOString(),
        validThrough: validThrough.toISOString(),
      };
    }),
    mode: "preview",
    retrievedAt: generatedAt.toISOString(),
  };
}

export function formatMigrationTime(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function flywayForState(stateCode: string): FlywayName | null {
  if (PACIFIC_STATE_CODES.has(stateCode)) return "Pacific";
  if (CENTRAL_STATE_CODES.has(stateCode)) return "Central";
  if (MISSISSIPPI_STATE_CODES.has(stateCode)) return "Mississippi";
  if (ATLANTIC_STATE_CODES.has(stateCode)) return "Atlantic";
  return null;
}
