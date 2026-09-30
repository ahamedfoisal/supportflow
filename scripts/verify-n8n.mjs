// Run only against the LOCAL MOCK workflow. This deliberately creates mock tickets.
import assert from 'node:assert/strict';import fs from 'node:fs';
const base=process.env.N8N_TEST_URL||'http://127.0.0.1:5678/webhook/supportflow';
const mock=process.env.MOCK_URL||'http://127.0.0.1:4010';
if(!['localhost','127.0.0.1'].includes(new URL(base).hostname))throw Error('This test is restricted to a local mock workflow.');
const secret=process.env.SUPPORTFLOW_KEY;if(!secret)throw Error('Set SUPPORTFLOW_KEY locally; do not put it in source.');
const sample=JSON.parse(fs.readFileSync(new URL('../samples/valid.json',import.meta.url)));
async function send(id,extra={},key=secret){const r=await fetch(base,{method:'POST',headers:{'Content-Type':'application/json',...(key?{'Authorization':'Bearer '+key}:{})},body:JSON.stringify({...sample,request_id:id,...extra}),signal:AbortSignal.timeout(90000)});let data;try{data=await r.json();}catch{data={};}return {status:r.status,data};}
const state=async()=>await(await fetch(mock+'/state')).json();
if(process.argv.includes('--after-restart')){
 const id=process.env.RESTART_REQUEST_ID;if(!id)throw Error('Set RESTART_REQUEST_ID to the valid ID printed by the previous run');const before=await state();const r=await send(id);assert.equal(r.data.outcome,'completed');assert.equal((await state()).tickets.length,before.tickets.length);console.log('PASS duplicate detection after operator restart');process.exit();
}
const prefix='REQ-'+Date.now();
const valid=await send(prefix);assert.equal(valid.data.mode,'mock','STOP: workflow must use mock endpoints');assert.equal(valid.data.outcome,'completed');assert.ok(valid.data.ticket_url);assert.equal(valid.data.priority,'P3');console.log('PASS valid mock request');
let before=await state();assert.ok(before.notifications.some(n=>n.text.startsWith(prefix+' ')));assert.ok(before.notifications.every(n=>!n.text.includes('@example.com')&&!n.text.includes(sample.description)));
assert.equal((await send(prefix)).data.ticket_url,valid.data.ticket_url);assert.equal((await state()).tickets.length,before.tickets.length);console.log('PASS sequential duplicate');
assert.equal((await send(prefix,{description:'Changed description for conflict'})).data.outcome,'request_id_conflict');
assert.equal((await send(prefix+'-BAD',{requester_email:'invalid'})).status,422);for(const extra of [{category:'unsupported'},{description:'tiny'},{request_id:null},{urgency:'critical'},{business_impact:'planet'},{description:'x'.repeat(2001)}])assert.equal((await send(prefix+'-INVALID',extra)).status,422);console.log('PASS validation (email, required field, enums and lengths)');
for(const key of ['', 'incorrect']){const r=await send(prefix+'-AUTH',{},key);assert.ok([401,403].includes(r.status));}console.log('PASS webhook authentication');
const transient=await send(prefix+'-TRANSIENT');assert.equal(transient.data.outcome,'completed');assert.equal((await state()).attempts['ticket:'+prefix+'-TRANSIENT'],3);assert.equal((await state()).attempts['notification:'+prefix+'-TRANSIENT'],3);console.log('PASS bounded rate-limit retries for ticket and notification');
assert.equal((await send(prefix+'-PERM')).data.outcome,'ticket_failed');assert.equal((await state()).attempts['ticket:'+prefix+'-PERM'],1);assert.equal((await send(prefix+'-AUTHFAIL')).data.outcome,'ticket_failed');assert.equal((await state()).attempts['ticket:'+prefix+'-AUTHFAIL'],1);console.log('PASS permanent ticket failure and no retry on API authentication failure');
const partial=await send(prefix+'-SLACKFAIL');assert.equal(partial.data.outcome,'notification_failed');assert.ok(partial.data.ticket_url);before=await state();const recovered=await send(prefix+'-SLACKFAIL');assert.equal(recovered.data.outcome,'completed');assert.equal(recovered.data.ticket_url,partial.data.ticket_url);assert.equal((await state()).tickets.length,before.tickets.length);console.log('PASS notification recovery');
assert.equal((await send(prefix+'-TIMEOUT')).data.outcome,'creation_uncertain');before=await state();assert.equal((await send(prefix+'-TIMEOUT')).data.outcome,'creation_uncertain');assert.equal((await state()).tickets.length,before.tickets.length);console.log('PASS ambiguous creation guarded');
const high=await send(prefix+'-HIGH',{category:' Access ',business_impact:' ORGANIZATION ',urgency:' HIGH '});assert.equal(high.data.priority,'P1');assert.equal(high.data.outcome,'completed');const highTicket=(await state()).tickets.find(t=>t.title.includes(prefix+'-HIGH'));assert.ok(highTicket.body.includes('Identity support'));assert.ok(highTicket.body.includes('\"category\": \"access\"'));console.log('PASS normalization and priority/team classification');
console.log('Restart n8n without deleting its volume, then run:');console.log(`RESTART_REQUEST_ID=${prefix} node scripts/verify-n8n.mjs --after-restart`);
