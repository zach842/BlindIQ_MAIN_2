export type BirdRule = {
  id: string;
  label: string;
  group: "Ducks" | "Geese" | "Other";
  limit: number;
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

export type StateData = {
  code: string;
  name: string;
  verifiedLabel: string;
  officialUrl: string;
  shootingHours: string;
  seasons: Season[];
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
  state: string;
  zone: string;
  entries: HarvestEntry[];
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
