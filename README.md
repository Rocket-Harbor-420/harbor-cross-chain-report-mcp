# Harbor Cross-Chain Report MCP


[![Listed on Global A2A Registry](https://www.a2a-registry.org/badges/listed-badge-light.svg)](https://www.a2a-registry.org/agent/site.chatgpt.harbor_cross_chain_report_agent)
[![MCP security grade A](https://gateturbo.com/badge/scan/765251fd-a5af-4e02-a0e7-6b85838e6174)](https://gateturbo.com/report/765251fd-a5af-4e02-a0e7-6b85838e6174)
[![MCP Endpoint Check security grade A](https://gateturbo.com/badge/scan/26756b96-0236-4746-bcb4-66265afb5faa)](https://gateturbo.com/report/26756b96-0236-4746-bcb4-66265afb5faa)


A dependency-free MCP server for the [Harbor Crew report service](https://resguardo-wallets-260926.tiweedmaster.chatgpt.site/paid-report), available as both a hosted remote MCP and a local stdio server. It requests read-only snapshots for 1–5 public EVM addresses across Ethereum, Base, Arbitrum One, and Polygon.


Each report batch costs 0.02 of the supported stablecoin on the selected network, paid directly to the operator. The six direct-payment rails are USDC on Ethereum, Base, Arbitrum One, or Polygon; USDT on Ethereum; and Binance-Peg BSC-USD on BNB Smart Chain. BSC-USD is distinct from native USDT. There is no free report preview or trial. `get_payment_quote` is available to read current payment instructions before a customer orders a report.


The report includes network block numbers, EIP-7702 delegation indicators, contract-code sizes, SHA-256 fingerprints, and explorer links. It does not inspect balances or private keys, prove ownership or malicious intent, or recover assets.


## Tools


- `get_payment_quote` reads the live quote and payment instructions. If you provide addresses, it formats the authorization-message template locally; it does not send those addresses to the quote endpoint.
- `submit_paid_report` submits a transaction hash, payer address, address batch, and wallet signature to request the report after payment.


## What the report contains


For each requested address and supported report network, the JSON includes the observed block number, EIP-7702 delegation indicator, code size, SHA-256 fingerprint, and explorer link. It is a point-in-time technical snapshot; it does not determine who owns an address, whether delegation is malicious, whether funds are recoverable, or whether an address has a particular balance. Every report is paid; no preview or trial is offered.


## Payment and consent


Each paid report covers one batch of 1–5 public EVM addresses across Ethereum, Base, Arbitrum One, and Polygon PoS. The six payment rails are 0.02 USDC on Ethereum, Base, Arbitrum One, or Polygon PoS; 0.02 USDT on Ethereum; or 0.02 Binance-Peg BSC-USD (BEP-20) on BNB Smart Chain. BSC-USD is not native Tether USDt. Payment goes directly to the operator. The MCP server never initiates a transfer or signs a payment. A user must review the live quote and explicitly choose the network and asset before sending funds. The API requires 12 confirmations on the selected network and a `personal_sign` signature that binds the address batch, payment rail, network, and transaction hash; that signature authorizes only the report request and cannot move funds.
