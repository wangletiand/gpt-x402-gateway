#!/usr/bin/env node
// gpt.558686.xyz ? Official Autonomous x402 Client
// Usage:
//   node client.mjs list
//   node client.mjs quote /v1/x402-ping
//   node client.mjs quote /v1/audit/contract
//   node client.mjs pay /v1/x402-ping
//   node client.mjs mcp

const BASE_URL = process.env.GATEWAY_URL || 'https://gpt.558686.xyz';
const command = process.argv[2] || 'help';
const arg1 = process.argv[3];
const arg2 = process.argv[4];

async function listProducts() {
  console.log(`\n=== gpt.558686.xyz Products Catalog (x402 on Base USDC) ===\n`);
  const res = await fetch(`${BASE_URL}/pricing.json`);
  const data = await res.json();
  for (const item of data.pricing) {
    console.log(`- ${item.route.padEnd(24)} ${item.priceFormatted.padStart(8)} USDC | ${item.name} (${item.category})`);
  }
  console.log(`\nDiscovery: ${BASE_URL}/.well-known/x402 | MCP: ${BASE_URL}/mcp\n`);
}

async function quoteRoute(route) {
  if (!route) {
    console.error('Error: Please specify a route, e.g. /v1/x402-ping or /v1/audit/contract');
    process.exit(1);
  }
  const cleanRoute = route.startsWith('/') ? route : `/${route}`;
  const res = await fetch(`${BASE_URL}${cleanRoute}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  const raw402 = res.headers.get('payment-required');
  if (!raw402) {
    console.log(`Status: ${res.status}`);
    console.log(await res.text());
    return;
  }
  const challenge = JSON.parse(Buffer.from(raw402, 'base64').toString('utf8'));
  const accept = challenge.accepts?.[0] || {};
  console.log(`\n=== 402 Payment Challenge for ${cleanRoute} ===`);
  console.log(`Status:           HTTP ${res.status} Payment Required`);
  console.log(`Network:          ${accept.network} (Base Mainnet)`);
  console.log(`Asset:            ${accept.asset} (USDC)`);
  console.log(`Pay To:           ${accept.payTo}`);
  console.log(`Price Atomic:     ${accept.amount} (${Number(accept.amount) / 1e6} USDC)`);
  console.log(`Domain Name:      ${accept.extra?.name}`);
  console.log(`Domain Version:   ${accept.extra?.version}`);
  console.log(`Product:          ${accept.extra?.productName || accept.description}`);
  console.log(`\nTo pay autonomously, use @x402/fetch with your buyer EVM wallet key.\n`);
}

function showMcpConfig() {
  const config = {
    mcpServers: {
      'gpt-x402': {
        url: `${BASE_URL}/mcp`,
      },
    },
  };
  console.log('\n=== Claude Desktop / Cursor MCP Server Configuration ===\n');
  console.log(JSON.stringify(config, null, 2));
  console.log('\nAdd this to claude_desktop_config.json or .cursor/mcp.json.\n');
}

function showHelp() {
  console.log(`
gpt.558686.xyz Autonomous x402 Client

Commands:
  node client.mjs list                    List all available products and prices
  node client.mjs quote <route>           Inspect live 402 challenge quote for a route
  node client.mjs mcp                     Output MCP configuration JSON for Cursor/Claude
  node client.mjs python                  Show Python integration snippet

Examples:
  node client.mjs list
  node client.mjs quote /v1/x402-ping
  node client.mjs quote /v1/audit/contract
  node client.mjs quote /v1/extract/schema
`);
}

function showPython() {
  console.log(`
# Python OpenAI SDK Integration
from openai import OpenAI

client = OpenAI(
    base_url="${BASE_URL}/v1",
    api_key="x402"  # or pass Payment-Signature header
)

response = client.chat.completions.create(
    model="gpt-6-sol",  # or gpt-6-astra, deepseek-chat
    messages=[{"role": "user", "content": "Analyze target contract for vulnerabilities"}]
)
print(response.choices[0].message.content)
`);
}

switch (command) {
  case 'list': listProducts(); break;
  case 'quote': quoteRoute(arg1); break;
  case 'mcp': showMcpConfig(); break;
  case 'python': showPython(); break;
  default: showHelp(); break;
}
