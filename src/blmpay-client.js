import { createHash, createHmac, randomBytes } from 'node:crypto';

export class BlmPayClient {
  constructor(apiKey, hmacSecret=null, baseUrl=null, integrationOrigin=null, apiVersion=null) {
    if(!apiKey) throw new Error('BLMPAY_API_KEY is required');
    this.apiKey=String(apiKey).trim();
    this.hmacSecret=hmacSecret ? String(hmacSecret).trim() : null;
    this.apiVersion=String(apiVersion || (this.hmacSecret ? 'v2' : 'v1')).toLowerCase();
    if(!['v1','v2'].includes(this.apiVersion)) throw new Error('BLMPAY_API_VERSION must be v1 or v2.');
    if(this.apiVersion==='v2' && !this.hmacSecret) throw new Error('BLMPAY_API_SECRET is required for API v2.');
    this.baseUrl=String(baseUrl || `https://pay.blmtec.co.tz/api/${this.apiVersion}`).replace(/\/$/,'');
    this.integrationOrigin=this.#normalizeIntegrationOrigin(integrationOrigin);
  }

  setIntegrationOrigin(origin) {
    this.integrationOrigin=this.#normalizeIntegrationOrigin(origin);
    return this;
  }

  async request(method,path,{body,query,idempotencyKey}={}) {
    const httpMethod=String(method||'GET').toUpperCase();
    const url=new URL(this.baseUrl+path);
    Object.entries(query||{}).forEach(([k,v])=>{
      if(v!==undefined&&v!==null&&v!=='') url.searchParams.set(k,String(v));
    });

    const rawBody=body===undefined?'':JSON.stringify(body);
    const headers={Accept:'application/json'};

    if(this.apiVersion==='v2'){
      const timestamp=Math.floor(Date.now()/1000).toString();
      const nonce=randomBytes(24).toString('hex');
      const target=url.pathname+url.search;
      const bodyHash=createHash('sha256').update(rawBody,'utf8').digest('hex');
      const canonical=`${httpMethod}\n${target}\n${timestamp}\n${nonce}\n${bodyHash}`;
      const signature=createHmac('sha256',this.hmacSecret).update(canonical,'utf8').digest('hex');
      headers.Authorization=`BLMPay-HMAC ${this.apiKey}`;
      headers['X-BLMPay-Timestamp']=timestamp;
      headers['X-BLMPay-Nonce']=nonce;
      headers['X-BLMPay-Signature']=signature;
    }else{
      headers.Authorization=`Bearer ${this.apiKey}`;
    }

    if(this.integrationOrigin) headers['X-BLMPay-Origin']=this.integrationOrigin;
    if(body!==undefined) headers['Content-Type']='application/json';
    if(idempotencyKey) headers['Idempotency-Key']=idempotencyKey;

    const res=await fetch(url,{method:httpMethod,headers,body:body===undefined?undefined:rawBody});
    const text=await res.text(); let data;
    try{data=JSON.parse(text);}catch{throw new Error(`BLMPay returned invalid JSON (${res.status})`);}
    if(!res.ok) throw new Error(`${data?.error_code||'api_error'}: ${data?.message||'BLMPay request failed'} (HTTP ${res.status})`);
    return data;
  }

  #normalizeIntegrationOrigin(origin) {
    if(origin===undefined||origin===null||String(origin).trim()==='')return null;
    let url;
    try{url=new URL(String(origin).trim());}catch{throw new Error('BLMPAY_INTEGRATION_ORIGIN must be a valid HTTPS URL.');}
    if(url.protocol!=='https:'||!url.hostname)throw new Error('BLMPAY_INTEGRATION_ORIGIN must use HTTPS.');
    return String(origin).trim();
  }
}
