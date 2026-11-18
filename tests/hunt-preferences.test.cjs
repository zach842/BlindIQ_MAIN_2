const test=require('node:test');const assert=require('node:assert/strict');const path=require('node:path');
const {parseHuntPreferences,validateHuntPreferences}=require(path.join(process.env.BLINDIQ_TEST_OUTPUT,'huntPreferences.js'));
test('preferences support all 50 states without confusing legacy default state with completed setup',()=>{
 for(const stateCode of ['AK','HI','MD','SC','WY']) {assert.deepEqual(parseHuntPreferences({stateCode,categoryId:'deer'}),{stateCode,categoryId:'deer'});assert.doesNotThrow(()=>validateHuntPreferences(stateCode,'deer'));}
 assert.deepEqual(parseHuntPreferences({stateCode:'SC'}),{stateCode:'SC',categoryId:null});
 assert.deepEqual(parseHuntPreferences(null),{stateCode:'MD',categoryId:null});
 assert.deepEqual(parseHuntPreferences({stateCode:'invalid',categoryId:'mallard'}),{stateCode:'MD',categoryId:null});
 assert.throws(()=>validateHuntPreferences('invalid','deer'));assert.throws(()=>validateHuntPreferences('MD','mallard'));
});
