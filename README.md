# Harbor Cross-Chain Report MCP

A dependency-free MCP stdio server for the [Harbor Crew paid report API](https://resguardo-wallets-260926.tiweedmaster.chatgpt.site/paid-report). It requests read-only snapshots for 1–5 public EVM addresses across Ethereum, Base, Arbitrum One, and Polygon.

The report includes network block numbers, EIP-7702 delegation indicators, contract-code sizes, SHA-256 fingerprints, and explorer links. It does not inspect balances or private keys, prove ownership or malicious intent, or recover assets.

## Tools

- `get_payment_quote` reads the live quote and payment instructions. If you provide addresses, it formats the authorization-message template locally; it does not send those addresses to the quote endpoint.
- `submit_paid_report` submits a transaction hash, payer address, address batch, and wallet signature to request the report after payment.

## Payment and consent

Each paid report covers one batch of 1–5 public EVM addresses across Ethereum, Base, Arbitrum One, and Polygon PoS. The price is 0.02 USDC on Ethereum, Base, Arbitrum One, or Polygon PoS, or 0.02 USDT on Ethereum. Payment goes directly to the operator. The MCP server never initiates a transfer or signs a payment. A user must review the live quote and explicitly choose to pay before sending funds. The API requires 12 confirmations on the selected network and a `personal_sign` signature that binds the address batch, payment rail, network, and transaction hash; that signature authorizes only the report request and cannot move funds.

Never provide a seed phrase or private key. Only submit addresses that are public and that you want included in the report. Check the live quote before every payment; the API is authoritative for the amount and destination.

## Optional HTTP checkout for x402 v2 clients

The service also exposes a separate HTTP checkout for x402 v2-compatible clients. This is independent of the MCP tools above: the MCP server's `get_payment_quote` and `submit_paid_report` flow remains a manual, user-confirmed payment flow.

- Read the current price, network, token, recipient, and report scope with `GET https://resguardo-wallets-260926.tiweedmaster.chatgpt.site/api/v1/x402/cross-chain-report`.
- Request a report with `POST https://resguardo-wallets-260926.tiweedmaster.chatgpt.site/api/v1/x402/cross-chain-report` and JSON such as:

```json
{
  "addresses": ["0x<public EVM address>"]
}
```

Use an x402 v2-compatible client for the POST. It handles the HTTP 402 payment challenge, wallet authorization, and retry; a plain HTTP request does not complete payment. The current quote is 0.02 native USDC on Base (chain ID 8453), but always treat the live GET response as authoritative. Successful settlement goes directly to the operator address returned in the quote; the report endpoint does not receive a seed phrase or private key. The returned `PAYMENT-RESPONSE` header contains settlement details.

The x402 route covers the same 1–5 public EVM addresses and point-in-time report fields described above. Addresses are processed for the report and sent to public RPCs; raw batches and reports are not persisted. See the [service catalog](https://resguardo-wallets-260926.tiweedmaster.chatgpt.site/services.json), [OpenAPI document](https://resguardo-wallets-260926.tiweedmaster.chatgpt.site/openapi.json), and [paid report page](https://resguardo-wallets-260926.tiweedmaster.chatgpt.site/paid-report) for current details.

## Install

Requires Node.js 20 or newer. Start the MCP server directly from the public GitHub repository:

```json
{
  "mcpServers": {
    "harbor-cross-chain-report": {
      "command": "npx",
      "args": ["-y", "github:Rocket-Harbor-420/harbor-cross-chain-report-mcp"]
    }
  }
}
```

The first start downloads the repository through npm and launches its single CLI entry point. No account, API key, private key, or seed phrase is required to run the MCP server. It communicates over stdio and sends HTTPS requests only to the published report API.

## Run from a local clone

If you prefer to clone the repository yourself, configure your MCP host with:

```json
{
  "mcpServers": {
    "harbor-cross-chain-report": {
      "command": "node",
      "args": ["/absolute/path/to/harbor-cross-chain-report-mcp/server.mjs"]
    }
  }
}
```

## Service details

- Live quote and supported payment rails: [service descriptor](https://resguardo-wallets-260926.tiweedmaster.chatgpt.site/api/v1/cross-chain-report)
- API documentation: [service OpenAPI document](https://resguardo-wallets-260926.tiweedmaster.chatgpt.site/openapi.json)
- Paid report page: [Harbor Crew](https://resguardo-wallets-260926.tiweedmaster.chatgpt.site/paid-report)
- Source license: MIT
