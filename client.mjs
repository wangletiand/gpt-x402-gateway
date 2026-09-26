#!/usr/bin/env node
// gpt.558686.xyz — Official Autonomous x402 Client & MCP Server Bridge
// Supports CLI commands and Model Context Protocol (MCP) stdio transport.

import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.GATEWAY_URL || 'https://gpt.558686.xyz';
const command = process.argv[2] || (!process.stdin.isTTY ? 'stdio' : 'help');
const arg1 = process.argv[3];

// Load local fallback tools for offline/sandboxed introspection tests
let cachedTools = [];
try {
  const toolsPath = path.join(__dirname, 'tools.json');
  if (fs.existsSync(toolsPath)) {
    cachedTools = JSON.parse(fs.readFileSync(toolsPath, 'utf8'));
  }
} catch (e) {}

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
  const res = await fetch(`${BASE_URL}${cleanRoute}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
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
        command: 'npx',
        args: ['-y', 'gpt-x402-gateway', 'stdio'],
      },
    },
  };
  console.log('\n=== Claude Desktop / Cursor MCP Server Configuration ===\n');
  console.log(JSON.stringify(config, null, 2));
  console.log('\nOr connect via remote HTTP: https://gpt.558686.xyz/mcp\n');
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

function showHelp() {
  console.log(`
gpt.558686.xyz Autonomous x402 Client & MCP Server

Commands:
  node client.mjs list                    List all available products and prices
  node client.mjs quote <route>           Inspect live 402 challenge quote for a route
  node client.mjs mcp                     Output MCP configuration JSON for Cursor/Claude
  node client.mjs stdio                   Run as Model Context Protocol (MCP) stdio server
  node client.mjs python                  Show Python integration snippet

Examples:
  npx gpt-x402-gateway list
  npx gpt-x402-gateway quote /v1/guard/tx
  npx gpt-x402-gateway stdio
`);
}

async function runStdioMcp() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  const sendJson = (obj) => {
    process.stdout.write(JSON.stringify(obj) + '\n');
  };

  rl.on('line', async (line) => {
    line = line.trim();
    if (!line) return;
    try {
      const msg = JSON.parse(line);
      const { id, method, params } = msg;

      if (method === 'initialize') {
        sendJson({
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {},
            },
            serverInfo: {
              name: 'gpt-x402-gateway',
              version: '1.0.0',
            },
          },
        });
        return;
      }

      if (method === 'notifications/initialized') {
        return;
      }

      if (method === 'ping') {
        sendJson({ jsonrpc: '2.0', id, result: {} });
        return;
      }

      if (method === 'tools/list') {
        try {
          const res = await fetch(`${BASE_URL}/mcp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jsonrpc: '2.0', id, method: 'tools/list' }),
            signal: AbortSignal.timeout(3000),
          });
          const data = await res.json();
          if (data.result?.tools) {
            sendJson({ jsonrpc: '2.0', id, result: { tools: data.result.tools } });
            return;
          }
        } catch (err) {}
        sendJson({ jsonrpc: '2.0', id, result: { tools: cachedTools } });
        return;
      }

      if (method === 'tools/call') {
        try {
          const res = await fetch(`${BASE_URL}/mcp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jsonrpc: '2.0', id, method: 'tools/call', params }),
            signal: AbortSignal.timeout(15000),
          });
          const raw402 = res.headers.get('payment-required');
          if (res.status === 402 && raw402) {
            const challenge = JSON.parse(Buffer.from(raw402, 'base64').toString('utf8'));
            sendJson({
              jsonrpc: '2.0',
              id,
              result: {
                isError: true,
                content: [
                  {
                    type: 'text',
                    text: `Payment Required (x402 on Base USDC):\nRoute: ${params?.name}\nAmount: ${Number(challenge.accepts?.[0]?.amount || 0) / 1e6} USDC\nPayTo: ${challenge.accepts?.[0]?.payTo}\nPlease pay via x402 protocol or client.mjs.`,
                  },
                ],
              },
            });
            return;
          }
          const data = await res.json();
          sendJson(data);
        } catch (err) {
          sendJson({
            jsonrpc: '2.0',
            id,
            error: { code: -32603, message: err.message },
          });
        }
        return;
      }

      if (id !== undefined) {
        sendJson({ jsonrpc: '2.0', id, result: {} });
      }
    } catch (parseErr) {
      // Ignore malformed input
    }
  });
}

switch (command) {
  case 'list': listProducts(); break;
  case 'quote': quoteRoute(arg1); break;
  case 'mcp': showMcpConfig(); break;
  case 'python': showPython(); break;
  case 'stdio':
  case 'mcp-server':
    runStdioMcp();
    break;
  default:
    if (!process.stdin.isTTY) {
      runStdioMcp();
    } else {
      showHelp();
    }
    break;
}
