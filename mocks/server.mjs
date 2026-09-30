import http from 'node:http';
import fs from 'node:fs';
const file=process.env.MOCK_STATE_FILE || './mock-state.json';
let db=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{tickets:[],notifications:[],attempts:{}};
function save(){fs.writeFileSync(file,JSON.stringify(db,null,2));}
http.createServer(async(req,res)=>{
 const send=(status,body,headers={})=>{res.writeHead(status,{'Content-Type':'application/json',...headers});res.end(JSON.stringify(body));};
 if(req.method==='GET' && req.url==='/state')return send(200,db);
 let raw='';for await(const c of req){raw+=c;if(raw.length>16384)return send(413,{error:'too_large'});}
 let b;try{b=JSON.parse(raw||'{}');}catch{return send(400,{error:'invalid_json'});}
 const kind=req.url==='/issues'?'ticket':req.url==='/notify'?'notification':null;
 if(req.method!=='POST'||!kind)return send(404,{error:'not_found'});
 const id=kind==='ticket'?b.title?.match(/\[(.*?)\]/)?.[1]:b.text?.split(' ')[0];
 if(!id)return send(422,{message:'Missing request ID'});
 const k=kind+':'+id;const attempt=db.attempts[k]=(db.attempts[k]||0)+1;save();
 if(id.includes('PERM')&&kind==='ticket')return send(422,{message:'Simulated permanent rejection'});
 if(id.includes('TRANSIENT')&&attempt<3)return send(429,{message:'Simulated rate limit'},{'Retry-After':'1'});
 if(id.includes('SLACKFAIL')&&kind==='notification'&&attempt<=3)return send(503,{ok:false,error:'service_unavailable'});
 if(id.includes('AUTHFAIL'))return send(401,{message:'Simulated auth failure'});
 if(kind==='ticket'){
  const issue={id:db.tickets.length+1,number:db.tickets.length+1,html_url:`https://mock.invalid/issues/${db.tickets.length+1}`,title:b.title,body:b.body};db.tickets.push(issue);save();
  if(id.includes('TIMEOUT'))return setTimeout(()=>send(201,issue),12000);
  return send(201,issue);
 }
 db.notifications.push({text:b.text,channel:b.channel});save();send(200,{ok:true,channel:b.channel,ts:String(Date.now()/1000)});
}).listen(Number(process.env.PORT||4010),process.env.MOCK_HOST||'127.0.0.1',()=>console.log('SupportFlow mock listening'));
