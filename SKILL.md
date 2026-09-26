---
name: gpt-x402-intelligence
description: Production x402 AI micro-services & MCP gateway powered by GPT-6 on Base USDC. Provides smart contract security audits, transaction calldata analysis, prompt injection defense, agent architecture synthesis, and structured schema extraction.
version: 1.0.0
network: eip155:8453
asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
payTo: "0x1f0130669ca6fd02e025a984cc038f139df19a2f"
baseUrl: https://gpt.558686.xyz
mcpEndpoint: https://gpt.558686.xyz/mcp
openapi: https://gpt.558686.xyz/openapi.json
---

# GPT-6 x402 AI Intelligence Gateway Skill

Machine-to-machine AI micro-service gateway designed for autonomous AI agents, Coinbase AgentKit, ElizaOS, Swarms, Cursor, and Claude.

## Capabilities & Endpoints

### 1. Security & Protection
- **Agent Transaction Guard & Calldata Decoder** (`POST /v1/guard/tx`, $0.15 USDC)
  - Vets unsigned transactions, decodes calldata, detects drainer patterns, Permit2 traps, and phishing vectors before an agent signs on-chain.
- **Agent Prompt Injection Firewall** (`POST /v1/guard/prompt`, $0.05 USDC)
  - Sanitizes untrusted user inputs from social feeds or web scrapers to prevent jailbreaks, prompt leaks, and tool hijacking.
- **Smart Contract & Web3 Security Auditor** (`POST /v1/audit/contract`, $2.50 USDC)
  - Deep formal vulnerability and reentrancy analysis of Solidity contracts using GPT-6.

### 2. Architecture & Reasoning
- **Autonomous Agent System Architect** (`POST /v1/agent/architect`, $3.00 USDC)
  - Synthesizes end-to-end multi-agent architectures, state machines, and recovery protocols.
- **OpenAI Standard Completions** (`POST /v1/chat/completions`, $0.05 USDC)
  - Standard OpenAI-compatible format powered by GPT-6 Sol.
- **Deep Research Report** (`POST /v1/research`, $2.00 USDC)
  - Produces multi-perspective deep intelligence reports.

### 3. Data & Utilities
- **Structured Schema Extractor** (`POST /v1/extract/schema`, $0.50 USDC)
  - Extracts strict JSON conforming to any JSON Schema from unformatted text or HTML.
- **Data Insights Analyst** (`POST /v1/data/insights`, $1.00 USDC)
- **Document Summary Pro** (`POST /v1/doc/summary`, $0.50 USDC)
- **Translation Pro** (`POST /v1/translate/pro`, $0.30 USDC)
- **SEO Content Writer** (`POST /v1/content/seo`, $0.80 USDC)
- **x402 Protocol Ping & Probe** (`GET /v1/x402-ping`, $0.002 USDC)

## How Agents Pay via x402
1. Request any endpoint without authorization headers.
2. The server responds with `HTTP 402 Payment Required` containing EIP-712 payment parameters (Network: Base `8453`, Token: USDC, Facilitator: xpay / primer).
3. Sign the payment authorization using your Base USDC wallet.
4. Retry the request with header `Payment-Signature: <base64-or-hex-sig>`.
5. The gateway settles the payment instantly and returns the intelligence payload with an on-chain receipt hash.
