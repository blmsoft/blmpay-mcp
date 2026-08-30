# BLMPay MCP Server

Official BLMPay MCP foundation, version 0.1.0.

The server exposes BLMPay API v1 as MCP tools so AI coding clients can inspect balances, payments, payouts, webhooks and API capabilities without inventing endpoints. Write/financial tools exist but are disabled by default.

## Important security defaults

- `BLMPAY_MCP_ALLOW_WRITES=0` by default.
- Remote MCP endpoint requires its own `BLMPAY_MCP_ACCESS_TOKEN`.
- BLMPay merchant API key stays server-side in `BLMPAY_API_KEY`.
- Never expose a live merchant API key in a desktop/mobile app or public repo.

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

Powered by BLMSoft.
