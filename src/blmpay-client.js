export class BlmPayClient {
  constructor(apiKey, baseUrl='https://pay.blmtec.co.tz/api/v1') {
    if (!apiKey) throw new Error('BLMPAY_API_KEY is required');
    this.apiKey=apiKey; this.baseUrl=baseUrl.replace(/\/$/,'');
  }
  async request(method,path,{body,query,idempotencyKey}={}) {
    const url=new URL(this.baseUrl+path);
    Object.entries(query||{}).forEach(([k,v])=>{if(v!==undefined&&v!==null&&v!=='')url.searchParams.set(k,String(v));});
    const headers={Authorization:`Bearer ${this.apiKey}`,Accept:'application/json'};
    if(body!==undefined)headers['Content-Type']='application/json';
    if(idempotencyKey)headers['Idempotency-Key']=idempotencyKey;
    const res=await fetch(url,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
    const text=await res.text(); let data;
    try{data=JSON.parse(text);}catch{throw new Error(`BLMPay returned invalid JSON (${res.status})`);}
    if(!res.ok)throw new Error(`${data?.error_code||'api_error'}: ${data?.message||'BLMPay request failed'} (HTTP ${res.status})`);
    return data;
  }
}
