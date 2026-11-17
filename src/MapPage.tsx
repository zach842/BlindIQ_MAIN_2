import { useEffect, useRef, useState } from 'react';
import maplibregl, { type StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './fieldMaps.css';

type Pin = { id: string; name: string; kind: string; lng: number; lat: number; createdAt: string };
const kinds = ['Stand', 'Blind', 'Roost', 'Parking', 'Access', 'Other'];
const validPin = (p: Pin) => p && typeof p.id === 'string' && typeof p.name === 'string' && kinds.includes(p.kind) && Number.isFinite(p.lng) && Math.abs(p.lng) <= 180 && Number.isFinite(p.lat) && Math.abs(p.lat) <= 85;
function readPins(key: string): Pin[] { try { const data = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(data) ? data.filter(validPin).slice(0, 200) : []; } catch { return []; } }
const style: StyleSpecification = { version: 8, sources: { topo: { type: 'raster', tiles: ['https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}'], tileSize: 256, maxzoom: 16, attribution: 'USGS The National Map · USGSTopo' } }, layers: [{ id: 'topo', type: 'raster', source: 'topo' }] };
export default function MapPage({ userId }: { userId: string }) {
  const storageKey = `blindiq-waypoints-v1:${userId || 'demo'}`;
  const [pins, setPins] = useState<Pin[]>(() => readPins(storageKey));
  const [name, setName] = useState(''); const [kind, setKind] = useState('Stand');
  const [point, setPoint] = useState<{lng: number; lat: number} | null>(null);
  const [message, setMessage] = useState('Pan and zoom, then tap the map to place a pin.');
  const [mapError, setMapError] = useState(''); const [ready, setReady] = useState(false);
  const container = useRef<HTMLDivElement>(null); const map = useRef<maplibregl.Map | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    let instance: maplibregl.Map;
    try {
      instance = new maplibregl.Map({ container: container.current!, style, center: [-76.65, 39.05], zoom: 8, maxZoom: 18 });
      map.current = instance;
      instance.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
      instance.addControl(new maplibregl.ScaleControl({ unit: 'imperial' }));
      instance.on('load', () => { setReady(true); setMapError(''); });
      instance.on('error', () => setMapError('Some map data could not load. Check your connection; saved pins are still available below.'));
      instance.on('click', e => { setPoint({ lng: e.lngLat.lng, lat: e.lngLat.lat }); setMessage('Location selected. Name your pin and save it.'); });
    } catch { setMapError('Interactive maps are unavailable in this browser. Saved pins are still available below.'); }
    return () => { mounted.current = false; map.current = null; instance?.remove(); };
  }, []);
  useEffect(() => {
    if (!map.current || !ready) return;
    const markers = pins.map(pin => new maplibregl.Marker({ color: '#9b7027' }).setLngLat([pin.lng, pin.lat]).setPopup(new maplibregl.Popup().setText(`${pin.kind}: ${pin.name}`)).addTo(map.current!));
    if (point) markers.push(new maplibregl.Marker({ color: '#244d3e' }).setLngLat([point.lng, point.lat]).addTo(map.current));
    return () => markers.forEach(marker => marker.remove());
  }, [pins, point, ready]);
  function persist(next: Pin[]) { try { localStorage.setItem(storageKey, JSON.stringify(next)); setPins(next); return true; } catch { setMessage('Your device could not save this change. Free storage and try again.'); return false; } }
  function locate() {
    if (!navigator.geolocation) { setMessage('Location is unavailable in this browser. Tap the map instead.'); return; }
    setMessage('Waiting for your location permission…');
    navigator.geolocation.getCurrentPosition(position => {
      if (!mounted.current) return;
      const p = { lng: position.coords.longitude, lat: position.coords.latitude };
      if (Math.abs(p.lat) > 85) { setMessage('This map cannot display your latitude.'); return; }
      setPoint(p); map.current?.flyTo({ center: [p.lng, p.lat], zoom: 14 });
      setMessage(`Device-reported location accuracy: approximately ${Math.ceil(position.coords.accuracy)} m. Name and save a pin if desired.`);
    }, () => { if (mounted.current) setMessage('Location unavailable or permission declined. Tap the map instead.'); }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  }
  return <div className="page field-page"><div className="field-eyebrow">FIELD MAP • PREVIEW</div><h1>Maps & property lines</h1><p>Find your ground. Keep your spots close.</p>
    <div className="field-map-toolbar"><span className="field-chip">USGS Topo</span><button type="button" onClick={locate}>⌖ Use my location</button></div>
    <div className="field-map" ref={container} aria-label="Interactive USGS topographic map" />
    {mapError && <p role="status" className="field-notice">{mapError}</p>}
    <section className="section"><div className="field-eyebrow">YOUR HUNTING SPOTS</div><h2>Drop a pin</h2><p role="status">{message}</p>{point && <p className="field-coordinates">{point.lat.toFixed(5)}, {point.lng.toFixed(5)}</p>}
      <form onSubmit={e => { e.preventDefault(); if (!point || !name.trim()) return; if (pins.length >= 200) { setMessage('This preview supports 200 pins. Delete a pin before adding more.'); return; } if (persist([...pins, { ...point, id: crypto.randomUUID(), name: name.trim().slice(0, 80), kind, createdAt: new Date().toISOString() }])) { setName(''); setPoint(null); setMessage('Pin saved on this device.'); } }}>
        <div className="field-inputs"><label>Pin name<input maxLength={80} required value={name} onChange={e => setName(e.target.value)} placeholder="Creek stand" /></label><label>Type<select value={kind} onChange={e => setKind(e.target.value)}>{kinds.map(k => <option key={k}>{k}</option>)}</select></label></div>
        <button className="primary" disabled={!point || !name.trim()}>Save pin</button>
      </form><p className="field-small">Pins stay in this browser for this account. No cloud sync or offline map downloads yet. Clearing browser data removes pins. Opening the map sends tile requests for the viewed area to USGS.</p>
      {pins.length === 0 ? <p>No saved pins yet.</p> : <ul className="field-pin-list">{pins.map(pin => <li key={pin.id}><button onClick={() => { map.current?.flyTo({ center: [pin.lng, pin.lat], zoom: 15 }); setMessage(`${pin.name}: ${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}`); }}><strong>{pin.name}</strong><span>{pin.kind} · {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}</span></button><button aria-label={`Delete ${pin.name}`} onClick={() => { if (window.confirm(`Delete ${pin.name}?`)) persist(pins.filter(p => p.id !== pin.id)); }}>Delete</button></li>)}</ul>}
    </section>
    <section className="section field-parcels"><span className="field-chip">NOT CONNECTED</span><h2>Property lines & ownership</h2><p>Regrid parcels require a licensed service connection and local accuracy checks. No parcel boundaries or landowner records are displayed in this preview.</p><p className="field-small">Topo lines are terrain features, not property boundaries. A map does not establish permission to hunt.</p></section>
  </div>;
}
