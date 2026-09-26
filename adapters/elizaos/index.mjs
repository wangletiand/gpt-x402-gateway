// gpt-x402-gateway — ElizaOS (ai16z) Plugin
// Provides autonomous security guardrails & GPT-6 reasoning payable via x402 on Base USDC.

import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

const GATEWAY_URL = process.env.GPT_X402_GATEWAY_URL || 'https://gpt.558686.xyz';
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

/**
 * Execute a paid call to gpt.558686.xyz using the agent's EVM wallet
 */
async function callPaidEndpoint(route, payload, privateKey) {
  if (!privateKey) {
    throw new Error('EVM private key required to pay for x402 service on Base USDC');
  }

  const cleanKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
  const account = privateKeyToAccount(cleanKey);

  // 1. Initial challenge
  const res = await fetch(`${GATEWAY_URL}${route}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });

  const raw402 = res.headers.get('payment-required');
  if (!raw402) {
    if (res.ok) return await res.json();
    throw new Error(`Unexpected response (${res.status}): ${await res.text()}`);
  }

  const challenge = JSON.parse(Buffer.from(raw402, 'base64').toString('utf8'));
  const accept = challenge.accepts?.[0];
  if (!accept) throw new Error('No compatible payment requirement found in 402 challenge');

  // 2. Sign EIP-712 TransferWithAuthorization
  const now = Math.floor(Date.now() / 1000);
  const nonce = '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join('');
  const validAfter = 0n;
  const validBefore = BigInt(now + (accept.maxTimeoutSeconds || 3600));

  const domain = {
    name: accept.extra?.name || 'USD Coin',
    version: accept.extra?.version || '2',
    chainId: 8453,
    verifyingContract: accept.asset || USDC_BASE,
  };

  const types = {
    TransferWithAuthorization: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'validAfter', type: 'uint256' },
      { name: 'validBefore', type: 'uint256' },
      { name: 'nonce', type: 'bytes32' },
    ],
  };

  const message = {
    from: account.address,
    to: accept.payTo,
    value: BigInt(accept.amount),
    validAfter,
    validBefore,
    nonce,
  };

  const signature = await account.signTypedData({
    domain,
    types,
    primaryType: 'TransferWithAuthorization',
    message,
  });

  // 3. Submit paid request
  const paymentWire = {
    x402Version: 2,
    payload: {
      authorization: {
        from: account.address,
        to: accept.payTo,
        value: accept.amount,
        validAfter: '0',
        validBefore: validBefore.toString(),
        nonce,
      },
      signature,
    },
    accepted: accept,
    resource: { url: `${GATEWAY_URL}${route}` },
  };

  const paymentHeader = Buffer.from(JSON.stringify(paymentWire)).toString('base64');

  const paidRes = await fetch(`${GATEWAY_URL}${route}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Payment-Signature': paymentHeader,
    },
    body: JSON.stringify(payload || {}),
  });

  if (!paidRes.ok) {
    throw new Error(`Execution failed (${paidRes.status}): ${await paidRes.text()}`);
  }

  const result = await paidRes.json();
  const receiptId = paidRes.headers.get('x-receipt-id') || paidRes.headers.get('x-x402-receipt-id');
  const receiptHash = paidRes.headers.get('x-receipt-hash');

  return { result, receiptId, receiptHash };
}

