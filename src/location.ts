import type { DevicePosition, ForecastPeriod, WeatherData } from "./types";

type NWSPeriod = {
  name: string;
  startTime: string;
  temperature: number;
  temperatureUnit: string;
  shortForecast: string;
  windSpeed: string;
  windDirection: string;
  probabilityOfPrecipitation?: { value?: number | null };
  isDaytime: boolean;
};

async function getJson<T>(url: string, accept = "application/geo+json"): Promise<T> {
  const response = await fetch(url, { headers: { Accept: accept } });
  if (!response.ok) throw new Error(`Service request failed (${response.status}).`);
  return response.json() as Promise<T>;
}

export function getDevicePosition(): Promise<DevicePosition> {
  if (!navigator.geolocation) return Promise.reject(new Error("Location is not supported by this browser."));
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracyMeters: position.coords.accuracy,
        timestamp: position.timestamp,
      }),
      (error) => {
        const messages: Record<number, string> = {
          1: "Location permission was denied. Allow location in your browser settings or use manual selection.",
          2: "Your current location could not be determined. Try again outdoors or use manual selection.",
          3: "Location took too long to respond. Try again or use manual selection.",
        };
        reject(new Error(messages[error.code] || "Unable to access your location."));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  });
}

function normalizePeriod(period: NWSPeriod): ForecastPeriod {
  return {
    name: period.name,
    startTime: period.startTime,
    temperature: period.temperature,
    temperatureUnit: period.temperatureUnit,
    shortForecast: period.shortForecast,
    windSpeed: period.windSpeed,
    windDirection: period.windDirection,
    precipitationChance: period.probabilityOfPrecipitation?.value ?? null,
    isDaytime: period.isDaytime,
  };
}

function celsiusToFahrenheit(value?: number | null) {
  return typeof value === "number" ? Math.round(value * 9 / 5 + 32) : null;
}

function kmhToMph(value?: number | null) {
  return typeof value === "number" ? Math.round(value * 0.621371) : null;
}

function degreesToCardinal(value?: number | null) {
  if (typeof value !== "number") return "Variable";
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return directions[Math.round(value / 45) % 8];
}

export async function getWeather(position: DevicePosition): Promise<WeatherData> {
  const point = await getJson<{
    properties: {
      forecast: string;
      forecastHourly: string;
      observationStations: string;
      forecastOffice?: string;
      forecastZone?: string;
      relativeLocation?: { properties?: { city?: string; state?: string } };
    };
  }>(`https://api.weather.gov/points/${position.latitude.toFixed(4)},${position.longitude.toFixed(4)}`);

  const [hourlyResult, dailyResult, stationsResult, alertsResult] = await Promise.allSettled([
    getJson<{ properties: { periods: NWSPeriod[] } }>(point.properties.forecastHourly),
    getJson<{ properties: { periods: NWSPeriod[] } }>(point.properties.forecast),
    getJson<{ features: Array<{ id: string; properties?: { name?: string } }> }>(point.properties.observationStations),
    getJson<{ features: Array<{ id: string; properties: { event?: string; headline?: string; severity?: string; expires?: string } }> }>(`https://api.weather.gov/alerts/active?point=${position.latitude.toFixed(4)},${position.longitude.toFixed(4)}`),
  ]);

  const hourly = hourlyResult.status === "fulfilled" ? hourlyResult.value.properties.periods.slice(0, 12).map(normalizePeriod) : [];
  const daily = dailyResult.status === "fulfilled" ? dailyResult.value.properties.periods.slice(0, 14).map(normalizePeriod) : [];
  const alerts = alertsResult.status === "fulfilled" ? alertsResult.value.features.map((feature) => ({
    id: feature.id,
    event: feature.properties.event || "Weather alert",
    headline: feature.properties.headline || feature.properties.event || "Active weather alert",
    severity: feature.properties.severity || "Unknown",
    expires: feature.properties.expires,
  })) : [];

  let current: WeatherData["current"] = {
    temperature: hourly[0]?.temperature ?? null,
    description: hourly[0]?.shortForecast || "Current observation unavailable",
    humidity: null,
    windSpeedMph: null,
    windDirection: hourly[0]?.windDirection || "Variable",
    observedAt: hourly[0]?.startTime || null,
    stationName: undefined,
  };

  if (stationsResult.status === "fulfilled" && stationsResult.value.features[0]) {
    const station = stationsResult.value.features[0];
    try {
      const observation = await getJson<{
        properties: {
          timestamp?: string;
          textDescription?: string;
          temperature?: { value?: number | null };
          relativeHumidity?: { value?: number | null };
          windSpeed?: { value?: number | null };
          windDirection?: { value?: number | null };
        };
      }>(`${station.id}/observations/latest`);
      current = {
        temperature: celsiusToFahrenheit(observation.properties.temperature?.value),
        description: observation.properties.textDescription || current.description,
        humidity: typeof observation.properties.relativeHumidity?.value === "number" ? Math.round(observation.properties.relativeHumidity.value) : null,
        windSpeedMph: kmhToMph(observation.properties.windSpeed?.value),
        windDirection: degreesToCardinal(observation.properties.windDirection?.value),
        observedAt: observation.properties.timestamp || null,
        stationName: station.properties?.name,
      };
    } catch {
      // The hourly forecast remains a safe fallback when a station is delayed or unavailable.
    }
  }

  return {
    current,
    hourly,
    daily,
    alerts,
    forecastOffice: point.properties.forecastOffice,
    forecastZone: point.properties.forecastZone,
    locationLabel: [point.properties.relativeLocation?.properties?.city, point.properties.relativeLocation?.properties?.state].filter(Boolean).join(", "),
    retrievedAt: new Date().toISOString(),
  };
}
