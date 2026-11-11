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
