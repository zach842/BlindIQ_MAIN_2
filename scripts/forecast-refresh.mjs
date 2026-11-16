// Default: live-source dry run, no database writes. Does not touch duck Migration Pulse.
import { readFile } from 'node:fs/promises';
import { fetchNws, makeContext } from '../forecasting/pipeline.mjs';
const args=new Set(process.argv.slice(2));
if([...args].some(arg=>!['--write','--dry-run'].includes(arg)) || args.has('--write')&&args.has('--dry-run')) throw Error('Usage: forecast-refresh.mjs [--dry-run | --write]');
const write=args.has('--write');
const userAgent=process.env.NWS_USER_AGENT;
if(!userAgent) throw Error('Set NWS_USER_AGENT to BlindIQ and a monitored contact address');
let regions=JSON.parse(await readFile(new URL('../forecasting/regions.json',import.meta.url),'utf8'));
let runId;
const key=process.env.SUPABASE_SECRET_KEY;
let base;
if(write){
 if(!process.env.SUPABASE_URL || !key) throw Error('--write requires SUPABASE_URL and server-only SUPABASE_SECRET_KEY');
 const url=new URL(process.env.SUPABASE_URL);
 if(url.protocol!=='https:' && !(['localhost','127.0.0.1'].includes(url.hostname)&&url.protocol==='http:')) throw Error('Invalid Supabase URL');
 base=url.origin+'/rest/v1/';
}
async function db(path,method='GET',body){
 const response=await fetch(base+path,{method,headers:{apikey:key,'Content-Type':'application/json',Prefer:'return=representation'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(15000),redirect:'error'});
 if(!response.ok)throw Error(`Forecast database HTTP ${response.status}; inspect database logs for details`);
 return response.status===204?null:response.json();
}
if(write){
 regions=await db('movement_regions?active=eq.true&select=*&order=id&limit=10');
 if(!regions.length) throw Error('No active forecast pilot regions');
 const runs=await db('movement_source_runs','POST',{source_id:'nws-hourly',status:'running',regions_attempted:regions.length,started_at:new Date().toISOString()});
 runId=runs[0].id;
}
let updated=0;const errors=[];
for(const region of regions){
 try{
  const weather=await fetchNws(region,{userAgent});
  const context=makeContext(region,weather);
  if(write)await db('rpc/movement_ingest_weather','POST',{p_region_id:region.id,p_run_id:runId,p_issued_at:weather.issued_at,p_fetched_at:weather.fetched_at,p_source_url:weather.source_url,p_hash:weather.content_hash,p_periods:weather.periods,p_context:context});
  updated++;
  console.log(JSON.stringify({region:region.id,mode:write?'draft_written':'dry_run',issued_at:weather.issued_at,source_url:weather.source_url,...context}));
 }catch(error){errors.push({region:region.id,message:error instanceof Error?error.message:'Unknown ingestion failure'});}
}
if(write)await db(`movement_source_runs?id=eq.${encodeURIComponent(runId)}`,'PATCH',{status:errors.length?(updated?'partial':'failed'):'success',regions_updated:updated,completed_at:new Date().toISOString(),errors});
console.log(JSON.stringify({attempted:regions.length,updated,errors}));
if(errors.length)process.exitCode=1;