// Eliza Action: Pre-Transaction Guard
export const guardTxAction = {
  name: 'GUARD_TRANSACTION',
  similes: ['CHECK_TRANSACTION_SAFETY', 'DECODE_CALLDATA', 'VERIFY_TX'],
  description: 'Audits transaction calldata and checks target contract for drainers or traps before execution ($0.15 USDC).',
  validate: async (runtime) => Boolean(runtime.getSetting('WALLET_PRIVATE_KEY') || process.env.EVM_PRIVATE_KEY),
  handler: async (runtime, message, state, options, callback) => {
    const privateKey = runtime.getSetting('WALLET_PRIVATE_KEY') || process.env.EVM_PRIVATE_KEY;
    try {
      const { to, data, value = '0', chainId = 8453, context = '' } = options;
      const { result, receiptId } = await callPaidEndpoint('/v1/guard/tx', { to, data, value, chainId, context }, privateKey);
      if (callback) {
        callback({
          text: `🛡️ Transaction Guard Result (${result.verdict}):\nRisk Score: ${result.riskScore}/100\n${result.analysis}\nReceipt: ${receiptId}`,
          content: result,
        });
      }
      return true;
    } catch (err) {
      if (callback) callback({ text: `Failed to guard transaction: ${err.message}` });
      return false;
    }
  },
  examples: [],
};

// Eliza Action: Prompt Injection Firewall
export const guardPromptAction = {
  name: 'SANITIZE_PROMPT',
  similes: ['CHECK_PROMPT_INJECTION', 'FIREWALL_INPUT', 'FILTER_UNTRUSTED_CONTENT'],
  description: 'Sanitizes untrusted inputs from Twitter/Farcaster/mentions against prompt injection ($0.05 USDC).',
  validate: async (runtime) => Boolean(runtime.getSetting('WALLET_PRIVATE_KEY') || process.env.EVM_PRIVATE_KEY),
  handler: async (runtime, message, state, options, callback) => {
    const privateKey = runtime.getSetting('WALLET_PRIVATE_KEY') || process.env.EVM_PRIVATE_KEY;
    try {
      const { prompt, agentRole = 'Autonomous Agent', sensitivity = 'HIGH' } = options;
      const { result, receiptId } = await callPaidEndpoint('/v1/guard/prompt', { prompt, agentRole, sensitivity }, privateKey);
      if (callback) {
        callback({
          text: `🛡️ Prompt Firewall Verdict: ${result.isSafe ? 'SAFE' : 'ATTACK DETECTED'}\nThreat: ${result.threatLevel}\nSanitized: ${result.sanitizedPrompt || result.explanation}`,
          content: result,
        });
      }
      return true;
    } catch (err) {
      if (callback) callback({ text: `Prompt firewall failed: ${err.message}` });
      return false;
    }
  },
  examples: [],
};

// Eliza Action: Smart Contract Auditor
export const auditContractAction = {
  name: 'AUDIT_SMART_CONTRACT',
  similes: ['AUDIT_SOLIDITY', 'SCAN_CONTRACT_SECURITY', 'CHECK_VULNERABILITY'],
  description: 'Performs deep formal security and reentrancy analysis on smart contract code ($2.50 USDC).',
  validate: async (runtime) => Boolean(runtime.getSetting('WALLET_PRIVATE_KEY') || process.env.EVM_PRIVATE_KEY),
  handler: async (runtime, message, state, options, callback) => {
    const privateKey = runtime.getSetting('WALLET_PRIVATE_KEY') || process.env.EVM_PRIVATE_KEY;
    try {
      const { contractCode, protocolType = 'EVM/Solidity' } = options;
      const { result, receiptId } = await callPaidEndpoint('/v1/audit/contract', { contractCode, protocolType }, privateKey);
      if (callback) {
        callback({
          text: `🔍 Contract Audit Summary:\nSeverity: ${result.overallSeverity || 'Report Generated'}\nReceipt: ${receiptId}\n${typeof result === 'string' ? result : JSON.stringify(result, null, 2)}`,
          content: result,
        });
      }
      return true;
    } catch (err) {
      if (callback) callback({ text: `Contract audit failed: ${err.message}` });
      return false;
    }
  },
  examples: [],
};

// Eliza Plugin Export
export const x402GatewayPlugin = {
  name: 'x402-gateway',
  description: 'Production GPT-6 & Security Guardrails for ElizaOS agents payable per call on Base USDC via x402.',
  actions: [guardTxAction, guardPromptAction, auditContractAction],
  evaluators: [],
  providers: [],
};

export default x402GatewayPlugin;
