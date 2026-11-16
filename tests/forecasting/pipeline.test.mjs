import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeNws,windKph,fetchNws,makeContext} from '../../forecasting/pipeline.mjs';
const now=new Date('2026-11-16T12:30:00Z');
const fixture=()=>({properties:{updateTime:'2026-11-16T12:00:00Z',periods:Array.from({length:24},(_,i)=>({startTime:new Date(Date.UTC(2026,10,16,12+i)).toISOString(),endTime:new Date(Date.UTC(2026,10,16,13+i)).toISOString(),temperature:50,temperatureUnit:'F',windSpeed:'5 to 10 mph',probabilityOfPrecipitation:{value:20}}))}});
test('NWS unit normalization preserves forecast timing and null unknowns',()=>{
 const raw=fixture();raw.properties.periods[0].temperatureUnit='K';raw.properties.periods[1].probabilityOfPrecipitation.value=null;
 const value=normalizeNws(raw,now);
 assert.equal(value.periods[0].temperature_c,null);assert.equal(value.periods[2].temperature_c,10);
 assert.equal(value.periods[1].precipitation_probability,null);assert.equal(value.periods[2].wind_kph,12.07);
 assert.deepEqual(value.missing_fields,['temperature_c','precipitation_probability']);
 assert.equal(windKph('Calm'),null);assert.equal(windKph('10 m/s'),36);
});
test('stale and future issue dates never become fresh inputs',()=>{
 for(const date of ['2026-11-15T00:00:00Z','2026-11-17T00:00:00Z',null]){const raw=fixture();raw.properties.updateTime=date;assert.throws(()=>normalizeNws(raw,now));}
});
test('duplicate, missing and short hourly coverage fail closed',()=>{
 const duplicate=fixture();duplicate.properties.periods[1]=duplicate.properties.periods[0];assert.throws(()=>normalizeNws(duplicate,now));
 const gap=fixture();gap.properties.periods.splice(2,1);assert.throws(()=>normalizeNws(gap,now));
 const short=fixture();short.properties.periods=short.properties.periods.slice(0,5);assert.throws(()=>normalizeNws(short,now));
});
test('retry of the same source issue has stable content identity',()=>{
 assert.equal(normalizeNws(fixture(),now).content_hash,normalizeNws(fixture(),new Date('2026-11-16T12:45:00Z')).content_hash);
});
test('NWS response cannot redirect the worker to another host',async()=>{
 await assert.rejects(fetchNws({latitude:38,longitude:-76},{userAgent:'BlindIQ test',fetchImpl:async()=>Response.json({properties:{forecastHourly:'http://127.0.0.1/private'}})}),/official NWS/);
});
test('transient upstream errors retry and permanent errors stop',async()=>{
 let calls=0;const waits=[];
 const value=await fetchNws({latitude:38,longitude:-76},{userAgent:'BlindIQ test',now:()=>now,sleep:async ms=>waits.push(ms),fetchImpl:async()=>{calls++;if(calls===1)return new Response('',{status:503});if(calls===2)return Response.json({properties:{forecastHourly:'https://api.weather.gov/gridpoints/LWX/1,1/forecast/hourly'}});return Response.json(fixture());}});
 assert.equal(calls,3);assert.equal(waits.length,1);assert.equal(value.periods.length,24);
 calls=0;await assert.rejects(fetchNws({latitude:38,longitude:-76},{userAgent:'BlindIQ test',fetchImpl:async()=>{calls++;return new Response('',{status:404});}}));assert.equal(calls,1);
});
test('weather coverage is never emitted as animal activity confidence',()=>{
 const value=makeContext({taxon:'wild-turkey',timezone:'America/New_York',scope_note:'pilot'},normalizeNws(fixture(),now));
 assert.equal(value.activity_score,null);assert.equal(value.animal_observations_available,false);assert.equal(value.validation_status,'context_only');assert.equal('confidence' in value,false);
});
