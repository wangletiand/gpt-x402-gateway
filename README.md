# GPT-6 x402 AI Autonomous Gateway

[![x402 Protocol](https://img.shields.io/badge/x402-v2_Compliant-gold)](https://www.x402.org)
[![Base USDC](https://img.shields.io/badge/Base_USDC-eip155%3A8453-blue)](https://base.org)
[![Gold-402 Verified](https://img.shields.io/badge/Gold--402-Verified-22c55e)](https://github.com/Haustorium12/gold-402)
[![MCP Server](https://img.shields.io/badge/MCP-Compatible-purple)](https://modelcontextprotocol.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Production AI micro-services & Model Context Protocol (MCP) gateway powered by **GPT-6**, payable per call in USDC on Base via the **x402 protocol**.

No accounts, no API keys, no subscriptions. Zero-friction autonomous machine-to-machine commerce.

- **Public Gateway**: [https://gpt.558686.xyz](https://gpt.558686.xyz)
- **MCP Endpoint**: `https://gpt.558686.xyz/mcp`
- **OpenAPI 3.1 Spec**: [https://gpt.558686.xyz/openapi.json](https://gpt.558686.xyz/openapi.json)
- **Machine Manifest**: [https://gpt.558686.xyz/.well-known/x402](https://gpt.558686.xyz/.well-known/x402)
- **AI Agent Docs**: [https://gpt.558686.xyz/llms.txt](https://gpt.558686.xyz/llms.txt)
- **Live Ledger & Growth**: [https://gpt.558686.xyz/growth](https://gpt.558686.xyz/growth)

---

## 14 Production Products

| Route | Product Name | Price (USDC) | Description |
|---|---|---|---|
| `POST /v1/guard/tx` | **Transaction Guard & Calldata Decoder** | $0.15 | Pre-transaction safety auditor & calldata decoder for autonomous agents |
| `POST /v1/guard/prompt` | **Prompt Injection Firewall** | $0.05 | Real-time prompt injection detector & input sanitizer |
| `POST /v1/audit/contract` | **Smart Contract Security Auditor** | $2.50 | Deep Solidity formal security & reentrancy audit (GPT-6) |
| `POST /v1/audit/code` | **Code Security & Architecture Review** | $1.50 | Full codebase vulnerability & refactoring analysis (GPT-6) |
| `POST /v1/agent/architect` | **Autonomous Agent Architect** | $3.00 | Multi-agent state machines & error recovery synthesis (GPT-6) |
| `POST /v1/extract/schema` | **Structured Schema Extractor** | $0.50 | Raw text/HTML to strict JSON conforming to any JSON Schema |
| `POST /v1/research` | **Deep Research Intelligence** | $2.00 | Multi-angle deep research reports (GPT-6) |
| `POST /v1/data/insights` | **Data Insights Analyst** | $1.00 | Statistical synthesis & anomaly detection on tabular data |
| `POST /v1/doc/summary` | **Document Summary Pro** | $0.50 | Long document hierarchical summarization |
| `POST /v1/translate/pro` | **Translation Pro** | $0.30 | Multi-lingual technical translation |
| `POST /v1/content/seo` | **SEO Content Writer** | $0.80 | High-intent SEO & knowledge base synthesizer |
| `POST /v1/chat/completions` | **OpenAI Standard Completions** | $0.05 | OpenAI-compatible completions powered by GPT-6 Sol |
| `POST /v1/chat` | **Chat Pro** | $0.05 | Conversational reasoning engine |
| `GET /v1/x402-ping` | **Protocol Verification Probe** | $0.002 | Micro-probe to verify network and payment flow |

---

## Model Context Protocol (MCP) Setup

Connect Claude Desktop, Cursor, or any MCP client directly to this gateway:

### Claude Desktop Configuration (`claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "gpt-x402": {
      "command": "npx",
      "args": ["-y", "gpt-x402-gateway", "stdio"]
    }
  }
}
```

### Docker Usage

```bash
docker build -t gpt-x402-gateway .
docker run -i --rm gpt-x402-gateway
```

Or connect via remote HTTP:
- Endpoint: `https://gpt.558686.xyz/mcp`
- Server Manifest: `https://gpt.558686.xyz/.well-known/mcp.json`

---

## Quick Start CLI

```bash
# List all available products and live pricing
npx gpt-x402-gateway list

# Inspect a live HTTP 402 payment quote
npx gpt-x402-gateway quote /v1/x402-ping

# Inspect transaction guard quote
npx gpt-x402-gateway quote /v1/guard/tx

# Run as local MCP server
npx gpt-x402-gateway stdio
```

---

## Python (OpenAI SDK) Integration

```python
from openai import OpenAI

# Standard OpenAI SDK routing through x402 payment gateway
client = OpenAI(
    base_url="https://gpt.558686.xyz/v1",
    api_key="x402-buyer-key"  # Wallet authorization
)

response = client.chat.completions.create(
    model="gpt-6-sol",
    messages=[{"role": "user", "content": "Analyze smart contract security"}]
)
print(response.choices[0].message.content)
```

---

## Settlement & Verification

Every paid transaction is settled directly on Base mainnet (`eip155:8453`) using Circle USDC (`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`).
Each delivered response contains cryptographic receipt headers (`X-Receipt-Id`, `X-Receipt-Hash`), verifiable publicly at `https://gpt.558686.xyz/v1/receipts/<receiptId>`.

---

## License

MIT License.
