import {readFile,access,readdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const read=async path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const pkg=JSON.parse(await read('package.json'));
const app=await read('src/App.tsx');
const map=await read('src/MapPage.tsx');
const forecast=await read('src/FieldForecast.tsx');
const entry=await read('src/main.tsx');
const worker=await read('public/sw.js');
assert.ok(app.includes(`BlindIQ v${pkg.version}`),'Displayed version must match package.json');
assert.ok(entry.includes(`/sw.js?v=${pkg.version}`),'Service-worker registration must match package.json');
assert.ok(worker.includes(`blindiq-offline-v${pkg.version}`),'Offline cache must match package.json');
assert.ok(app.includes('Hunt. Log. Share.') && app.includes('id="hunt-category"') && app.includes('Movement Forecast') && !app.includes('import("./MapPage")'),'The built source must contain the redesigned hub and tabs');
const html=await read('dist/index.html');
const bundle=html.match(/src="(\/assets\/[^\"]+\.js)"/);
assert.ok(bundle,'Built index must point to a JavaScript entry');
const js=await read('dist'+bundle[1]);
for(const text of ['Use my location','Make it your hunt.','Save & continue','Default hunting category','Hunt. Log. Share.','Movement Forecast','Your hunt.','Simply logged.',`BlindIQ v${pkg.version}`]) assert.ok(js.includes(text),`Production bundle is missing ${text}`);
const manifest=JSON.parse(await read('dist/manifest.webmanifest'));
for(const icon of manifest.icons){assert.ok(!icon.src.includes('..'));await access(new URL('../dist'+icon.src,import.meta.url));}
const logo=app.match(/<img src="([^\"]+)"/)[1];
assert.ok(logo.includes('blindiq-mark-v1631.svg'),'Selected IQ logo must be used');
await access(new URL('../dist'+logo,import.meta.url));
console.log(`Verified v${pkg.version}: root hub, compiled entry, IQ logo, manifest icons and offline versions agree.`);

assert.ok(map.includes('NOT CONNECTED') && forecast.includes('pending model validation'), 'Preview availability labels must be present');

const assets=await readdir(new URL('../dist/assets/',import.meta.url));
for(const [prefix, text] of [['FieldForecast-', 'pending model validation']]) {
 const file=assets.find(name=>name.startsWith(prefix)&&name.endsWith('.js'));
 assert.ok(file, `Missing lazy module ${prefix}`);
 assert.ok((await read('dist/assets/'+file)).includes(text), `Incomplete lazy module ${prefix}`);
}

assert.ok(!assets.some(name => /MapPage|maplibre|scoutMap/.test(name)), 'Maps renderer must stay out of the production build');
for (const name of assets.filter(name => name.endsWith('.js'))) assert.ok(!(await read('dist/assets/'+name)).includes('maplibregl'), 'MapLibre must not ship');
