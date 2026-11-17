import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});
const page=await browser.newPage({viewport:{width:390,height:844},serviceWorkers:'block'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(process.env.BLINDIQ_TEST_URL || 'http://127.0.0.1:5178');
await page.getByRole('heading',{name:'Your hunt. Simply logged.'}).waitFor();
for(const width of [320,375,390,768,1024,1440]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'landing overflow '+width);}
assert.equal(await page.locator('.landing-example input,.landing-example button').count(),0,'example cannot log a real hunt');
assert.equal(await page.evaluate(()=>localStorage.getItem('blindiq-demo-hunts-v1')),null);
await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:process.env.LANDING_DESKTOP || '/tmp/blindiq-landing-desktop.png',fullPage:true});
await page.setViewportSize({width:390,height:844});await page.screenshot({path:process.env.LANDING_MOBILE || '/tmp/blindiq-landing-mobile.png',fullPage:true});
await page.getByRole('button',{name:'Start my 7-day free trial'}).click();await page.getByRole('heading',{name:'Start your hunting logbook'}).waitFor();
await page.getByRole('button',{name:'← Back',exact:true}).click();await page.getByRole('button',{name:'Log in',exact:true}).click();await page.getByRole('heading',{name:'Welcome back'}).waitFor();
await page.getByRole('button',{name:'← Back',exact:true}).click();await page.getByRole('button',{name:'I already have an account'}).click();await page.getByRole('heading',{name:'Welcome back'}).waitFor();assert.deepEqual(errors,[]);
console.log('PASS landing six viewport widths, explicit illustration/no saved data, signup, header login, returning-user login');await browser.close();
