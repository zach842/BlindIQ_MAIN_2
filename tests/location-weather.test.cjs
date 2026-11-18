const test=require('node:test');const assert=require('node:assert/strict');
const {weatherPoint,nearbyWeatherStations,observationWeatherNote,fetchLocationWeather}=require(process.env.BLINDIQ_TEST_OUTPUT+'/locationWeather.js');
const now=Date.parse('2026-11-18T14:30:00Z');
const observation=()=>({properties:{timestamp:'2026-11-18T14:25:00Z',temperature:{value:10,unitCode:'wmoUnit:degC',qualityControl:'V'},windSpeed:{value:16.09344,unitCode:'wmoUnit:km_h-1'},windDirection:{value:315,unitCode:'wmoUnit:degree_(angle)'},textDescription:'Clear'}});
const station=(id,lng,lat)=>({properties:{stationIdentifier:id},geometry:{type:'Point',coordinates:[lng,lat]}});
test('rounds coordinates before sharing; rejects invalid coordinates',()=>{assert.deepEqual(weatherPoint(39.123456,-76.123456),{latitude:39.123,longitude:-76.123});for(const p of [[NaN,0],[91,0],[0,181]])assert.throws(()=>weatherPoint(...p));});
test('selects nearby stations in distance order and rejects invalid or distant entries',()=>{
 const result=nearbyWeatherStations({features:[station('FAR',-80,45),station('B',-76,39.2),station('A',-76,39.01),station('A',-76,39.01),station('../bad',-76,39),station('BAD',999,39)]},39,-76);assert.deepEqual(result.map(s=>s.id),['A','B']);assert.deepEqual(nearbyWeatherStations({},39,-76),[]);
});
test('formats observations with units, time, station distance and wind; preserves calm zero',()=>{
 const result=observationWeatherNote(observation(),{id:'KBWI',distanceKm:16.09344},now);assert.match(result,/50°F.*NW 10 mph wind.*NWS KBWI, 10 mi away.*2026-11-18 14:25 UTC/);
 const f=observation();f.properties.windSpeed.value=0;assert.match(observationWeatherNote(f,{id:'KBWI',distanceKm:1},now),/Calm wind/);
});
test('rejects stale, future, missing and quality-rejected readings without inventing zero',()=>{
 for(const timestamp of ['bad','2026-11-18T10:00:00Z','2026-11-18T15:00:00Z']) {const f=observation();f.properties.timestamp=timestamp;assert.throws(()=>observationWeatherNote(f,{id:'KBWI',distanceKm:1},now));}
 for(const temperature of [{value:null,unitCode:'wmoUnit:degC'},{value:1,unitCode:'unknown'},{value:10,unitCode:'wmoUnit:degC',qualityControl:'X'}]){const f=observation();f.properties.temperature=temperature;assert.throws(()=>observationWeatherNote(f,{id:'KBWI',distanceKm:1},now));}
 const f=observation();f.properties.windSpeed.value=null;const note=observationWeatherNote(f,{id:'KBWI',distanceKm:1},now);assert.ok(!note.includes('mph')&&!note.includes('Calm'));
 assert.throws(()=>observationWeatherNote(observation(),{id:'KBWI',distanceKm:100},now));
});
test('fetches only NWS endpoints with reduced coordinate precision and uses a fresh fallback station',async()=>{
 const original=global.fetch;const urls=[];try{
 global.fetch=async(url)=>{urls.push(url);const f=observation();f.properties.timestamp=new Date().toISOString();if(url.includes('/points/'))return{ok:true,json:async()=>({properties:{observationStations:'https://api.weather.gov/gridpoints/LWX/1,2/stations'}})};if(url.endsWith('/stations'))return{ok:true,json:async()=>({features:[station('A',-76,39),station('B',-76,39.01)]})};if(url.includes('/A/'))f.properties.timestamp='2000-01-01T00:00:00Z';return{ok:true,json:async()=>f};};
 const note=await fetchLocationWeather(39.000123,-76.000456,new AbortController().signal);assert.match(note,/NWS B,/);assert.equal(urls[0],'https://api.weather.gov/points/39,-76');assert.ok(urls.every(url=>url.startsWith('https://api.weather.gov/')));
 global.fetch=async()=>({ok:true,json:async()=>({properties:{observationStations:'https://untrusted.example/stations'}})});await assert.rejects(fetchLocationWeather(39,-76,new AbortController().signal),/invalid station link/);
 }finally{global.fetch=original;}
});
