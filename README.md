# BLMPay MCP Server

> **API V1 deprecation notice:** BLMPay API v1 is legacy and is scheduled to be retired on **15 November 2026 at 23:59 EAT**. New MCP deployments must use API v2 HMAC.

Official BLMPay MCP server, version 0.3.0.

The server exposes BLMPay API v2 as MCP tools so AI coding clients can inspect balances, payments, payouts, webhooks and API capabilities without inventing endpoints. Write/financial tools exist but are disabled by default.

## Important security defaults

- `BLMPAY_MCP_ALLOW_WRITES=0` by default.
- Remote MCP endpoint requires its own `BLMPAY_MCP_ACCESS_TOKEN`.
- BLMPay public API key stays server-side in `BLMPAY_API_KEY`.
- BLMPay HMAC secret stays server-side in `BLMPAY_API_SECRET`.
- Never expose a live merchant API key in a desktop/mobile app or public repo.
- For a domain-bound BLMPay API key, set `BLMPAY_INTEGRATION_ORIGIN` to the same HTTPS integration URL saved on that key. The MCP server automatically sends it as `X-BLMPay-Origin` on every BLMPay API request.

Example:

```env
BLMPAY_API_KEY=bp_live_xxxxxxxxxxxxxxxxx
BLMPAY_API_SECRET=bps_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
BLMPAY_API_VERSION=v2
BLMPAY_API_BASE_URL=https://pay.blmtec.co.tz/api/v2
BLMPAY_INTEGRATION_ORIGIN=https://mcp.example.com
BLMPAY_MCP_ALLOW_WRITES=0
```

A mismatched domain can be rejected by BLMPay with `403 integration_domain_not_allowed`. Domain restriction remains a secondary security layer alongside HMAC signing. Existing v1 keys remain available only during the migration window.

## Run

```bash
npm install
cp .env.example .env
# load .env using your host/process manager, then:
npm start
```

Remote endpoint defaults to `http://127.0.0.1:3000/mcp`. Put it behind HTTPS/reverse proxy when exposed publicly.

## Shared hosting

MCP itself does not require an AI model API. It only translates MCP tool calls to BLMPay API requests. However, this Node server needs a Node-capable long-running runtime. If your cPanel/shared host does not support Node applications, deploy this small service on a VPS or another Node host while keeping the main BLMPay PHP production server unchanged.

## Financial write tools

Read tools work with `BLMPAY_MCP_ALLOW_WRITES=0`. Payment creation, payouts, webhook changes and USDT write operations require `BLMPAY_MCP_ALLOW_WRITES=1`. Enable writes only in an explicitly trusted environment and keep idempotency keys enabled for payment/payout creation.

OpenAPI: https://github.com/blmsoft/blmpay-openapi
PHP SDK: https://github.com/blmsoft/blmpay-sdk-php
Node SDK: https://github.com/blmsoft/blmpay-sdk-node
Flutter SDK: https://github.com/blmsoft/blmpay-sdk-flutter

Powered by BLMSoft.


## Legacy API v1

For a temporary legacy deployment, set `BLMPAY_API_VERSION=v1`, point `BLMPAY_API_BASE_URL` to `/api/v1`, and omit `BLMPAY_API_SECRET`. Migrate before **15 November 2026 at 23:59 EAT**.
