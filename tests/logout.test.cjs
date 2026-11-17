const test=require('node:test');const assert=require('node:assert/strict');
const {completeLogout}=require(process.env.BLINDIQ_TEST_OUTPUT+'/logout.js');
test('worker cleanup timeout cannot block authentication signout',async()=>{let called=false;const result=await completeLogout(()=>new Promise(()=>{}),async()=>{called=true;},{push:15,auth:15});assert.equal(called,true);assert.equal(result.reloadRequired,false);});
test('push cleanup rejection still signs out',async()=>{let called=false;const result=await completeLogout(async()=>{throw Error('worker denied');},async()=>{called=true;},{push:15,auth:15});assert.equal(called,true);assert.equal(result.reloadRequired,false);});
test('auth timeout and rejection require a reload instead of leaving a stuck SDK',async()=>{for(const auth of [()=>new Promise(()=>{}),async()=>{throw Error('offline');}])assert.equal((await completeLogout(async()=>{},auth,{push:15,auth:15})).reloadRequired,true);});
