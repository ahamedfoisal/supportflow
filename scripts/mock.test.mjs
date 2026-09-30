import test from 'node:test';import assert from 'node:assert/strict';
const base=process.env.MOCK_URL||'http://127.0.0.1:4010';
const stamp=Date.now();
async function post(path,body){const r=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:r.status,body:await r.json(),headers:r.headers};}
test('mock creates realistic ticket and notification',async()=>{const r=await post('/issues',{title:`[REQ-${stamp}] P3 access request`,body:'Synthetic body'});assert.equal(r.status,201);assert.match(r.body.html_url,/mock.invalid/);const n=await post('/notify',{channel:'demo',text:`REQ-${stamp} P3 ${r.body.html_url}`});assert.equal(n.body.ok,true);});
test('mock rate limiting then success',async()=>{const b={title:`[REQ-${stamp}-TRANSIENT]`,body:'test'};assert.equal((await post('/issues',b)).status,429);assert.equal((await post('/issues',b)).status,429);assert.equal((await post('/issues',b)).status,201);});
test('mock permanent rejection',async()=>assert.equal((await post('/issues',{title:`[REQ-${stamp}-PERM]`})).status,422));
test('mock notification failure then recovery',async()=>{const b={channel:'demo',text:`REQ-${stamp}-SLACKFAIL P3 https://mock.invalid/issues/1`};for(let i=0;i<3;i++)assert.equal((await post('/notify',b)).status,503);assert.equal((await post('/notify',b)).body.ok,true);});
