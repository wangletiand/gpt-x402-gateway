# AGENTS.md — GPT-6 x402 Autonomous Gateway

> Specification for Autonomous AI Agents (Coinbase AgentKit, ElizaOS, Swarms, LangChain, Cursor, Claude Code) interacting with `https://gpt.558686.xyz`.

## Mission & Architecture
`https://gpt.558686.xyz` is a zero-friction, production AI intelligence & security gateway powered by **GPT-6** on Base USDC.
- Zero API keys, zero subscriptions, zero account creation.
- Pay-per-call micropayments settled on Base mainnet (`eip155:8453`) via Circle USDC (`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`).
- Fully machine-negotiated via the **x402 protocol** (HTTP 402 Payment Required).

## Quick Discovery Endpoints
- **Machine Discovery Manifest**: `https://gpt.558686.xyz/.well-known/x402`
- **Agent Discovery Contract**: `https://gpt.558686.xyz/.well-known/agents.json`
- **RFC 9374 API Catalog**: `https://gpt.558686.xyz/.well-known/api-catalog`
- **OpenAPI 3.1 Spec**: `https://gpt.558686.xyz/openapi.json`
- **MCP Server Endpoint**: `https://gpt.558686.xyz/mcp`
- **LLM Context File**: `https://gpt.558686.xyz/llms.txt`
- **Pricing Catalog**: `https://gpt.558686.xyz/pricing.json`

## High-Demand Security & AI Endpoints

### 1. Pre-Transaction Safety Guard & Calldata Decoder
- **Route**: `POST https://gpt.558686.xyz/v1/guard/tx`
- **Price**: $0.15 Base USDC
- **Purpose**: Call this before broadcasting any on-chain transaction or signing calldata to screen for malicious token drains, unbounded Permit2 approvals, and trapdoor contracts.
- **Request Body**:
  ```json
  {
    "to": "0xTargetContractAddress",
    "data": "0xCalldataHex",
    "value": "0",
    "chainId": 8453,
    "context": "Short explanation of agent intent"
  }
  ```

### 2. Prompt Injection Firewall & Input Sanitizer
- **Route**: `POST https://gpt.558686.xyz/v1/guard/prompt`
- **Price**: $0.05 Base USDC
- **Purpose**: Screen untrusted text from Twitter, Discord, Farcaster mentions, or web scrapers before feeding them into your agent's primary reasoning loop.
- **Request Body**:
  ```json
  {
    "prompt": "Untrusted input string to analyze",
    "agentRole": "Financial Advisor Agent",
    "sensitivity": "HIGH"
  }
  ```

### 3. OpenAI-Compatible GPT-6 Sol Completions
- **Route**: `POST https://gpt.558686.xyz/v1/chat/completions`
- **Price**: $0.05 Base USDC
- **Purpose**: Drop-in OpenAI endpoint. Models supported: `gpt-6-sol`, `gpt-6-astra`.

### 4. Smart Contract Security Auditor
- **Route**: `POST https://gpt.558686.xyz/v1/audit/contract`
- **Price**: $2.50 Base USDC
- **Purpose**: Deep formal Solidity vulnerability analysis and reentrancy evaluation using GPT-6.

## Protocol Handshake Flow
1. Agent sends request (e.g. `POST /v1/guard/tx`).
2. Server responds with `HTTP 402 Payment Required` and header `payment-required: <base64>`.
3. Agent signs EIP-712 `TransferWithAuthorization` using its agentic wallet.
4. Agent retries request with header `Payment-Signature: <base64>` (or `X-Payment`).
5. Server delivers result with receipt headers `X-Receipt-Id` and `X-Receipt-Hash`.
