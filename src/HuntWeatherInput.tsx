import { useEffect, useRef, useState } from "react";
import { fetchLocationWeather } from "./locationWeather";

export default function HuntWeatherInput({ value, onChange, disabled, onBusyChange }: { value: string; onChange: (value: string) => void; disabled: boolean; onBusyChange: (busy: boolean) => void }) {
  const request = useRef<AbortController | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  useEffect(() => () => { const controller = request.current; request.current = null; controller?.abort(); onBusyChange(false); }, [onBusyChange]);
  useEffect(() => { if (disabled) { request.current?.abort(); request.current = null; setBusy(false); onBusyChange(false); } }, [disabled, onBusyChange]);

  function cancel() {
    request.current?.abort(); request.current = null; setBusy(false); onBusyChange(false);
  }
  async function useLocation() {
    if (busy || request.current || disabled) return;
    if (!navigator.onLine) { setStatus("Connect to the internet to load weather, or enter conditions manually."); return; }
    if (!window.isSecureContext || !navigator.geolocation) { setStatus("Location is unavailable in this browser. Enter conditions manually."); return; }
    const controller = new AbortController(); request.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 30_000);
    setBusy(true); onBusyChange(true); setStatus("Finding your location and a nearby weather station…");
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        controller.signal.addEventListener("abort", () => reject(new Error("Weather lookup stopped or timed out. Try again or enter conditions manually.")), { once: true });
        navigator.geolocation.getCurrentPosition(resolve, error => reject(new Error(error.code === 1 ? "Location access was denied. Allow location for BlindIQ in your browser settings, or enter conditions manually." : "Your location could not be found. Try again or enter conditions manually.")), { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 });
      });
      if (controller.signal.aborted) return;
      if (!Number.isFinite(position.coords.accuracy) || position.coords.accuracy < 0 || position.coords.accuracy > 10_000 || !Number.isFinite(position.timestamp) || position.timestamp > Date.now() + 60_000 || Date.now() - position.timestamp > 5 * 60_000) throw new Error("Your location is too approximate or out of date. Try again or enter conditions manually.");
      const note = await fetchLocationWeather(position.coords.latitude, position.coords.longitude, controller.signal);
      if (request.current === controller && !controller.signal.aborted) {
        onChange(note);
        setStatus("Nearby-station weather added. Conditions can differ at your hunting spot; you can edit before saving.");
      }
    } catch (error) {
      if (request.current === controller) setStatus(controller.signal.aborted ? "Weather lookup stopped or timed out. Try again or enter conditions manually." : error instanceof Error ? error.message : "Weather could not be loaded. Enter conditions manually.");
    } finally {
      clearTimeout(timeout);
      if (request.current === controller) { request.current = null; setBusy(false); onBusyChange(false); }
    }
  }

  return <>
    <div className="location-weather-actions"><button type="button" disabled={disabled || busy} onClick={() => void useLocation()}>{busy ? "Loading local weather…" : "Use my location"}</button>{busy && <button type="button" onClick={() => { cancel(); setStatus("Lookup cancelled. You can enter weather manually."); }}>Cancel</button>}</div>
    <small>Only when tapped. Approximate location is sent to the National Weather Service; coordinates aren’t saved to your hunt.</small>
    {status && <p className="weather-lookup-status" role="status">{status}</p>}
    <label htmlFor="hunt-weather">Weather conditions<input id="hunt-weather" value={value} maxLength={300} disabled={disabled} onChange={event => { cancel(); setStatus(""); onChange(event.target.value); }} placeholder="42°F, light rain, NW wind 8 mph" /></label>
    <small>Saved with this hunt’s notes. <a href="https://www.weather.gov/documentation/services-web-api" target="_blank" rel="noreferrer">Weather source: NWS ↗</a></small>
  </>;
}
