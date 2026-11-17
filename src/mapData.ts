export type Coordinate = [number, number]; // longitude, latitude
export type MapPin = { id: string; name: string; kind: string; lng: number; lat: number; createdAt: string; notes?: string };
export type MapShape = { id: string; name: string; type: 'line' | 'area'; coordinates: Coordinate[]; notes?: string; createdAt: string };
export type MapDocument = { version: 2; pins: MapPin[]; shapes: MapShape[] };
export const pinKinds = ['Stand', 'Blind', 'Roost', 'Parking', 'Access', 'Other'];
export const validCoordinate = (p: unknown): p is Coordinate => Array.isArray(p) && p.length === 2 && p.every(n=>typeof n==='number' && Number.isFinite(n)) && Math.abs(p[0])<=180 && Math.abs(p[1])<=85;
export function validPin(p: unknown): p is MapPin { const v=p as MapPin; return !!v && typeof v.id==='string' && typeof v.name==='string' && v.name.length<=80 && pinKinds.includes(v.kind) && (v.notes===undefined || (typeof v.notes==='string' && v.notes.length<=1000)) && validCoordinate([v.lng,v.lat]); }
function isSimpleArea(points: Coordinate[]) {
  function orient(a:Coordinate,b:Coordinate,c:Coordinate){return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);}
  let twiceArea=0;for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];twiceArea+=a[0]*b[1]-b[0]*a[1];}
  if(Math.abs(twiceArea)<1e-12)return false;
  for(let i=0;i<points.length;i++)for(let j=i+2;j<points.length;j++){if(i===0&&j===points.length-1)continue;const a=points[i],b=points[(i+1)%points.length],c=points[j],d=points[(j+1)%points.length];if(orient(a,b,c)*orient(a,b,d)<=0&&orient(c,d,a)*orient(c,d,b)<=0&&Math.max(Math.min(a[0],b[0]),Math.min(c[0],d[0]))<=Math.min(Math.max(a[0],b[0]),Math.max(c[0],d[0]))&&Math.max(Math.min(a[1],b[1]),Math.min(c[1],d[1]))<=Math.min(Math.max(a[1],b[1]),Math.max(c[1],d[1])))return false;}
  return true;
}
export function validShape(p: unknown): p is MapShape { const s=p as MapShape; return !!s && typeof s.id==='string' && typeof s.name==='string' && s.name.length<=80 && (s.notes===undefined || (typeof s.notes==='string' && s.notes.length<=1000)) && (s.type==='line'||s.type==='area') && Array.isArray(s.coordinates) && s.coordinates.length >= (s.type==='line'?2:3) && s.coordinates.length<=500 && s.coordinates.every(validCoordinate) && (s.type==='line'?new Set(s.coordinates.map(p=>p.join(","))).size>=2:new Set(s.coordinates.map(p=>p.join(","))).size===s.coordinates.length) && Math.max(...s.coordinates.map(p=>p[0]))-Math.min(...s.coordinates.map(p=>p[0]))<=180 && (s.type!=="area" || isSimpleArea(s.coordinates)); }
export function readMapDocument(storage: Pick<Storage,'getItem'>, userId: string): MapDocument {
  const stored=storage.getItem(`blindiq-field-map-v2:${userId || 'demo'}`);
  if(stored) { const value=JSON.parse(stored); if(value.version!==2 || !Array.isArray(value.pins) || !Array.isArray(value.shapes) || value.pins.length>200 || value.shapes.length>100 || !value.pins.every(validPin) || !value.shapes.every(validShape)) throw Error('Invalid saved map data'); return {version:2,pins:value.pins,shapes:value.shapes}; }
  const old=JSON.parse(storage.getItem(`blindiq-waypoints-v1:${userId || 'demo'}`)||'[]');
  if(!Array.isArray(old)||!old.every(validPin)||old.length>200)throw Error('Invalid legacy spot data');
  return {version:2,pins:old,shapes:[]};
}
export function parseCoordinates(text: string): Coordinate | null { const parts=text.trim().split(',').map(x=>x.trim()); if(parts.length!==2 || parts.some(x=>!x || !/^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(x))) return null; const [lat,lng]=parts.map(Number); return validCoordinate([lng,lat]) ? [lng,lat] : null; }
const R=6371008.8, rad=Math.PI/180;
function delta(a:number,b:number){return ((b-a+540)%360)-180;}
export function distanceMeters(points: Coordinate[]) { let total=0; for(let i=1;i<points.length;i++){const [a,b]=[points[i-1],points[i]];const h=Math.sin((b[1]-a[1])*rad/2)**2+Math.cos(a[1]*rad)*Math.cos(b[1]*rad)*Math.sin(delta(a[0],b[0])*rad/2)**2;total+=2*R*Math.asin(Math.sqrt(Math.min(1,h)));}return total; }
export function areaSqMeters(points: Coordinate[]) { if(points.length<3)return 0;let sum=0;for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];sum+=delta(a[0],b[0])*rad*(2+Math.sin(a[1]*rad)+Math.sin(b[1]*rad));}return Math.abs(sum*R*R/2); }
export function formatDistance(m:number){return m<1609.344?`${Math.round(m/0.9144)} yd`:`${(m/1609.344).toFixed(2)} mi`;}
export function formatArea(m:number){return `${(m/4046.8564224).toFixed(2)} acres`;}
export function exportMapData(doc: MapDocument) { return {type:'FeatureCollection',features:[...doc.pins.map(p=>({type:'Feature',geometry:{type:'Point',coordinates:[p.lng,p.lat]},properties:{name:p.name,kind:p.kind,notes:p.notes||'',createdAt:p.createdAt}})),...doc.shapes.map(s=>({type:'Feature',geometry:s.type==='line'?{type:'LineString',coordinates:s.coordinates}:{type:'Polygon',coordinates:[[...s.coordinates,s.coordinates[0]]]},properties:{name:s.name,notes:s.notes||'',createdAt:s.createdAt}}))]}; }
export function importMapData(value: unknown, id:()=>string=()=>crypto.randomUUID()): MapDocument {
 const root=value as {type?:string;features?:unknown[]}; if(root?.type!=='FeatureCollection'||!Array.isArray(root.features)||root.features.length>300) throw Error('Choose a GeoJSON FeatureCollection with at most 300 features.');
 const result: MapDocument={version:2,pins:[],shapes:[]};
 for(const item of root.features){ const f=item as {geometry?:{type?:string;coordinates?:unknown};properties?:Record<string,unknown>};const g=f?.geometry,p=f?.properties||{};const name=typeof p.name==='string'?p.name.trim().slice(0,80):'Imported spot';const notes=typeof p.notes==='string'?p.notes.slice(0,1000):'';const createdAt=typeof p.createdAt==='string'&&Number.isFinite(Date.parse(p.createdAt))?new Date(p.createdAt).toISOString():new Date().toISOString();
  if(g?.type==='Point'&&validCoordinate(g.coordinates)){result.pins.push({id:id(),name:name||'Imported spot',kind:typeof p.kind==='string'&&pinKinds.includes(p.kind)?p.kind:'Other',lng:g.coordinates[0],lat:g.coordinates[1],notes,createdAt});}
  else if(g?.type==='LineString'||g?.type==='Polygon') { let coords=g.type==='Polygon'&&Array.isArray(g.coordinates)?g.coordinates[0]:g.coordinates;
    if(g.type==='Polygon'&&Array.isArray(g.coordinates)&&g.coordinates.length!==1)throw Error('Polygon holes are not supported. Import a simple area.');
    if(!Array.isArray(coords))throw Error('Invalid geometry.');coords=[...coords];if(g.type==='Polygon'&&coords.length>1&&JSON.stringify(coords[0])===JSON.stringify(coords.at(-1)))coords.pop();
    const shape={id:id(),name:name||'Imported drawing',notes,createdAt,type:g.type==='Polygon'?'area' as const:'line' as const,coordinates:coords as Coordinate[]};if(!validShape(shape))throw Error('Invalid or oversized drawing coordinates.');result.shapes.push(shape);
  }else throw Error('Only valid Point, LineString and simple Polygon features are supported. Coordinates must be longitude/latitude.');
 }
 if(result.pins.length>200||result.shapes.length>100)throw Error('Limit: 200 spots and 100 drawings.');return result;
}
