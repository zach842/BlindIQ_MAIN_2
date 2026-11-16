import { createHash } from 'node:crypto';

export function assertNwsUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.hostname !== 'api.weather.gov' || url.username || url.password || url.port) throw new Error('Only official NWS API URLs are allowed');
  return url.href;
}
const finite = (v) => typeof v === 'number' && Number.isFinite(v) ? v : null;
export function windKph(value) {
  if (typeof value !== 'string') return null;
  const match = value.match(/^(\d+(?:\.\d+)?)(?:\s+to\s+(\d+(?:\.\d+)?))?\s*(mph|km\/h|kph|m\/s|knots?)$/i);
  if (!match) return null;
  const speed = (Number(match[1]) + Number(match[2] ?? match[1])) / 2;
  const unit = match[3].toLowerCase();
  return Math.round(speed * (unit === 'mph' ? 1.609344 : unit === 'm/s' ? 3.6 : unit.startsWith('knot') ? 1.852 : 1) * 100) / 100;
}
export function normalizeNws(payload, fetchedAt = new Date()) {
  const now = new Date(fetchedAt).getTime();
  if (!Number.isFinite(now)) throw new Error('Invalid fetch time');
  const issue = payload?.properties?.updateTime ?? payload?.properties?.updated;
  const issued = Date.parse(issue);
  if (!Number.isFinite(issued)) throw new Error('NWS issue time missing or invalid');
  if (now - issued > 6 * 3600000) throw new Error(`NWS issue is stale: ${new Date(issued).toISOString()} (six-hour limit)`);
  if (issued - now > 300000) throw new Error('NWS issue time is in the future');
  const raw = payload?.properties?.periods;
  if (!Array.isArray(raw)) throw new Error('No NWS hourly periods');
  const periods = raw.filter(p => {
    const t = Date.parse(p.startTime), end = Date.parse(p.endTime);
    return Number.isFinite(t) && Number.isFinite(end) && end > now && t >= now - 3600000 && t < now + 48 * 3600000;
  }).map(p => {
    const temperature = finite(p.temperature);
    const rain = finite(p.probabilityOfPrecipitation?.value);
    return {
      valid_at: new Date(p.startTime).toISOString(),
      temperature_c: temperature === null ? null : p.temperatureUnit === 'C' ? temperature : p.temperatureUnit === 'F' ? Math.round((temperature - 32) * 5 / 9 * 100) / 100 : null,
      wind_kph: windKph(p.windSpeed),
      precipitation_probability: rain !== null && rain >= 0 && rain <= 100 ? rain : null,
    };
  }).sort((a,b)=>a.valid_at.localeCompare(b.valid_at)).slice(0,48);
  if (periods.length < 12 || new Set(periods.map(p=>p.valid_at)).size !== periods.length) throw new Error('Insufficient or duplicate hourly forecast coverage');
  if (periods.some((p,i)=>i && Date.parse(p.valid_at)-Date.parse(periods[i-1].valid_at)!==3600000)) throw new Error('Hourly forecast has gaps');
  const missing = ['temperature_c','wind_kph','precipitation_probability'].filter(key=>periods.some(p=>p[key]===null));
  return { issued_at:new Date(issued).toISOString(), periods, missing_fields:missing,
    content_hash:createHash('sha256').update(JSON.stringify({issue:new Date(issued).toISOString(),periods})).digest('hex') };
}
export async function fetchNws(region, { userAgent, fetchImpl=fetch, now=()=>new Date(), sleep=ms=>new Promise(r=>setTimeout(r,ms)) } = {}) {
  if (!userAgent?.trim()) throw new Error('NWS_USER_AGENT must identify BlindIQ and provide contact information');
  if (!Number.isFinite(region.latitude) || !Number.isFinite(region.longitude) || Math.abs(region.latitude)>90 || Math.abs(region.longitude)>180) throw new Error('Invalid region coordinates');
  const get = async url => {
    assertNwsUrl(url);
    for(let attempt=0;attempt<3;attempt++) {
      const response=await fetchImpl(url,{headers:{'User-Agent':userAgent,Accept:'application/geo+json'},signal:AbortSignal.timeout(12000),redirect:'error'});
      if (response.ok) return response.json();
      if (![429,500,502,503,504].includes(response.status) || attempt===2) throw new Error(`NWS HTTP ${response.status}`);
      const retry=Number(response.headers.get('retry-after'));
      await sleep(Number.isFinite(retry) && retry>0 ? Math.min(retry,10)*1000 : 500*2**attempt);
    }
  };
  const point=await get(`https://api.weather.gov/points/${region.latitude},${region.longitude}`);
  const sourceUrl=assertNwsUrl(point?.properties?.forecastHourly);
  const payload=await get(sourceUrl);
  const fetchedAt=now();
  return { ...normalizeNws(payload,fetchedAt), fetched_at:fetchedAt.toISOString(), source_url:sourceUrl };
}
export function makeContext(region, weather) {
  new Intl.DateTimeFormat('en-US',{timeZone:region.timezone});
  return { taxon:region.taxon, timezone:region.timezone, scope:region.scope_note,
    available_hours:weather.periods.length, missing_fields:weather.missing_fields,
    input_kind:'weather_forecast', animal_observations_available:false,
    activity_score:null, validation_status:'context_only',
    note:'Weather availability is not animal movement confidence. Breeding, gobbling and movement are distinct targets.' };
}
