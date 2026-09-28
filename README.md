# Harbor Cross-Chain Report MCP

A dependency-free MCP stdio client for the [Harbor Crew paid report API](https://resguardo-wallets-260926.tiweedmaster.chatgpt.site/paid-report). It requests read-only snapshots for 1–5 public EVM addresses across Ethereum, Base, Arbitrum One, and Polygon.

The report includes network block numbers, EIP-7702 delegation indicators, contract-code sizes, SHA-256 fingerprints, and explorer links. It does not inspect balances or private keys, prove ownership or malicious intent, or recover assets.

## Tools

- `get_payment_quote` reads the live quote and payment instructions. If you provide addresses, it formats the authorization-message template locally; it does not send those addresses to the quote endpoint.
- `submit_paid_report` submits a transaction hash, payer address, address batch, and wallet signature to request the report after payment.

## Payment and consent

The quote is for 0.02 native USDC on Base, paid directly to the operator. The MCP server never initiates a transfer or signs a payment. A user must review the current quote and explicitly choose to pay before sending funds. The API requires 12 Base confirmations and a `personal_sign` signature that binds the address batch to the transaction hash; that signature authorizes only the report request and cannot move funds. This service does not use x402.

Never provide a seed phrase or private key. Only submit addresses that are public and that you want included in the report. Check the live quote before every payment; the API is authoritative for the amount and destination.

## Run locally

Requires Node.js 20 or newer. No npm packages are needed.

Clone this repository, then configure your MCP host to run:

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

Replace the example path with the absolute path to `server.mjs` on your computer. The server communicates over MCP stdio and makes HTTPS requests only to the published Harbor Crew report API.

## Service details

- Live quote and API documentation: [service OpenAPI document](https://resguardo-wallets-260926.tiweedmaster.chatgpt.site/openapi.json)
- Paid report page: [Harbor Crew](https://resguardo-wallets-260926.tiweedmaster.chatgpt.site/paid-report)
- Source license: MIT
