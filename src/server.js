import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import { BlmPayClient } from './blmpay-client.js';

const asText = data => ({content:[{type:'text',text:JSON.stringify(data,null,2)}]});
const writesAllowed = () => ['1','true','yes'].includes(String(process.env.BLMPAY_MCP_ALLOW_WRITES||'0').toLowerCase());
const requireWrites = () => { if(!writesAllowed()) throw new Error('Financial/write MCP tools are disabled. Set BLMPAY_MCP_ALLOW_WRITES=1 only for an explicitly trusted environment.'); };

export function buildServer() {
  const api=new BlmPayClient(
    process.env.BLMPAY_API_KEY,
    process.env.BLMPAY_API_BASE_URL||'https://pay.blmtec.co.tz/api/v1',
    process.env.BLMPAY_INTEGRATION_ORIGIN||null
  );
  const server=new McpServer({name:'blmpay',version:'0.2.0'});
  server.registerTool('blmpay_get_balance',{description:'Read the authenticated BLMPay merchant TZS balance.'},async()=>asText(await api.request('GET','/balance')));
  server.registerTool('blmpay_list_payments',{description:'List BLMPay collection transactions.',inputSchema:z.object({limit:z.number().int().min(1).max(100).optional(),offset:z.number().int().min(0).optional(),status:z.string().optional()})},async q=>asText(await api.request('GET','/payments',{query:q})));
  server.registerTool('blmpay_get_payment',{description:'Get a BLMPay payment by reference.',inputSchema:z.object({reference:z.string().min(1)})},async({reference})=>asText(await api.request('GET',`/payments/${encodeURIComponent(reference)}`)));
  server.registerTool('blmpay_list_payment_links',{description:'List payment links.'},async()=>asText(await api.request('GET','/payment-links')));
  server.registerTool('blmpay_list_invoices',{description:'List invoices.'},async()=>asText(await api.request('GET','/invoices')));
  server.registerTool('blmpay_list_payouts',{description:'List payouts/disbursements.',inputSchema:z.object({limit:z.number().int().min(1).max(100).optional(),offset:z.number().int().min(0).optional(),status:z.string().optional(),source:z.enum(['all','api','dashboard']).optional()})},async q=>asText(await api.request('GET','/payouts',{query:q})));
  server.registerTool('blmpay_get_payout',{description:'Get a payout by BLMPay reference.',inputSchema:z.object({reference:z.string().min(1)})},async({reference})=>asText(await api.request('GET',`/payouts/${encodeURIComponent(reference)}`)));
  server.registerTool('blmpay_get_payout_fee',{description:'Get the current BLMPay payout fee quote.',inputSchema:z.object({amount:z.number().int().positive(),channel:z.enum(['mobile','bank','selcompesa']).default('mobile')})},async q=>asText(await api.request('GET','/payouts/fee',{query:q})));
  server.registerTool('blmpay_list_banks',{description:'List supported payout banks.'},async()=>asText(await api.request('GET','/payouts/banks')));
  server.registerTool('blmpay_name_lookup',{description:'Verify a Mobile Money, bank or Selcom Pesa recipient name before payout.',inputSchema:z.object({channel:z.enum(['mobile','bank','selcompesa']),account_number:z.string().optional(),phone_number:z.string().optional(),wallet_number:z.string().optional(),bank_code:z.string().optional()})},async body=>asText(await api.request('POST','/payouts/name-lookup',{body})));
  server.registerTool('blmpay_list_webhooks',{description:'List registered merchant webhooks.'},async()=>asText(await api.request('GET','/webhooks')));
  server.registerTool('blmpay_get_usdt_address',{description:'Get the merchant USDT TRC20 receiving address.'},async()=>asText(await api.request('GET','/usdt/address')));
  server.registerTool('blmpay_list_usdt_transfers',{description:'List USDT transfers.',inputSchema:z.object({page:z.number().int().min(1).optional(),limit:z.number().int().min(1).max(100).optional()})},async q=>asText(await api.request('GET','/usdt/transfers',{query:q})));
  server.registerTool('blmpay_create_payment',{description:'Create a BLMPay collection request. Write tool; disabled unless BLMPAY_MCP_ALLOW_WRITES=1.',inputSchema:z.object({payload:z.record(z.string(),z.any()),idempotency_key:z.string().min(8).optional()})},async({payload,idempotency_key})=>{requireWrites();return asText(await api.request('POST','/payments',{body:payload,idempotencyKey:idempotency_key}));});
  server.registerTool('blmpay_create_payment_link',{description:'Create a payment link. Write tool.',inputSchema:z.object({payload:z.record(z.string(),z.any())})},async({payload})=>{requireWrites();return asText(await api.request('POST','/payment-links',{body:payload}));});
  server.registerTool('blmpay_create_invoice',{description:'Create an invoice. Write tool.',inputSchema:z.object({payload:z.record(z.string(),z.any())})},async({payload})=>{requireWrites();return asText(await api.request('POST','/invoices',{body:payload}));});
  server.registerTool('blmpay_create_payout',{description:'Send money through BLMPay. Financial write tool; disabled by default and requires an idempotency key.',inputSchema:z.object({payload:z.record(z.string(),z.any()),idempotency_key:z.string().min(8)})},async({payload,idempotency_key})=>{requireWrites();return asText(await api.request('POST','/payouts/send',{body:payload,idempotencyKey:idempotency_key}));});
  server.registerTool('blmpay_create_webhook',{description:'Register a merchant webhook. Write tool.',inputSchema:z.object({name:z.string().optional(),url:z.string().url(),events:z.array(z.string()).optional()})},async body=>{requireWrites();return asText(await api.request('POST','/webhooks',{body}));});
  server.registerTool('blmpay_delete_webhook',{description:'Delete a merchant webhook. Write tool.',inputSchema:z.object({id:z.number().int().positive()})},async({id})=>{requireWrites();return asText(await api.request('DELETE',`/webhooks/${id}`));});
  server.registerTool('blmpay_activate_usdt',{description:'Activate the merchant USDT receiving account. Write tool.',inputSchema:z.object({})},async()=>{requireWrites();return asText(await api.request('POST','/usdt/activate',{body:{}}));});
  server.registerTool('blmpay_quote_usdt_withdrawal',{description:'Create a USDT withdrawal quote. Financial write preparation tool.',inputSchema:z.object({address:z.string().min(10),amount:z.union([z.string(),z.number()]),idempotency_key:z.string().min(8)})},async({address,amount,idempotency_key})=>{requireWrites();return asText(await api.request('POST','/usdt/withdrawals/quote',{body:{address,amount},idempotencyKey:idempotency_key}));});
  server.registerTool('blmpay_confirm_usdt_withdrawal',{description:'Confirm a previously quoted USDT withdrawal. Financial write tool.',inputSchema:z.object({quote_reference:z.string().min(1)})},async({quote_reference})=>{requireWrites();return asText(await api.request('POST','/usdt/withdrawals',{body:{quote_reference}}));});
  return server;
}
