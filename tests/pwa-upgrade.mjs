import { chromium } from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../',import.meta.url));
const {version}=JSON.parse(await readFile(path.join(root,'package.json'),'utf8'));
const currentWorker=await readFile(path.join(root,'public/sw.js'),'utf8');
const oldWorker=currentWorker.replaceAll(version,'1.62.1');
const legacyHtml=`<!doctype html><h1>Older cached dashboard</h1><script>navigator.serviceWorker.addEventListener('controllerchange',()=>location.reload());navigator.serviceWorker.register('/sw.js?v=1.62.1',{scope:'/',updateViaCache:'none'});</script>`;
let updated=false;
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 res.setHeader('Cache-Control','no-store');
 if(pathname==='/sw.js'){res.setHeader('Content-Type','text/javascript');res.end(updated?currentWorker:oldWorker);return;}
 if(!updated && pathname==='/'){res.setHeader('Content-Type','text/html');res.end(legacyHtml);return;}
 const file=path.resolve(root,'dist','.'+(pathname==='/'?'/index.html':pathname));
 if(!file.startsWith(path.join(root,'dist')+path.sep)){res.writeHead(403);res.end();return;}
 try{res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(await readFile(file));}catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
try{
 const context=await browser.newContext();const page=await context.newPage();
 await page.goto(`http://127.0.0.1:${server.address().port}/`);
 await page.waitForFunction(()=>navigator.serviceWorker.controller?.scriptURL.includes('1.62.1'));
 await page.waitForFunction(async()=>(await caches.keys()).includes('blindiq-offline-v1.62.1'));
 await page.getByRole('heading',{name:'Older cached dashboard'}).waitFor();
 await page.waitForLoadState('load');
 await page.waitForTimeout(300);
 updated=true;
 await page.reload();
 await page.waitForFunction(v=>navigator.serviceWorker.controller?.scriptURL.includes(v),version);
 await page.getByRole('button',{name:'I already have an account'}).waitFor();
 await page.waitForTimeout(300);
 await page.getByRole('button',{name:'I already have an account'}).click();
 await page.getByRole('button',{name:'Log in',exact:true}).click();
 await page.getByRole('heading',{name:'Hunt. Log. Share.'}).waitFor();
 const keys=await page.evaluate(()=>caches.keys());
 assert.ok(keys.includes(`blindiq-offline-v${version}`));assert.ok(!keys.includes('blindiq-offline-v1.62.1'));
 await context.setOffline(true);await page.reload();
 await page.getByRole('heading',{name:'Hunt. Log. Share.'}).waitFor();
 console.log(`PASS installed cache upgrades from v1.62.1 to v${version}; old cache removed; new hub opens offline`);
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
