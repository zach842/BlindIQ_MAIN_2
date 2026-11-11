import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {}) });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.goto(process.env.BLINDIQ_TEST_URL || 'http://127.0.0.1:5173/');
await page.getByRole('button', { name: 'I already have an account' }).click();
await page.getByRole('button', { name: 'Log in', exact: true }).click();
await page.getByText('BlindIQ v1.62.0', { exact: true }).waitFor();
if (await page.getByRole('button', { name: 'Close installation instructions' }).isVisible()) {
  await page.getByRole('button', { name: 'Close installation instructions' }).click();
}
const categories = [
 ['deer','Deer','Whitetail — Buck','AK'],
 ['big-game','Big Game','Elk — Bull','ID'],
 ['small-game','Small Game','Gray Squirrel','SC'],
 ['turkey','Turkey','Wild Turkey — Tom','MD'],
 ['dove-migratory','Dove & Migratory','Mourning Dove','TX'],
 ['upland-birds','Upland Birds','Ring-necked Pheasant — Rooster','IA'],
 ['predator-furbearer','Predators','Coyote','WY'],
 ['other-game','Other Game','Other Legal Game','CO']
];
for (const [id,label,species,state] of categories) {
 await page.locator('#hunt-type').selectOption(id);
 await page.locator('#state').selectOption(state);
 await page.getByRole('button',{name:new RegExp(`START ${label.toUpperCase()} HUNT`)}).click();
 if (await page.locator('.bag-meter').count()) throw Error('Waterfowl meter leaked');
 if (await page.getByText(/999|Infinity/).count()) throw Error('Placeholder cap exposed');
 await page.getByRole('searchbox').fill(species);
 await page.getByRole('button',{name:`Add ${species}`,exact:true}).click();
 await page.getByRole('button',{name:`Add ${species}`,exact:true}).click();
 await page.getByRole('button',{name:`Remove ${species}`,exact:true}).click();
 await page.locator('.hunt-header > button').first().click();
 if (!(await page.locator('#hunt-type').isDisabled())) throw Error('Active session can be overwritten');
 await page.getByRole('button',{name:/RESUME SESSION/}).click();
 if(await page.locator('.bird-row').filter({has:page.getByRole('button',{name:`Add ${species}`,exact:true})}).locator('.count').innerText()!=='1') throw Error('Paused session lost counts');
 await page.locator('.hunt-location input').fill('North stand / Unit 12');
 for(const width of [320,390,768,1440]) {
  await page.setViewportSize({width,height:844});
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)) throw Error(`Overflow ${id} ${width}`);
 }
 await page.setViewportSize({width:390,height:844});
 if(id==='deer') await page.screenshot({path:'/tmp/blindiq-deer-preview.png',fullPage:true});
 await page.getByRole('button',{name:/Review & finish hunt/}).click();
 if(await page.locator('.summary-total strong').innerText()!=='1') throw Error('Wrong summary count');
 await page.getByLabel('BLIND / STAND / LOCATION').fill('Morning session');
 await page.getByRole('button',{name:'Save Hunt to Logbook',exact:true}).click();
 await page.getByRole('button',{name:'Open Hunt Logbook',exact:true}).waitFor();
 const saved = await page.evaluate(()=>JSON.parse(localStorage.getItem('blindiq-demo-hunts-v1')));
 if(saved[0].huntCategory!==id || saved[0].stateCode!==state || saved[0].zone!=='North stand / Unit 12' || saved[0].entries[0].count!==1) throw Error(`Bad saved ${id}`);
 await page.getByRole('button',{name:'Open Hunt Logbook',exact:true}).click();
 await page.locator('.history-filter select').selectOption(id);
 if(await page.locator('.history-list article').count()!==1) throw Error('History filter mismatch');
 await page.reload();
 await page.getByText('BlindIQ v1.62.0',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Open logbook →'}).click();
 await page.locator('.history-filter select').selectOption(id);
 if(await page.locator('.history-list article').count()!==1) throw Error('Reload lost record');
 await page.locator('.bottom-nav button').first().click();
 console.log('PASS save/reload/filter/resume',id);
}
await page.locator('#hunt-type').selectOption('deer');
await page.locator('#state').selectOption('MD');
for(const width of [390,1440]) {
 await page.setViewportSize({width,height:900});
 await page.evaluate(()=>scrollTo(0,0));
 await page.screenshot({path:`/tmp/blindiq-v162-home-${width}.png`,fullPage:true});
}
await page.getByRole('button',{name:/TEST THE LOGGER/}).click();
await page.getByRole('searchbox').fill('Sika');
if(await page.getByRole('button',{name:'Add Sika Deer — Stag',exact:true}).count()!==1) throw Error('Sika missing');
await page.getByRole('button',{name:/Review & finish hunt/}).click();
await page.getByRole('button',{name:'Save Test Hunt to Logbook',exact:true}).click();
await page.getByRole('button',{name:'Open Hunt Logbook',exact:true}).waitFor();
const download = page.waitForEvent('download');
await page.getByRole('button',{name:'Download backup',exact:true}).click();
await (await download).saveAs('/private/tmp/blindiq-v162-share.png');
await page.getByRole('button',{name:'Open Hunt Logbook',exact:true}).click();
const practice=await page.evaluate(()=>JSON.parse(localStorage.getItem('blindiq-demo-hunts-v1'))[0]);
if(!practice.isSimulation || practice.entries.length!==0 || practice.huntCategory!=='deer') throw Error('Zero harvest practice failed');
console.log('PASS zero-harvest practice, sika selector and downloadable share card');
if(errors.length) throw Error(errors.join('\n'));
await browser.close();
