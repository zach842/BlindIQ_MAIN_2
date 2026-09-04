export type HuntCategoryId = "waterfowl" | "deer" | "turkey" | "dove-migratory" | "upland-birds" | "big-game" | "small-game" | "predator-furbearer" | "other-game";

export type GameGroup = "Ducks" | "Geese" | "Other" | "Deer" | "Turkey" | "Migratory Birds" | "Upland Birds" | "Big Game" | "Small Game" | "Predators & Furbearers" | "Other Game";

export type BirdRule = {
  id: string;
  label: string;
  group: GameGroup;
  limit: number;
  icon?: string;
  huntCategory?: HuntCategoryId;
  note?: string;
  sex?: "Drake" | "Hen";
  parent?: string;
  parentLimit?: number;
  parentLimits?: Record<string, number>;
  zoneLimits?: Record<string, number>;
};

export type Season = {
  name: string;
  dates: string;
  open: boolean;
  zone: string;
};

export type WaterfowlStatusPeriod = {
  name: string;
  category: "ducks" | "geese";
  startDate: string;
  endDate: string;
  zone: string;
};

export type StateData = {
  code: string;
  name: string;
  verifiedLabel: string;
  officialUrl: string;
  sourceLinks?: { label: string; url: string }[];
  shootingHours: string;
  seasons: Season[];
  statusPeriods?: WaterfowlStatusPeriod[];
  zones: string[];
  birds: BirdRule[];
  overview: string;
  seasonYear?: string;
  dataStatus?: "current" | "tentative" | "archived" | "demo";
  dataNotice?: string;
  specialRules?: string[];
  duckDailyLimit?: number;
  duckDailyLimits?: Record<string, number>;
};

export type HarvestEntry = BirdRule & { count: number };

export type HuntRecord = {
  id: string;
  date: string;
  huntedAt: string;
  stateCode: string;
  state: string;
  zone: string;
  entries: HarvestEntry[];
  isSimulation: boolean;
  huntCategory?: HuntCategoryId;
  blindName?: string | null;
  firearmUsed?: string | null;
  notes?: string | null;
  photoPath?: string | null;
  photoUrl?: string | null;
};

export type NewHuntRecord = {
  stateCode: string;
  state: string;
  zone: string;
  entries: HarvestEntry[];
  isSimulation: boolean;
  huntCategory: HuntCategoryId;
  seasonYear?: string;
  blindName?: string;
  firearmUsed?: string;
  notes?: string;
};

export type DevicePosition = {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  timestamp: number;
};

export type ForecastPeriod = {
  name: string;
  startTime: string;
  temperature: number;
  temperatureUnit: string;
  shortForecast: string;
  windSpeed: string;
  windDirection: string;
  precipitationChance: number | null;
  isDaytime: boolean;
};

export type CurrentConditions = {
  temperature: number | null;
  description: string;
  humidity: number | null;
  windSpeedMph: number | null;
  windDirection: string;
  observedAt: string | null;
  stationName?: string;
};

export type WeatherAlert = {
  id: string;
  event: string;
  headline: string;
  severity: string;
  expires?: string;
};

export type WeatherData = {
  current: CurrentConditions;
  hourly: ForecastPeriod[];
  daily: ForecastPeriod[];
  alerts: WeatherAlert[];
  forecastOffice?: string;
  forecastZone?: string;
  locationLabel?: string;
  retrievedAt: string;
};
