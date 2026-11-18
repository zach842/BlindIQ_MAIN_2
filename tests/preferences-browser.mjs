import {chromium} from 'playwright';import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});
try {
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(process.env.BLINDIQ_TEST_URL || 'http://127.0.0.1:5182');
 await page.evaluate(()=>localStorage.setItem('blindiq-default-state','SC'));
 await page.getByRole('button',{name:'I already have an account'}).click();await page.getByRole('button',{name:'Log in',exact:true}).click();
 await page.getByRole('heading',{name:'Make it your hunt.'}).waitFor();
 assert.equal(await page.locator('#default-state option').count(),50);assert.equal(await page.locator('#default-category option').count(),10);
 assert.equal(await page.locator('#default-state').inputValue(),'SC','existing default is preserved');
 assert.equal(await page.getByRole('button',{name:'Save & continue',exact:true}).isDisabled(),true,'category requires an explicit choice');
 for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'setup overflow '+width);}
 await page.setViewportSize({width:390,height:844});await page.locator('#default-state').selectOption('AK');await page.locator('#default-category').selectOption('deer');
 await page.screenshot({path:process.env.PREFERENCES_SCREENSHOT || '/tmp/blindiq-preferences.png',fullPage:true});
 await page.evaluate(()=>{window.originalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key.startsWith('blindiq-hunt-preferences'))throw new Error('Test storage denial');return window.originalSet.call(this,key,value);};});
 await page.getByRole('button',{name:'Save & continue',exact:true}).click();await page.getByRole('alert').filter({hasText:'This browser could not save your defaults'}).waitFor();
 await page.getByRole('heading',{name:'Make it your hunt.'}).waitFor();
 await page.evaluate(()=>{Storage.prototype.setItem=window.originalSet;});
 await page.getByRole('button',{name:'Save & continue',exact:true}).click();await page.getByRole('button',{name:'Go Hunt',exact:true}).click();
 assert.equal(await page.locator('#state').inputValue(),'AK');assert.equal(await page.locator('#hunt-category').inputValue(),'deer');
 await page.locator('#state').selectOption('MD');await page.locator('#hunt-category').selectOption('waterfowl');
 await page.reload();await page.getByRole('button',{name:'Go Hunt',exact:true}).waitFor();
 const close=page.getByRole('button',{name:'Close installation instructions'});if(await close.isVisible())await close.click();
 assert.equal(await page.getByRole('heading',{name:'Make it your hunt.'}).count(),0,'setup does not repeat');
 await page.getByRole('button',{name:'Go Hunt',exact:true}).click();assert.equal(await page.locator('#state').inputValue(),'AK');assert.equal(await page.locator('#hunt-category').inputValue(),'deer','one-hunt change does not overwrite defaults');
 await page.getByRole('button',{name:/^Saw /}).first().click();const bird=await page.locator('.bird-row').first().innerText();
 await page.locator('.bottom-nav').getByRole('button',{name:'Account',exact:true}).click();await page.locator('#default-state').selectOption('SC');await page.locator('#default-category').selectOption('turkey');await page.getByRole('button',{name:'Save hunting defaults',exact:true}).click();
 await page.getByText('Hunting defaults saved.',{exact:true}).waitFor();await page.locator('.bottom-nav').getByRole('button',{name:'Home',exact:true}).click();await page.getByRole('button',{name:'Continue hunt',exact:true}).click();
 assert.equal(await page.locator('#state').inputValue(),'AK');assert.equal(await page.locator('#hunt-category').inputValue(),'deer');assert.equal(await page.locator('.bird-row').first().innerText(),bird,'saving defaults preserves active counters');
 await page.getByRole('button',{name:'Save session',exact:true}).click();await page.getByRole('button',{name:'New session',exact:true}).click();assert.equal(await page.locator('#state').inputValue(),'SC');assert.equal(await page.locator('#hunt-category').inputValue(),'turkey','new hunts use changed defaults');
 await page.reload();await page.getByRole('button',{name:'Go Hunt',exact:true}).waitFor();if(await close.isVisible())await close.click();await page.getByRole('button',{name:'Go Hunt',exact:true}).click();assert.equal(await page.locator('#state').inputValue(),'SC');assert.equal(await page.locator('#hunt-category').inputValue(),'turkey');
 assert.deepEqual(errors,[]);console.log('PASS first-time setup, 50 states, explicit category, failed save/retry, persisted defaults, one-hunt overrides, account updates and active-hunt preservation');
} finally {await browser.close();}
