#!/usr/bin/env node
import { createInterface } from "node:readline";

const SERVICE_ORIGIN = "https://resguardo-wallets-260926.tiweedmaster.chatgpt.site";
const REPORT_URL = SERVICE_ORIGIN + "/api/v1/cross-chain-report";
const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
const TX_RE = /^0x[0-9a-fA-F]{64}$/;
const SIGNATURE_RE = /^0x[0-9a-fA-F]{130}$/;
const PROTOCOL_VERSIONS = new Set(["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"]);

const tools = [
  {
    name: "get_payment_quote",
    title: "Get a direct report quote",
    description: "Read the live price, supported EVM payment rails, token contract, operator address, and confirmation requirement. Choose a paymentRailId from the quote; this tool never sends funds.",
    inputSchema: {
      type: "object",
      properties: {
        paymentRailId: {
          type: "string",
          description: "Optional rail ID from the live quote, such as base-usdc or bsc-bsc-usd. Defaults to base-usdc for backward compatibility.",
        },
        addresses: {
          type: "array",
          minItems: 1,
          maxItems: 5,
          uniqueItems: true,
          items: { type: "string", pattern: "^0x[0-9a-fA-F]{40}$" },
          description: "Optional public EVM address batch to include in the signing-message template. It is not sent to the quote endpoint.",
        },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  {
    name: "submit_paid_report",
    title: "Submit payment proof for a cross-chain report",
    description: "After the user has explicitly chosen to buy and has already sent the exact quoted asset on the selected EVM rail, submit paymentRailId, transaction hash, payer address, 1–5 public EVM addresses, and the payer's personal_sign signature. This server never sends or signs a payment. The signature authorizes only the report request and cannot move funds. Never provide a private key or seed phrase.",
    inputSchema: {
      type: "object",
      required: ["txHash", "payerAddress", "addresses", "signature"],
      properties: {
        paymentRailId: { type: "string", description: "The exact payment rail ID selected from get_payment_quote. Omit only for older Base USDC payments." },
        txHash: { type: "string", pattern: "^0x[0-9a-fA-F]{64}$", description: "Confirmed transaction hash on the selected EVM payment network." },
        payerAddress: { type: "string", pattern: "^0x[0-9a-fA-F]{40}$", description: "Address that sent the selected payment asset and will sign the report authorization." },
        addresses: {
          type: "array",
          minItems: 1,
          maxItems: 5,
          uniqueItems: true,
          items: { type: "string", pattern: "^0x[0-9a-fA-F]{40}$" },
          description: "Public EVM addresses to inspect on Ethereum, Base, Arbitrum One, and Polygon.",
        },
        signature: { type: "string", pattern: "^0x[0-9a-fA-F]{130}$", description: "65-byte personal_sign signature of the exact authorization message returned by get_payment_quote." },
      },
      additionalProperties: false,
    },
  },
];

function textResult(value, isError = false) {
  return { content: [{ type: "text", text: typeof value === "string" ? value : JSON.stringify(value, null, 2) }], isError };
}

function validateAddressBatch(addresses) {
  if (!Array.isArray(addresses) || addresses.length < 1 || addresses.length > 5 || addresses.some((value) => typeof value !== "string" || !ADDRESS_RE.test(value))) {
    throw new Error("Provide 1–5 public EVM addresses in 0x-prefixed 20-byte hex format.");
  }
  const normalized = addresses.map((value) => value.toLowerCase());
  if (new Set(normalized).size !== normalized.length) throw new Error("Each address in the batch must be unique, ignoring letter case.");
  return normalized.sort();
}

function signingMessageTemplate(addresses, paymentRail) {
  const list = Array.isArray(addresses)
    ? validateAddressBatch(addresses).join(",")
    : "<lowercase EVM addresses, comma-separated and sorted lexicographically>";
  return [
    "The Harbor Crew Cross-Chain Report",
    "version=2",
    "chainId=" + BigInt(paymentRail.chainId).toString(),
    "paymentRail=" + paymentRail.id,
    "tx=<lowercase " + paymentRail.network + " transaction hash>",
    "addresses=" + list,
  ].join("\n");
}

async function readJsonResponse(response) {
  const raw = await response.text();
  try { return raw ? JSON.parse(raw) : {}; } catch { return { response: raw.slice(0, 2000) }; }
}

async function getQuote(args) {
  if (args.addresses !== undefined) validateAddressBatch(args.addresses);
  const response = await fetch(REPORT_URL, {
    headers: { accept: "application/json" },
    signal: typeof AbortSignal.timeout === "function" ? AbortSignal.timeout(30000) : undefined,
  });
  const quote = await readJsonResponse(response);
  if (!response.ok) return textResult({ httpStatus: response.status, error: quote }, true);
  const paymentRailId = args.paymentRailId ?? "base-usdc";
  const paymentRail = quote.paymentRails?.find((rail) => rail.id === paymentRailId);
  if (!paymentRail) {
    return textResult({ error: "Choose a paymentRailId from the live quote.", supportedPaymentRails: quote.paymentRails || [] }, true);
  }
  return textResult({
    quote,
    selectedPaymentRail: paymentRail,
    paymentFlow: `Manual direct ${paymentRail.amount} ${paymentRail.asset} transfer on ${paymentRail.network} to the quoted operator recipient; no custody, and this tool never initiates a transfer.`,
    confirmationsRequired: Number(paymentRail.confirmationsRequired),
    signingMessageTemplate: signingMessageTemplate(args.addresses, paymentRail),
    signingNote: `After the user authorizes and sends the exact transfer on ${paymentRail.network}, replace the tx placeholder with that transaction's lowercase hash and have the payer wallet personal_sign this exact UTF-8 message. Signing sends no funds.`,
  });
}

async function submitReport(args) {
  if (!args || typeof args !== "object" || !TX_RE.test(args.txHash || "") || !ADDRESS_RE.test(args.payerAddress || "") || !SIGNATURE_RE.test(args.signature || "")) {
    throw new Error("txHash, payerAddress, and signature must use the formats shown in the tool schema.");
  }
  validateAddressBatch(args.addresses);
  const request = {
    txHash: args.txHash,
    payerAddress: args.payerAddress,
    addresses: args.addresses,
    signature: args.signature,
  };
  if (typeof args.paymentRailId === "string") request.paymentRailId = args.paymentRailId;
  const response = await fetch(REPORT_URL, {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify(request),
    signal: typeof AbortSignal.timeout === "function" ? AbortSignal.timeout(90000) : undefined,
  });
  const result = await readJsonResponse(response);
  const note = response.status === 202 ? "Payment is still confirming. Retry this same request; do not pay again." : undefined;
  return textResult({ httpStatus: response.status, ...(note ? { note } : {}), result }, !response.ok);
}

async function callTool(params) {
  if (!params || typeof params.name !== "string") return textResult("Missing tool name.", true);
  const args = params.arguments ?? {};
  try {
    if (params.name === "get_payment_quote") return await getQuote(args);
    if (params.name === "submit_paid_report") return await submitReport(args);
    return textResult("Unknown tool: " + params.name, true);
  } catch (error) {
    return textResult(error instanceof Error ? error.message : "The report request could not be completed.", true);
  }
}

function response(id, result) {
  return { jsonrpc: "2.0", id, result };
}

async function handleMessage(message) {
  if (!message || typeof message !== "object" || Array.isArray(message) || message.jsonrpc !== "2.0" || typeof message.method !== "string") {
    return { jsonrpc: "2.0", id: null, error: { code: -32600, message: "Invalid Request" } };
  }
  const hasId = Object.prototype.hasOwnProperty.call(message, "id");
  if (!hasId) return null;
  const params = message.params ?? {};
  if (message.method === "initialize") {
    const requested = params.protocolVersion;
    const protocolVersion = PROTOCOL_VERSIONS.has(requested) ? requested : "2025-11-25";
    return response(message.id, {
      protocolVersion,
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: "harbor-cross-chain-report", version: "0.1.2" },
      instructions: "Use get_payment_quote to view accepted EVM rails, then let the user choose the network and asset. Obtain explicit user approval before any transfer. This server never transfers funds. Submit a paid report only after the payer has sent the exact quoted amount and signed the returned paymentRailId-bound message. Never request or transmit seed phrases or private keys.",
    });
  }
  if (message.method === "ping") return response(message.id, {});
  if (message.method === "tools/list") return response(message.id, { tools });
  if (message.method === "tools/call") return response(message.id, await callTool(params));
  return { jsonrpc: "2.0", id: message.id, error: { code: -32601, message: "Method not found" } };
}

function send(message) {
  if (message) process.stdout.write(JSON.stringify(message) + "\n");
}

const input = createInterface({ input: process.stdin, crlfDelay: Infinity });
let queue = Promise.resolve();
input.on("line", (line) => {
  queue = queue.then(async () => {
    let message;
    try { message = JSON.parse(line); }
    catch { send({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }); return; }
    if (Array.isArray(message)) {
      const replies = [];
      for (const item of message) {
        const reply = await handleMessage(item);
        if (reply) replies.push(reply);
      }
      if (replies.length) send(replies);
      return;
    }
    send(await handleMessage(message));
  }).catch(() => {
    send({ jsonrpc: "2.0", id: null, error: { code: -32603, message: "Internal error" } });
  });
});
