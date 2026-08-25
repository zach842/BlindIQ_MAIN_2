import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

type Region = {
  id: string;
  name: string;
  displayOrder: number;
  latitude: number;
  longitude: number;
};

type ForecastPeriod = {
  startTime: string;
  temperature: number;
  temperatureUnit: string;
  windSpeed: string;
  windDirection: string;
  shortForecast: string;
  probabilityOfPrecipitation?: { value?: number | null };
};

type SnapshotRow = {
  region_id: string;
  species_group: string;
  observed_index: number;
  forecast_index: number;
  confidence: number;
  direction: "northbound" | "southbound" | "staging";
  trend: "rising" | "steady" | "falling";
  status: string;
  summary: string;
  drivers: string[];
  sources: string[];
  generated_at: string;
  valid_through: string;
};

type ObservationRow = {
  region_id: string;
  source: string;
  metric: string;
  value: number;
  unit: string;
  observed_at: string;
  details: Record<string, string | number | undefined>;
};

type SourceRunRow = {
  id: string;
  source: string;
  status: "running" | "success" | "partial" | "failed";
  regions_attempted: number;
  regions_updated: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
};

type Database = {
  public: {
    Tables: {
      migration_snapshots: {
        Row: SnapshotRow & { id: string; created_at: string };
        Insert: SnapshotRow & { id?: string; created_at?: string };
        Update: Partial<SnapshotRow & { id: string; created_at: string }>;
        Relationships: [];
      };
      migration_observations: {
        Row: ObservationRow & { id: string; created_at: string };
        Insert: ObservationRow & { id?: string; created_at?: string };
        Update: Partial<ObservationRow & { id: string; created_at: string }>;
        Relationships: [];
      };
      migration_source_runs: {
        Row: SourceRunRow;
        Insert: Pick<SourceRunRow, "source" | "status"> & Partial<Omit<SourceRunRow, "id" | "source" | "status">> & { id?: string };
        Update: Partial<SourceRunRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

const regions: Region[] = [
  { id: "atlantic-north", name: "Northern Atlantic", displayOrder: 1, latitude: 42.65, longitude: -73.75 },
  { id: "atlantic-mid", name: "Mid-Atlantic", displayOrder: 2, latitude: 38.48, longitude: -76.2 },
  { id: "atlantic-south", name: "Southern Atlantic", displayOrder: 3, latitude: 33.84, longitude: -78.72 },
  { id: "mississippi-north", name: "Northern Mississippi", displayOrder: 1, latitude: 44.95, longitude: -92.95 },
  { id: "mississippi-mid", name: "Central Mississippi", displayOrder: 2, latitude: 39.45, longitude: -90.55 },
  { id: "mississippi-south", name: "Southern Mississippi", displayOrder: 3, latitude: 32.62, longitude: -91.45 },
];

const nwsHeaders = {
  Accept: "application/geo+json",
  "User-Agent": "BlindIQ Migration Pulse (office@blindiq.app)",
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}

function average(values: number[]) {
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0;
}

function windMph(value: string) {
  const speeds = value.match(/\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  return average(speeds);
}

function seasonalDirection(date: Date) {
  const month = date.getUTCMonth() + 1;
  if (month >= 8 || month <= 1) return "southbound" as const;
  if (month >= 2 && month <= 5) return "northbound" as const;
  return "staging" as const;
}

function seasonalBase(displayOrder: number, date: Date) {
  const month = date.getUTCMonth() + 1;
  const north = displayOrder === 1;
  const middle = displayOrder === 2;
  if (month === 8) return north ? 38 : middle ? 24 : 16;
  if (month === 9) return north ? 62 : middle ? 42 : 25;
  if (month === 10) return north ? 73 : middle ? 66 : 43;
  if (month === 11) return north ? 48 : middle ? 76 : 67;
  if (month === 12 || month === 1) return north ? 25 : middle ? 48 : 76;
  if (month === 2) return north ? 20 : middle ? 40 : 65;
  if (month === 3) return north ? 44 : middle ? 65 : 55;
  if (month === 4) return north ? 68 : middle ? 58 : 35;
  if (month === 5) return north ? 45 : middle ? 30 : 20;
  return 18;
}

function statusFor(index: number) {
  if (index >= 82) return "Peak movement";
  if (index >= 65) return "Strong push";
  if (index >= 45) return "Moving";
  if (index >= 25) return "Building";
  return "Holding";
}

function windSupport(direction: string, movement: ReturnType<typeof seasonalDirection>) {
  const normalized = direction.toUpperCase();
  if (movement === "southbound") {
    if (["N", "NNE", "NE", "NNW", "NW"].includes(normalized)) return 1;
    if (["S", "SSE", "SE", "SSW", "SW"].includes(normalized)) return -1;
  }
  if (movement === "northbound") {
    if (["S", "SSE", "SE", "SSW", "SW"].includes(normalized)) return 1;
    if (["N", "NNE", "NE", "NNW", "NW"].includes(normalized)) return -1;
  }
  return 0;
}

async function fetchJson(url: string) {
  const response = await fetch(url, { headers: nwsHeaders, signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error(`NWS request failed with ${response.status}`);
  return response.json();
}

async function forecastFor(region: Region) {
  const point = await fetchJson(`https://api.weather.gov/points/${region.latitude},${region.longitude}`);
  const hourlyUrl = point?.properties?.forecastHourly;
  if (!hourlyUrl) throw new Error("NWS point response did not include an hourly forecast URL.");
  const forecast = await fetchJson(hourlyUrl);
  const periods = (forecast?.properties?.periods ?? []).slice(0, 48) as ForecastPeriod[];
  if (periods.length < 12) throw new Error("NWS hourly forecast did not include enough periods.");
  return periods;
}

function scoreForecast(region: Region, periods: ForecastPeriod[], generatedAt: Date) {
  const direction = seasonalDirection(generatedAt);
  const firstTwelve = periods.slice(0, 12);
  const laterPeriods = periods.slice(24, 48);
  const currentTemperature = average(firstTwelve.map((period) => period.temperature));
  const laterTemperature = average(laterPeriods.map((period) => period.temperature));
  const temperatureChange = laterTemperature - currentTemperature;
  const supportValues = periods.slice(0, 30).map((period) => windSupport(period.windDirection, direction));
  const supportiveWind = supportValues.filter((value) => value > 0).length / supportValues.length;
  const opposingWind = supportValues.filter((value) => value < 0).length / supportValues.length;
  const averageWind = average(periods.slice(0, 30).map((period) => windMph(period.windSpeed)));
  const averagePrecipitation = average(periods.slice(0, 30).map((period) => Number(period.probabilityOfPrecipitation?.value ?? 0)));
  const snowSignal = periods.some((period) => /snow|sleet|freezing/i.test(period.shortForecast));

  let forecastIndex = seasonalBase(region.displayOrder, generatedAt);
  if (direction === "southbound") forecastIndex += clamp(-temperatureChange * 1.7, -15, 22);
  if (direction === "northbound") forecastIndex += clamp(temperatureChange * 1.7, -15, 22);
  forecastIndex += supportiveWind * 19;
  forecastIndex -= opposingWind * 12;
  if (averageWind >= 8 && averageWind <= 25) forecastIndex += 5;
  if (averagePrecipitation >= 65) forecastIndex -= 7;
  if (snowSignal && direction === "southbound") forecastIndex += 7;
  forecastIndex = Math.round(clamp(forecastIndex, 5, 95));

  const observedIndex = Math.round(clamp(
    seasonalBase(region.displayOrder, generatedAt) +
      average(firstTwelve.map((period) => windSupport(period.windDirection, direction))) * 12,
    5,
    95,
  ));
  const difference = forecastIndex - observedIndex;
  const trend: SnapshotRow["trend"] = difference >= 5 ? "rising" : difference <= -5 ? "falling" : "steady";
  const drivers = [
    `${direction === "staging" ? "Seasonal staging" : `${direction[0].toUpperCase()}${direction.slice(1)} seasonal timing`} baseline`,
    supportiveWind >= 0.35 ? "Supportive flyway winds in the forecast" : opposingWind >= 0.35 ? "Opposing winds may slow movement" : "Mixed wind support",
    Math.abs(temperatureChange) >= 4 ? `${temperatureChange < 0 ? "Falling" : "Rising"} temperatures over the next 48 hours` : "Limited temperature change",
  ];
  if (snowSignal) drivers.push("Snow or freezing-weather pressure");
  if (averagePrecipitation >= 65) drivers.push("Periods of heavier precipitation may suppress flight activity");

  const status = statusFor(forecastIndex);
  const summary = `${status} potential is forecast for the ${region.name} region. The score combines seasonal position with wind, temperature, and precipitation expected during the next 48 hours.`;
  return {
    observedIndex,
    forecastIndex,
    confidence: 68,
    direction,
    trend,
    status,
    summary,
    drivers,
    sources: ["National Weather Service", "BlindIQ seasonal model"],
    weatherDetails: {
      average_wind_mph: Math.round(averageWind * 10) / 10,
      temperature_change_f: Math.round(temperatureChange * 10) / 10,
      average_precipitation_chance: Math.round(averagePrecipitation),
      forecast_start: periods[0]?.startTime,
    },
  };
}

export default {
  fetch: withSupabase<Database>({ auth: ["secret"] }, async (request, context) => {
    if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
    const startedAt = new Date();
    const { data: run, error: runError } = await context.supabaseAdmin
      .from("migration_source_runs")
      .insert({ source: "nws", status: "running", regions_attempted: regions.length, started_at: startedAt.toISOString() })
      .select("id")
      .single();
    if (runError) return Response.json({ error: runError.message }, { status: 500 });

    const generatedAt = new Date(startedAt);
    generatedAt.setUTCMinutes(0, 0, 0);
    const validThrough = new Date(generatedAt.getTime() + 6 * 60 * 60 * 1000);
    const snapshots: SnapshotRow[] = [];
    const observations: ObservationRow[] = [];
    const failures: string[] = [];

    for (const region of regions) {
      try {
        const periods = await forecastFor(region);
        const score = scoreForecast(region, periods, generatedAt);
        snapshots.push({
          region_id: region.id,
          species_group: "all-waterfowl",
          observed_index: score.observedIndex,
          forecast_index: score.forecastIndex,
          confidence: score.confidence,
          direction: score.direction,
          trend: score.trend,
          status: score.status,
          summary: score.summary,
          drivers: score.drivers,
          sources: score.sources,
          generated_at: generatedAt.toISOString(),
          valid_through: validThrough.toISOString(),
        });
        observations.push({
          region_id: region.id,
          source: "nws",
          metric: "weather_movement_conditions",
          value: score.forecastIndex,
          unit: "index_0_100",
          observed_at: generatedAt.toISOString(),
          details: score.weatherDetails,
        });
      } catch (error) {
        failures.push(`${region.id}: ${error instanceof Error ? error.message : "Unknown source error"}`);
      }
    }

    let databaseError = "";
    if (snapshots.length) {
      const { error } = await context.supabaseAdmin
        .from("migration_snapshots")
        .upsert(snapshots, { onConflict: "region_id,species_group,generated_at" });
      if (error) databaseError = error.message;
    }
    if (observations.length && !databaseError) {
      const { error } = await context.supabaseAdmin.from("migration_observations").insert(observations);
      if (error) databaseError = error.message;
    }

    const status = databaseError || !snapshots.length ? "failed" : failures.length ? "partial" : "success";
    const errorMessage = [databaseError, ...failures].filter(Boolean).join(" | ").slice(0, 4000) || null;
    await context.supabaseAdmin
      .from("migration_source_runs")
      .update({ status, regions_updated: databaseError ? 0 : snapshots.length, error_message: errorMessage, completed_at: new Date().toISOString() })
      .eq("id", run.id);

    return Response.json({
      status,
      generatedAt: generatedAt.toISOString(),
      regionsUpdated: databaseError ? 0 : snapshots.length,
      regionsAttempted: regions.length,
      failures: failures.length,
    }, { status: status === "failed" ? 502 : 200 });
  }),
};
