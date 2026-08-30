import { createServer } from 'node:http';
import { createMcpHandler } from '@modelcontextprotocol/server';
import { toNodeHandler, hostHeaderValidation, originValidation, localhostHostValidation, localhostOriginValidation } from '@modelcontextprotocol/node';
import { buildServer } from './server.js';

const port=Number(process.env.PORT||3000);
const host=process.env.HOST||'127.0.0.1';
const endpoint=process.env.MCP_PATH||'/mcp';
const accessToken=String(process.env.BLMPAY_MCP_ACCESS_TOKEN||'').trim();
if(!process.env.BLMPAY_API_KEY) throw new Error('BLMPAY_API_KEY is required.');
if(!accessToken) throw new Error('BLMPAY_MCP_ACCESS_TOKEN is required for the remote MCP endpoint.');
const handler=createMcpHandler(()=>buildServer(),{responseMode:'json'});
const nodeHandler=toNodeHandler(handler);
const allowedHosts=String(process.env.MCP_ALLOWED_HOSTS||'').split(',').map(v=>v.trim()).filter(Boolean);
const allowedOrigins=String(process.env.MCP_ALLOWED_ORIGINS||'').split(',').map(v=>v.trim()).filter(Boolean);
const validateHost=allowedHosts.length ? hostHeaderValidation(allowedHosts) : localhostHostValidation();
const validateOrigin=allowedOrigins.length ? originValidation(allowedOrigins) : localhostOriginValidation();
const server=createServer((req,res)=>{
  const path=(req.url||'').split('?')[0];
  if(path!==endpoint){res.writeHead(404,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'not_found'}));return;}
  if(!validateHost(req,res) || !validateOrigin(req,res)) return;
  const auth=String(req.headers.authorization||'');
  if(auth!==`Bearer ${accessToken}`){res.writeHead(401,{'Content-Type':'application/json','WWW-Authenticate':'Bearer'});res.end(JSON.stringify({error:'unauthorized'}));return;}
  void nodeHandler(req,res);
});
server.listen(port,host,()=>console.error(`BLMPay MCP listening on http://${host}:${port}${endpoint}`));
process.on('SIGINT',async()=>{await handler.close();server.close(()=>process.exit(0));});
