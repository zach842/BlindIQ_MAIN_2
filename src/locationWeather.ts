const NWS_ORIGIN = "https://api.weather.gov";
const MAX_STATION_KM = 80;
const MAX_OBSERVATION_AGE_MS = 2 * 60 * 60_000;
type JsonObject = Record<string, unknown>;
const object = (value: unknown): JsonObject => value && typeof value === "object" ? value as JsonObject : {};
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
export type WeatherStation = { id: string; distanceKm: number };

export function weatherPoint(latitude: number, longitude: number) {
  if (!finite(latitude) || !finite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) throw new Error("Your location could not be read. Enter weather manually or try again.");
  // Reduce precision before sending coordinates to the weather provider.
  return { latitude: Number(latitude.toFixed(3)), longitude: Number(longitude.toFixed(3)) };
}

function distanceKm(lat: number, lng: number, stationLat: number, stationLng: number) {
  const radians = (n: number) => n * Math.PI / 180;
  const a = Math.sin(radians(stationLat - lat) / 2) ** 2 + Math.cos(radians(lat)) * Math.cos(radians(stationLat)) * Math.sin(radians(stationLng - lng) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, a)));
}

export function nearbyWeatherStations(data: unknown, lat: number, lng: number): WeatherStation[] {
  const features = object(data).features;
  if (!Array.isArray(features)) return [];
  const stations: WeatherStation[] = [];
  for (const feature of features) {
    const f = object(feature), id = object(f.properties).stationIdentifier, geometry = object(f.geometry), coords = geometry.coordinates;
    if (typeof id !== "string" || !/^[A-Z0-9_-]{1,20}$/.test(id) || geometry.type !== "Point" || !Array.isArray(coords) || !finite(coords[0]) || !finite(coords[1]) || Math.abs(coords[0]) > 180 || Math.abs(coords[1]) > 90) continue;
    const distance = distanceKm(lat, lng, coords[1], coords[0]);
    if (distance <= MAX_STATION_KM && !stations.some(station => station.id === id)) stations.push({ id, distanceKm: distance });
  }
  return stations.sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 3);
}

function quantity(value: unknown, units: string[]) {
  const q = object(value);
  // Missing or rejected readings must never turn into zero.
  return finite(q.value) && units.includes(String(q.unitCode)) && q.qualityControl !== "X" && q.qualityControl !== "Z" ? q.value : null;
}

export function observationWeatherNote(data: unknown, station: WeatherStation, now = Date.now()) {
  if (!/^[A-Z0-9_-]{1,20}$/.test(station.id) || !finite(station.distanceKm) || station.distanceKm < 0 || station.distanceKm > MAX_STATION_KM) throw new Error("No nearby weather station is available.");
  const p = object(object(data).properties);
  const observed = typeof p.timestamp === "string" ? Date.parse(p.timestamp) : NaN;
  if (!Number.isFinite(observed) || observed > now + 5 * 60_000 || now - observed > MAX_OBSERVATION_AGE_MS) throw new Error("The station observation is too old or has an invalid time.");
  const celsius = quantity(p.temperature, ["wmoUnit:degC"]);
  const fahrenheit = quantity(p.temperature, ["wmoUnit:degF"]);
  const temperature = celsius === null ? fahrenheit : celsius * 9 / 5 + 32;
  if (temperature === null || temperature < -150 || temperature > 160) throw new Error("The station has no usable temperature reading.");
  const speedKmh = quantity(p.windSpeed, ["wmoUnit:km_h-1", "wmoUnit:km_h"]);
  const speedMs = quantity(p.windSpeed, ["wmoUnit:m_s-1"]);
  const speed = speedKmh !== null ? speedKmh / 1.609344 : speedMs !== null ? speedMs * 2.236936 : null;
  const degrees = quantity(p.windDirection, ["wmoUnit:degree_(angle)"]);
  const direction = degrees !== null && degrees >= 0 && degrees <= 360 ? ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(degrees / 45) % 8] : "";
  const description = typeof p.textDescription === "string" ? p.textDescription.replace(/\s+/g, " ").trim().slice(0, 60) : "";
  const wind = speed !== null && speed >= 0 && speed <= 250 ? speed === 0 ? "Calm wind" : `${direction ? direction + " " : ""}${Math.round(speed)} mph wind` : "";
  return [`${Math.round(temperature)}°F`, description, wind, `NWS ${station.id}, ${Math.round(station.distanceKm / 1.609344)} mi away`, `observed ${new Date(observed).toISOString().slice(0, 16).replace("T", " ")} UTC`].filter(Boolean).join(" · ");
}

export async function fetchLocationWeather(latitude: number, longitude: number, signal: AbortSignal): Promise<string> {
  const point = weatherPoint(latitude, longitude);
  async function get(url: string) {
    let response: Response;
    try { response = await fetch(url, { signal, cache: "no-store", headers: { Accept: "application/geo+json" } }); }
    catch (error) { if (signal.aborted) throw error; throw new Error("The weather service could not be reached. Try again or enter conditions manually."); }
    if (!response.ok) throw new Error(response.status === 404 ? "NWS weather is not available at this location. Enter conditions manually." : "The weather service is unavailable. Try again or enter conditions manually.");
    return response.json() as Promise<unknown>;
  }
  const points = object(await get(`${NWS_ORIGIN}/points/${point.latitude},${point.longitude}`));
  const stationsUrl = object(points.properties).observationStations;
  if (typeof stationsUrl !== "string") throw new Error("NWS has no weather stations for this location. Enter conditions manually.");
  const url = new URL(stationsUrl);
  if (url.origin !== NWS_ORIGIN || url.username || url.password || !url.pathname.endsWith("/stations")) throw new Error("The weather service returned an invalid station link. Try again later.");
  const stations = nearbyWeatherStations(await get(url.href), point.latitude, point.longitude);
  for (const station of stations) {
    try { return observationWeatherNote(await get(`${NWS_ORIGIN}/stations/${station.id}/observations/latest`), station); }
    catch (error) { if (signal.aborted) throw error; }
  }
  throw new Error("No recent weather observation was available within 50 miles. Enter conditions manually or try again later.");
}
