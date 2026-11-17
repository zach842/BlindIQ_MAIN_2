export type WeatherHour = { startTime: string; endTime: string; temperature: number | null; temperatureUnit: string; windSpeed: string; windDirection: string; shortForecast: string; precipitation: number | null };
export type WeatherBatch = { issuedAt: string; fetchedAt: string; expiresAt: number; hours: WeatherHour[] };
export function parseFieldWeather(data: unknown, now = Date.now()): WeatherBatch {
  const props = (data as { properties?: Record<string, unknown> })?.properties;
  const issuedAt = typeof props?.updateTime === 'string' ? props.updateTime : '';
  const issued = Date.parse(issuedAt);
  if (!Number.isFinite(issued) || issued > now + 5 * 60_000 || now - issued > 6 * 3600_000) throw Error('NWS forecast is stale or has an invalid issue time. No current conditions are shown.');
  if (!Array.isArray(props?.periods)) throw Error('NWS returned incomplete forecast data.');
  const hours: WeatherHour[] = [];
  for (const p of props.periods) {
    const start = Date.parse(p.startTime), end = Date.parse(p.endTime);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || end <= now || start > now + 24 * 3600_000) continue;
    if (!['F', 'C'].includes(p.temperatureUnit)) throw Error('NWS returned an unsupported temperature unit.');
    hours.push({ startTime: p.startTime, endTime: p.endTime, temperature: typeof p.temperature === 'number' && Number.isFinite(p.temperature) ? p.temperature : null, temperatureUnit: p.temperatureUnit, windSpeed: typeof p.windSpeed === 'string' ? p.windSpeed : 'Unavailable', windDirection: typeof p.windDirection === 'string' ? p.windDirection : '', shortForecast: typeof p.shortForecast === 'string' ? p.shortForecast : 'Unavailable', precipitation: typeof p.probabilityOfPrecipitation?.value === 'number' && p.probabilityOfPrecipitation.value >= 0 && p.probabilityOfPrecipitation.value <= 100 ? p.probabilityOfPrecipitation.value : null });
  }
  hours.sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime));
  if (!hours.length || Date.parse(hours[0].startTime) > now + 3600_000) throw Error('NWS has no usable forecast for the current hour.');
  return { issuedAt, fetchedAt: new Date(now).toISOString(), expiresAt: Math.min(issued + 6 * 3600_000, Date.parse(hours[0].endTime)), hours: hours.slice(0, 6) };
}
