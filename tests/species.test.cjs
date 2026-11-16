const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { huntCategories, huntCategoryById } = require(path.join(process.env.BLINDIQ_TEST_OUTPUT, 'gameCatalog.js'));
const { huntingLocations } = require(path.join(process.env.BLINDIQ_TEST_OUTPUT, 'huntingLocations.js'));
test('field-log species have stable unique category-scoped IDs and no legal allowance', () => {
 const ids = new Set();
 for(const category of huntCategories.filter(c=>c.id!=='waterfowl')) {
  assert.equal(category.rulesMode,'field-log');
  for(const species of category.species) {
   assert.equal(ids.has(species.id),false); ids.add(species.id);
   assert.equal(species.huntCategory,category.id);
   assert.equal(species.limit,0);
   assert.match(species.note,/not loaded/);
  }
 }
});
test('sika and Sitka deer remain distinct; requested elk and squirrel choices exist',()=>{
 const deer=huntCategoryById('deer').species;
 for(const id of ['whitetail-buck','sitka-buck','sika-stag']) assert.ok(deer.some(s=>s.id===`deer-${id}`));
 assert.ok(huntCategoryById('big-game').species.some(s=>s.id==='big-game-elk-bull'));
 assert.ok(huntCategoryById('small-game').species.some(s=>s.id==='small-game-gray-squirrel'));
});
test('field logging supports 50 unique states including Alaska independently of waterfowl coverage',()=>{
 assert.equal(huntingLocations.length,50);
 assert.equal(new Set(huntingLocations.map(s=>s.code)).size,50);
 assert.ok(huntingLocations.some(s=>s.code==='AK'));
 for(const state of huntingLocations) assert.equal(new URL(state.agencyUrl).protocol,'https:');
});
test('unknown legacy category lookup retains waterfowl fallback',()=>{
 assert.equal(huntCategoryById(undefined).id,'waterfowl');
});
const { buildSessionEntries, changeSightings } = require(path.join(process.env.BLINDIQ_TEST_OUTPUT, 'sessionEntries.js'));
test('sighting-only species are saved with zero harvest and independent counts',()=>{
 const species=huntCategoryById('deer').species;
 const id=species[0].id;
 const entries=buildSessionEntries(species,{}, {[id]:3});
 assert.equal(entries.length,1); assert.equal(entries[0].count,0); assert.equal(entries[0].saw,3);
 assert.equal(entries.reduce((sum,e)=>sum+e.count,0),0);
 assert.equal(buildSessionEntries(species,{[id]:1},{[id]:3})[0].saw,3);
});
test('sighting corrections clamp at zero and do not mutate previous counts',()=>{
 const before={deer:1}; const after=changeSightings(before,'deer',-1);
 assert.equal(before.deer,1); assert.equal(after.deer,0);
 assert.equal(changeSightings(after,'deer',-1).deer,0);
 assert.equal(changeSightings(after,'deer',1).deer,1);
});
const { categorySpecies } = require(path.join(process.env.BLINDIQ_TEST_OUTPUT, 'categorySpecies.js'));
test('Waterfowl category shows the entire state bird list',()=>{
 const birds=[{id:'mallard',label:'Mallard',group:'Ducks',limit:6},{id:'goose',label:'Goose',group:'Geese',limit:5}];
 assert.deepEqual(categorySpecies('waterfowl','MD',birds),birds);
});
test('Maryland deer groups whitetail and sika, without western deer',()=>{
 const ids=categorySpecies('deer','MD',[]).map(s=>s.id);
 assert.deepEqual(ids,['deer-whitetail-buck','deer-whitetail-doe','deer-sika-stag','deer-sika-hind','deer-other']);
});
test('Alaska and Hawaii deer catalogs do not inherit mainland whitetail rows',()=>{
 const ak=categorySpecies('deer','AK',[]).map(s=>s.id);
 assert.deepEqual(ak,['deer-sitka-buck','deer-sitka-doe','deer-other']);
 const hi=categorySpecies('deer','HI',[]).map(s=>s.id);
 assert.ok(hi.includes('deer-axis-buck'));assert.ok(hi.includes('deer-blacktail-buck'));assert.ok(!hi.includes('deer-whitetail-buck'));
});
test('Other categories retain their complete existing catalogs',()=>{
 for(const category of huntCategories.filter(c=>!['waterfowl','deer'].includes(c.id))) assert.deepEqual(categorySpecies(category.id,'MD',[]),category.species);
});
