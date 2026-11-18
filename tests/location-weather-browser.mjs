import {chromium} from 'playwright';import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});
try{
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});const page=await context.newPage();const errors=[];const urls=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  localStorage.setItem('blindiq-hunt-preferences-v1:demo-user',JSON.stringify({stateCode:'MD',categoryId:'waterfowl'}));
  window.geoCalls=0;window.geoMode='good';
  Object.defineProperty(navigator,'geolocation',{value:{getCurrentPosition(success,failure){window.geoCalls++;const position={coords:{latitude:39.123456,longitude:-76.123456,accuracy:15},timestamp:Date.now()};window.lateLocation=()=>success(position);if(window.geoMode==='denied')failure({code:1});else if(window.geoMode!=='late')success(position);}}});
 });
 let unavailable=false;
 await page.route('https://api.weather.gov/**',async route=>{
  const url=route.request().url();urls.push(url);if(unavailable){await route.fulfill({status:503,body:'Unavailable'});return;}
  const body=url.includes('/points/')?{properties:{observationStations:'https://api.weather.gov/gridpoints/LWX/1,2/stations'}}:url.endsWith('/stations')?{features:[{properties:{stationIdentifier:'KTEST'},geometry:{type:'Point',coordinates:[-76.12,39.12]}}]}:{properties:{timestamp:new Date(Date.now()-10*60_000).toISOString(),temperature:{value:10,unitCode:'wmoUnit:degC',qualityControl:'V'},textDescription:'Clear',windSpeed:{value:16.09344,unitCode:'wmoUnit:km_h-1'},windDirection:{value:315,unitCode:'wmoUnit:degree_(angle)'}}};
  await route.fulfill({status:200,contentType:'application/geo+json',body:JSON.stringify(body)});
 });
 await page.goto(process.env.BLINDIQ_TEST_URL||'http://127.0.0.1:5182');await page.getByRole('button',{name:'I already have an account'}).click();await page.getByRole('button',{name:'Log in',exact:true}).click();await page.getByRole('button',{name:'Go Hunt',exact:true}).waitFor();
 const close=page.getByRole('button',{name:'Close installation instructions'});if(await close.isVisible())await close.click();await page.getByRole('button',{name:'Go Hunt',exact:true}).click();await page.getByRole('button',{name:'Add weather',exact:true}).click();
 assert.equal(await page.evaluate(()=>window.geoCalls),0,'opening weather never prompts for location');assert.equal(urls.length,0);
 await page.locator('#hunt-weather').fill('My manual conditions');await page.evaluate(()=>window.geoMode='denied');await page.getByRole('button',{name:'Use my location',exact:true}).click();await page.getByRole('status').filter({hasText:'Location access was denied'}).waitFor();assert.equal(await page.locator('#hunt-weather').inputValue(),'My manual conditions');
 await page.evaluate(()=>window.geoMode='good');await page.getByRole('button',{name:'Use my location',exact:true}).click();await page.getByRole('status').filter({hasText:'Nearby-station weather added.'}).waitFor();
 let value=await page.locator('#hunt-weather').inputValue();assert.match(value,/50°F.*NW 10 mph wind.*NWS KTEST.*observed .* UTC/);assert.ok(urls[0].endsWith('/points/39.123,-76.123'));
 unavailable=true;await page.getByRole('button',{name:'Use my location',exact:true}).click();await page.getByRole('status').filter({hasText:'The weather service is unavailable'}).waitFor();assert.equal(await page.locator('#hunt-weather').inputValue(),value,'provider failure preserves prior reading');unavailable=false;
 await context.setOffline(true);await page.getByRole('button',{name:'Use my location',exact:true}).click();await page.getByRole('status').filter({hasText:'Connect to the internet'}).waitFor();assert.equal(await page.locator('#hunt-weather').inputValue(),value);await context.setOffline(false);await page.waitForFunction(()=>navigator.onLine);
 await page.evaluate(()=>window.geoMode='late');await page.getByRole('button',{name:'Use my location',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Save session',exact:true}).isDisabled(),true,'save waits for weather lookup');const requestCount=urls.length;
 await page.getByRole('button',{name:'Cancel',exact:true}).click();await page.evaluate(()=>window.lateLocation());await page.waitForTimeout(100);assert.equal(urls.length,requestCount);assert.equal(await page.locator('#hunt-weather').inputValue(),value);assert.equal(await page.getByRole('button',{name:'Save session',exact:true}).isEnabled(),true);
 await page.getByRole('button',{name:'Use my location',exact:true}).click();await page.locator('#state').selectOption('SC');await page.evaluate(()=>window.lateLocation());await page.getByRole('button',{name:'Add weather',exact:true}).click();assert.equal(await page.locator('#hunt-weather').inputValue(),'','reset rejects late weather from previous session');
 await page.evaluate(()=>window.geoMode='good');await page.getByRole('button',{name:'Use my location',exact:true}).click();await page.getByRole('status').filter({hasText:'Nearby-station weather added.'}).waitFor();value=await page.locator('#hunt-weather').inputValue();
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'weather overflow '+width);}
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{document.activeElement?.blur();scrollTo(0,0);});await page.screenshot({path:process.env.WEATHER_SCREENSHOT||'/tmp/blindiq-location-weather.png',fullPage:false});
 await page.getByRole('button',{name:'Saw Wood Duck',exact:true}).click();await page.getByRole('button',{name:'Save session',exact:true}).click();await page.getByRole('button',{name:'New session',exact:true}).waitFor();
 const notes=await page.evaluate(()=>JSON.parse(localStorage.getItem('blindiq-demo-hunts-v1'))[0].notes);assert.equal(notes,'Weather: '+value);assert.ok(!notes.includes('39.123')&&!notes.includes('-76.123'),'no coordinates saved');assert.deepEqual(errors,[]);
 console.log('PASS explicit-only geolocation, NWS units/time/source, reduced precision, permission denial, provider/offline fallback, cancel, blocked save, session reset, four widths and saved weather without coordinates');
}finally{await browser.close();}
