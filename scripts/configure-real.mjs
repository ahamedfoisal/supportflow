// Changes configuration only. Never calls external APIs or reads tokens.
import fs from 'node:fs';
const [repo,channel]=process.argv.slice(2);
if(!/^[\w.-]+\/[\w.-]+$/.test(repo||'')||!/^C[A-Z0-9]+$/.test(channel||''))throw Error('Usage: node scripts/configure-real.mjs OWNER/REPO CHANNEL_ID');
const w=JSON.parse(fs.readFileSync(new URL('../workflows/supportflow.json',import.meta.url)));
w.nodes.find(n=>n.name==='Configuration').parameters.jsCode=`return [{json:${JSON.stringify({mode:'real',ticket_url:`https://api.github.com/repos/${repo}/issues`,notification_url:'https://slack.com/api/chat.postMessage',channel})}}];`;
for(const n of w.nodes.filter(n=>n.type==='n8n-nodes-base.httpRequest')){
 n.parameters.authentication='genericCredentialType';n.parameters.genericAuthType='httpHeaderAuth';
 const github=n.name.startsWith('ticket');
 n.credentials={httpHeaderAuth:{id:github?'SUPPORTFLOW_GITHUB':'SUPPORTFLOW_SLACK',name:github?'SupportFlow GitHub':'SupportFlow Slack'}};
 if(github){n.parameters.sendHeaders=true;n.parameters.headerParameters={parameters:[{name:'Accept',value:'application/vnd.github+json'},{name:'X-GitHub-Api-Version',value:'2026-03-10'}]};}
}
w.id='SupportFlowReal01';w.name+=' (real)';
fs.writeFileSync(new URL('../workflows/supportflow-real.json',import.meta.url),JSON.stringify(w,null,2)+'\n');
console.log('Generated real configuration. Select credentials in n8n; obtain approval before publishing or testing.');
