import { useEffect, useRef, useState } from 'react';
import { parseFieldWeather, type WeatherBatch } from './fieldWeather';
import './fieldMaps.css';
const pilots = { MD: { name: 'Central Maryland pilot', lat: 39.05, lng: -76.65, timezone: 'America/New_York' }, SC: { name: 'South Carolina coastal pilot', lat: 32.8, lng: -80.8, timezone: 'America/New_York' } };
export default function FieldForecast({ species }: { species: 'deer' | 'turkey' }) {
  const [region, setRegion] = useState(''); const [batch, setBatch] = useState<WeatherBatch | null>(null);
  const [status, setStatus] = useState(''); const [busy, setBusy] = useState(false); const [now, setNow] = useState(Date.now());
  const request = useRef<AbortController | null>(null);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 30_000); return () => { clearInterval(timer); request.current?.abort(); }; }, []);
  const pilot = pilots[region as keyof typeof pilots];
  const fresh = batch && now < batch.expiresAt;
  async function refresh() {
    if (!pilot) return;
    request.current?.abort(); const controller = new AbortController(); request.current = controller;
    const timer = window.setTimeout(() => controller.abort(), 20000); setBusy(true); setBatch(null); setStatus('Loading NWS hourly weather…');
    try {
      const points = await fetch(`https://api.weather.gov/points/${pilot.lat},${pilot.lng}`, { signal: controller.signal, headers: { Accept: 'application/geo+json' } });
      if (!points.ok) throw Error(`NWS location service unavailable (${points.status}).`);
      const metadata = await points.json(); const url = metadata.properties?.forecastHourly;
      if (typeof url !== 'string' || !url.startsWith('https://api.weather.gov/')) throw Error('NWS hourly endpoint unavailable for this location.');
      const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/geo+json' } });
      if (!response.ok) throw Error(`NWS weather service unavailable (${response.status}).`);
      const parsed = parseFieldWeather(await response.json());
      if (!controller.signal.aborted) { setBatch(parsed); setNow(Date.now()); setStatus('Weather loaded. This is environmental guidance, not an animal activity prediction.'); }
    } catch (error) { if (request.current === controller) setStatus(controller.signal.aborted ? 'Request stopped or timed out. Please try again.' : error instanceof Error ? error.message : 'Weather unavailable. Please try again.'); }
    finally { clearTimeout(timer); if (request.current === controller) setBusy(false); }
  }
  const format = (value: string) => new Date(value).toLocaleString('en-US', { timeZone: pilot?.timezone || 'America/New_York', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
  return <section className="section field-page"><div className="field-eyebrow">CONDITIONS & SEASONAL CONTEXT • PILOT</div><h2>{species === 'deer' ? 'Deer field outlook' : 'Movement and gobbling'}</h2><p>Weather you can check. Research you can trace.</p>
    <label className="field-weather-location">Pilot weather location<select value={region} onChange={e => { request.current?.abort(); request.current = null; setBusy(false); setBatch(null); setStatus(''); setRegion(e.target.value); }}><option value="">Choose a pilot location</option>{Object.entries(pilots).map(([key, p]) => <option key={key} value={key}>{p.name}</option>)}</select></label>
    {pilot && <p className="field-small">Representative point: {pilot.lat}, {pilot.lng}. Weather is for this point, not your whole state or hunting property. Opening weather shares this pilot coordinate with NWS.</p>}
    <button type="button" onClick={() => void refresh()} disabled={!pilot || busy}>{busy ? 'Loading weather…' : 'Refresh local weather'}</button>
    <p role="status">{status}</p>
    {fresh && batch && <><div className="weather-hours">{batch.hours.map(hour => <div className="weather-hour" key={hour.startTime}><span>{format(hour.startTime)}</span><strong>{hour.temperature === null ? '—' : `${hour.temperature}°${hour.temperatureUnit}`}</strong><span>{hour.shortForecast}</span><span>{hour.windDirection} {hour.windSpeed}</span><span>Precipitation: {hour.precipitation === null ? 'unavailable' : `${hour.precipitation}%`}</span></div>)}</div><p className="field-small">NWS issued: {format(batch.issuedAt)} · Retrieved: {format(batch.fetchedAt)}. Refresh after {format(new Date(batch.expiresAt).toISOString())}.</p></>}
    {batch && !fresh && <p className="field-notice">Weather has expired. Refresh to view current forecast hours.</p>}
    <a href="https://www.weather.gov/documentation/services-web-api" target="_blank" rel="noreferrer">Weather source: National Weather Service ↗</a>
    <hr />{species === 'deer' ? <><h3>Maryland whitetail reference</h3><p>Maryland DNR describes breeding from October through mid-December, with most pregnancies beginning in the first half of November. This applies to Maryland whitetail biology; it is not a daily movement prediction or a sika, Sitka or nationwide rut calendar.</p><a href="https://dnr.maryland.gov/wildlife/Pages/hunt_trap/wtdeerbiology.aspx" target="_blank" rel="noreferrer">Maryland DNR: whitetail biology ↗</a></> : <><h3>Turkey research reference</h3><p>Gobbling, breeding and movement measure different things. Research on Eastern wild turkeys in the Southeast found relationships between weather and gobbling, but does not establish a reliable daily movement score for every location.</p><a href="https://research.fs.usda.gov/treesearch/64503" target="_blank" rel="noreferrer">USDA Forest Service: turkey gobbling and weather research ↗</a></>}
    <p className="field-small">Activity scores are unavailable pending model validation. No animal locations or live wildlife observations are used. Seasonal references remain labeled by species and study region.</p>
  </section>;
}
