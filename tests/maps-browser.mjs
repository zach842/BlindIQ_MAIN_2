import {chromium} from 'playwright';import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH,args:['--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:390,height:844},serviceWorkers:'block'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(process.env.BLINDIQ_TEST_URL||'http://127.0.0.1:5182');
await page.getByRole('button',{name:'I already have an account'}).click();await page.getByRole('button',{name:'Log in',exact:true}).click();await page.getByRole('heading',{name:'Hunt. Log. Done.'}).waitFor();
const close=page.getByRole('button',{name:'Close installation instructions'});if(await close.isVisible())await close.click();
await page.evaluate(()=>localStorage.setItem('blindiq-waypoints-v1:demo-user',JSON.stringify([{id:'legacy',name:'Legacy blind',kind:'Blind',lng:-76.817,lat:39.063,createdAt:'2026-11-17T00:00:00Z'}])));
await page.getByRole('button',{name:'Maps',exact:true}).click();await page.getByRole('heading',{name:'Field map',exact:true}).waitFor();await page.locator('.maplibregl-canvas').waitFor();await page.waitForTimeout(3000);
const data=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('blindiq-field-map-v2:demo-user')));
const canvas=page.locator('.maplibregl-canvas');
await canvas.click({position:{x:150,y:210}});await page.getByLabel('Pin name',{exact:true}).fill('Creek stand');await page.getByLabel('Field notes',{exact:true}).fill('Quiet access');await page.getByRole('button',{name:'Save pin',exact:true}).click();await page.getByText('Spot saved on this device.',{exact:true}).waitFor();assert.equal((await data()).pins.length,2);assert.equal((await data()).pins[0].name,'Legacy blind');
await page.getByRole('button',{name:'Move saved spot',exact:true}).click();await canvas.click({position:{x:220,y:260}});await page.getByRole('button',{name:'Save pin',exact:true}).click();assert.equal((await data()).pins.length,2,'moving edits rather than duplicates');
await page.getByRole('button',{name:'Close map panel'}).click();await page.getByRole('button',{name:'Layers',exact:true}).click();await page.getByRole('button',{name:/^Aerial/}).click();assert.equal(await page.getByRole('button',{name:/^Aerial/}).getAttribute('aria-pressed'),'true');
await page.getByLabel('My saved spots',{exact:true}).uncheck();await page.waitForFunction(()=>document.querySelectorAll('.scout-marker').length===0);await page.getByLabel('My saved spots',{exact:true}).check();await page.waitForFunction(()=>document.querySelectorAll('.scout-marker').length===2);await page.getByRole('button',{name:'Close map panel'}).click();
for(const [mode,name,points] of [['Line','Access walk',[[100,190],[260,250]]],['Area','Food plot',[[100,190],[260,240],[150,300]]]]){
 await page.getByRole('button',{name:mode,exact:true}).click();await page.getByRole('button',{name:'Collapse map panel'}).click();for(const [x,y] of points)await canvas.click({position:{x,y}});await page.getByRole('button',{name:'Expand map panel'}).click();await page.getByLabel('Drawing name',{exact:true}).fill(name);await page.getByRole('button',{name:'Save drawing',exact:true}).click();await page.getByText('Drawing saved on this device.',{exact:true}).waitFor();await page.getByRole('button',{name:'Close map panel'}).click();
}
assert.equal((await data()).shapes.length,2);
await page.getByLabel('Find saved spots or coordinates').fill('Creek');await page.getByRole('button',{name:'Search map'}).click();assert.equal(await page.locator('.scout-saved-list>button').count(),1);await page.getByLabel('Find saved spots or coordinates').fill('');await page.getByRole('button',{name:'Close map panel'}).click();
for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'overflow at '+width);assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight>innerHeight+1),false,'workspace scroll at '+width);}
await page.setViewportSize({width:1440,height:1000});await page.getByRole('button',{name:/^My spots/}).click();await page.waitForTimeout(1800);await page.screenshot({path:process.env.MAP_DESKTOP||'/tmp/blindiq-map-desktop.png'});await page.getByRole('button',{name:'Close map panel'}).click();
await page.setViewportSize({width:390,height:844});await page.waitForTimeout(1500);await page.screenshot({path:process.env.MAP_SCREENSHOT||'/tmp/blindiq-map-phone.png'});
await page.getByRole('button',{name:'Backup',exact:true}).click();const downloadEvent=page.waitForEvent('download');await page.getByRole('button',{name:'Export GeoJSON backup'}).click();const download=await downloadEvent;await download.saveAs('/tmp/blindiq-map-export.geojson');
page.once('dialog',d=>d.accept());await page.getByLabel('Import GeoJSON',{exact:true}).setInputFiles('/tmp/blindiq-map-export.geojson');await page.getByText('Backup imported on this device.',{exact:true}).waitFor();assert.equal((await data()).pins.length,4);assert.equal((await data()).shapes.length,4);
await page.getByRole('button',{name:'Backup',exact:true}).click();await page.getByLabel('Import GeoJSON',{exact:true}).setInputFiles({name:'invalid.geojson',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({type:'FeatureCollection',features:[{type:'Feature',geometry:{type:'Point',coordinates:[500,0]}}]}))});await page.getByText(/Only valid Point/).waitFor();assert.equal((await data()).pins.length,4);
await page.getByRole('button',{name:/^My spots/}).click();await page.locator('.scout-saved-list').getByRole('button',{name:/Creek stand/}).first().click();page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Delete saved spot',exact:true}).click();await page.getByText('Saved item deleted.',{exact:true}).waitFor();assert.equal((await data()).pins.length,3);
await page.getByRole('button',{name:'Hunt',exact:true}).click();await page.getByRole('button',{name:'Maps',exact:true}).click();await page.getByRole('heading',{name:'Field map'}).waitFor();assert.equal((await data()).pins.length,3);assert.equal((await data()).shapes.length,4);assert.equal(await page.locator('.scout-live').textContent(),'AERIAL · ONLINE');
assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('blindiq-waypoints-v1:demo-user')).length),1,'legacy backup is retained');
await page.getByRole('button',{name:'Movement Forecast',exact:true}).click();
await page.getByRole('button',{name:'Deer movement',exact:true}).click();
await page.getByLabel('Pilot weather location').selectOption('MD');
await page.getByRole('button',{name:'Refresh local weather'}).click();
await page.waitForFunction(()=>!Array.from(document.querySelectorAll('button')).some(b=>b.textContent==='Loading weather…'),{},{timeout:25000});
console.log('Live weather state:',await page.locator('[role=status]').last().textContent());
await page.screenshot({path:process.env.FORECAST_SCREENSHOT || '/tmp/blindiq-deer-preview.png',fullPage:true});
// Deterministic response tests are separate from the live request above.
await page.route('https://api.weather.gov/**',async route=> {
 const url=route.request().url(); const now=Date.now();
 await route.fulfill({json:url.includes('/points/')?{properties:{forecastHourly:'https://api.weather.gov/gridpoints/TEST/1,1/forecast/hourly'}}:{properties:{updateTime:new Date(now-60000).toISOString(),periods:Array.from({length:6},(_,i)=>({startTime:new Date(now+i*3600000).toISOString(),endTime:new Date(now+(i+1)*3600000).toISOString(),temperature:52+i,temperatureUnit:'F',windSpeed:'5 mph',windDirection:'NW',shortForecast:'Fixture clear',probabilityOfPrecipitation:{value:null}}))}}});
});
await page.getByRole('button',{name:'Refresh local weather'}).click();
await page.locator('.weather-hour').first().waitFor(); assert.equal(await page.locator('.weather-hour').count(),6);
await page.getByRole('button',{name:'Turkey movement',exact:true}).click();
assert.equal(await page.locator('.weather-hour').count(),0,'does not reuse other panel weather');
await page.getByLabel('Pilot weather location').selectOption('SC');
await page.getByRole('button',{name:'Refresh local weather'}).click(); await page.locator('.weather-hour').first().waitFor();
await page.unroute('https://api.weather.gov/**');
await page.route('https://api.weather.gov/**',r=>r.fulfill({status:503,body:'unavailable'}));
await page.getByRole('button',{name:'Refresh local weather'}).click();
await page.getByText(/NWS location service unavailable/).waitFor(); assert.equal(await page.locator('.weather-hour').count(),0,'failed refresh clears previous values');

assert.deepEqual(errors,[]);console.log('PASS map workspace, legacy pins, move/edit, layers, measurement, import/export, validation, persistence, four widths and forecast regression');await browser.close();
