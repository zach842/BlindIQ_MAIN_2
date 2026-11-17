// Local TypeScript compatibility check. This does not run a deployed Deno worker.
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {resolve,join} from 'node:path';import {spawnSync} from 'node:child_process';
const dir=mkdtempSync(resolve('tests/.notification-types-'));
try {
 let code=readFileSync('supabase/functions/notification-process/index.ts','utf8').replace('"npm:@supabase/supabase-js@2.57.4"','"@supabase/supabase-js"').replace('"../_shared/webpush.ts"','"./webpush"').replace('"../_shared/notification-policy.ts"','"../../supabase/functions/_shared/notification-policy"');
 code='declare const Deno: {env: {get(name:string):string|undefined};serve(handler:(request:Request)=>Promise<Response>):void};\n'+code;
 writeFileSync(join(dir,'index.ts'),code);writeFileSync(join(dir,'webpush.d.ts'),'export declare function sendWebPush(device:unknown,payload:unknown):Promise<unknown>;export declare function webPushErrorMessage(error:unknown):string;export declare function webPushStatusCode(error:unknown):number;');
 const result=spawnSync(process.execPath,[resolve('node_modules/typescript/bin/tsc'),'--noEmit','--skipLibCheck','--strict','--moduleResolution','bundler','--module','ESNext','--target','ES2022',join(dir,'index.ts')],{stdio:'inherit'});process.exitCode=result.status ?? 1;
}finally{rmSync(dir,{recursive:true,force:true});}
