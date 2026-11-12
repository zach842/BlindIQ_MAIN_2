import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {}) });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.goto(process.env.BLINDIQ_TEST_URL || 'http://127.0.0.1:5173/');
await page.getByRole('button', { name: 'I already have an account' }).click();
await page.getByRole('button', { name: 'Log in', exact: true }).click();
await page.getByText('BlindIQ v1.62.1', { exact: true }).waitFor();
if (await page.getByRole('button', { name: 'Close installation instructions' }).isVisible()) {
  await page.getByRole('button', { name: 'Close installation instructions' }).click();
}

await page.locator('#hunt-type').selectOption('deer');
await page.getByRole('button',{name:/START DEER HUNT/}).click();
const buck='Whitetail — Buck'; const doe='Whitetail — Doe';
await page.getByRole('searchbox').fill('Whitetail');
for(let i=0;i<3;i++) await page.getByRole('button',{name:`Saw ${buck}`,exact:true}).click();
await page.getByRole('button',{name:`Remove sighting of ${buck}`,exact:true}).click();
await page.getByRole('button',{name:`Add ${buck}`,exact:true}).click();
await page.getByRole('button',{name:`Saw ${doe}`,exact:true}).click();
for(const width of [320,390,768,1440]) {
 await page.setViewportSize({width,height:844});
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)) throw Error(`Overflow ${width}`);
 const controls=await page.locator('.bird-row').first().locator('.observation-counter').evaluateAll(els=>els.map(el=>({x:el.getBoundingClientRect().x,right:el.getBoundingClientRect().right})));
 if(controls[0].right>controls[1].x) throw Error(`Overlapping counters ${width}`);
}
await page.setViewportSize({width:390,height:844});
await page.waitForTimeout(1700);
await page.screenshot({path:'/tmp/blindiq-saw-harvested.png',fullPage:true});
await page.getByRole('button',{name:/Review & finish hunt/}).click();
if(await page.locator('.summary-total strong').innerText()!=='1') throw Error('Sightings inflated harvest');
await page.getByRole('button',{name:'Save Hunt to Logbook',exact:true}).click();
await page.getByRole('button',{name:'Open Hunt Logbook',exact:true}).waitFor();
let records=await page.evaluate(()=>JSON.parse(localStorage.getItem('blindiq-demo-hunts-v1')));
const b=records[0].entries.find(e=>e.label===buck); const d=records[0].entries.find(e=>e.label===doe);
if(b.saw!==2||b.count!==1||d.saw!==1||d.count!==0) throw Error('Sightings not persisted independently');
const download=page.waitForEvent('download');
await page.getByRole('button',{name:'Download backup',exact:true}).click();
await (await download).saveAs('/private/tmp/blindiq-sightings-share.png');
await page.getByRole('button',{name:'Open Hunt Logbook',exact:true}).click();
await page.reload();
await page.getByText('BlindIQ v1.62.1',{exact:true}).waitFor();
await page.getByRole('button',{name:'Open logbook →'}).click();
if(!(await page.locator('.history-list').innerText()).includes('Saw 2 • Harvested 1')) throw Error('Logbook omitted sightings');
await page.locator('.bottom-nav button').first().click();
await page.locator('#hunt-type').selectOption('waterfowl');
await page.locator('#state').selectOption('SC');
await page.getByRole('button',{name:/START WATERFOWL HUNT/}).click();
for(let i=0;i<7;i++) await page.getByRole('button',{name:'Saw Wood Duck',exact:true}).click();
if(await page.locator('.bag-meter strong').innerText()!=='0/6') throw Error('Sightings altered bag');
await page.getByRole('button',{name:'Add Wood Duck',exact:true}).click();
await page.getByRole('button',{name:'Add Wood Duck',exact:true}).click();
await page.getByRole('button',{name:'Add Wood Duck',exact:true}).click();
if(await page.getByRole('button',{name:'Add Wood Duck',exact:true}).isEnabled()) throw Error('Harvest limit not enforced');
await page.getByRole('button',{name:'Saw Wood Duck',exact:true}).click();
console.log('PASS independent sightings, correction, save/reload, logbook/share, four viewport layouts and waterfowl bag isolation');
if(errors.length) throw Error(errors.join('\n'));
await browser.close();
