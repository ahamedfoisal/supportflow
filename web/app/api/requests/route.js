import {timingSafeEqual,createHash} from 'node:crypto';
import {validate} from '../../../lib/validate.mjs';
export const runtime='nodejs';
export const maxDuration=60;
const buckets=new Map();
const reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
function equal(a,b){return timingSafeEqual(createHash('sha256').update(a).digest(),createHash('sha256').update(b).digest());}
export async function POST(req){
 const origin=req.headers.get('origin');
 const expectedOrigin=process.env.APP_ORIGIN || (req.headers.get('host') ? new URL(req.url).protocol+'//'+req.headers.get('host') : new URL(req.url).origin);
 if(origin && origin!==expectedOrigin)return reply({outcome:'forbidden_origin'},403);
 const ip=(req.headers.get('x-forwarded-for')||'local').split(',')[0].trim();
 const now=Date.now();for(const [k,v] of buckets)if(v.until<now)buckets.delete(k);
 if(buckets.size>5000)return reply({outcome:'busy'},429);
 const b=buckets.get(ip)||{count:0,until:now+60000};b.count++;buckets.set(ip,b);
 if(b.count>10)return reply({outcome:'rate_limited',message:'Wait one minute before retrying.'},429);
 if(!req.headers.get('content-type')?.includes('application/json'))return reply({outcome:'invalid_content_type'},415);
 let raw='';const reader=req.body?.getReader();if(!reader)return reply({outcome:'validation_failed'},422);
 const decoder=new TextDecoder();let size=0;
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>8192){await reader.cancel();return reply({outcome:'payload_too_large'},413);}raw+=decoder.decode(value,{stream:true});}raw+=decoder.decode();
 let input;try{input=JSON.parse(raw);}catch{return reply({outcome:'invalid_json'},400);}
 const {errors,request}=validate(input);if(errors.length)return reply({request_id:request.request_id||null,outcome:'validation_failed',errors},422);
 if(input.mode!=='real')return reply({request_id:request.request_id,priority:request.business_impact==='organization'&&request.urgency==='high'?'P1':request.business_impact==='organization'||request.urgency==='high'?'P2':'P3',outcome:'simulated',ticket_url:null,mode:'simulation',message:'UI simulation only. No n8n execution, ticket or Slack message.'});
 const access=process.env.DEMO_ACCESS_CODE;
 if(!access||access.length<16||typeof input.access_code!=='string'||!equal(input.access_code,access))return reply({request_id:request.request_id,outcome:'access_denied'},403);
 const url=process.env.N8N_WEBHOOK_URL,secret=process.env.N8N_WEBHOOK_SECRET;
 if(!url||!secret)return reply({outcome:'not_configured'},503);
 let target;try{target=new URL(url);}catch{return reply({outcome:'not_configured'},503);}
 if(target.protocol!=='https:' && !(process.env.NODE_ENV!=='production' && ['localhost','127.0.0.1'].includes(target.hostname)))return reply({outcome:'not_configured'},503);
 try{
  const upstream=await fetch(target,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+secret},body:JSON.stringify(request),signal:AbortSignal.timeout(50000),redirect:'error',cache:'no-store'});
  const data=await upstream.json();if(typeof data.outcome!=='string')throw new Error('Invalid response');
  const ticket=typeof data.ticket_url==='string' && /^https:\/\/(github\.com|mock\.invalid)\//.test(data.ticket_url)?data.ticket_url:null;
  return reply({request_id:data.request_id,priority:data.priority,outcome:data.outcome,ticket_url:ticket,mode:data.mode,errors:data.errors,execution_id:data.execution_id},upstream.status);
 }catch(error){return reply({request_id:request.request_id,outcome:error.name==='TimeoutError'?'timeout_unknown':'upstream_unavailable',message:'Completion is unknown. Keep this request ID and retry it unchanged; do not generate a new ID.'},error.name==='TimeoutError'?504:502);}
}
