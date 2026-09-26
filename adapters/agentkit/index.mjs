// gpt-x402-gateway — Coinbase AgentKit Action Provider
// Enables Coinbase AgentKit agents to autonomously purchase GPT-6 & Security Guards on Base USDC.

const GATEWAY_URL = process.env.GPT_X402_GATEWAY_URL || 'https://gpt.558686.xyz';
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

/**
 * Sign and pay for an x402 resource using AgentKit's EVM wallet provider
 */
async function payAndExecuteWithWallet(walletProvider, route, payload) {
  // 1. Fetch payment challenge
  const res = await fetch(`${GATEWAY_URL}${route}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });

  const raw402 = res.headers.get('payment-required');
  if (!raw402) {
    if (res.ok) return await res.json();
    throw new Error(`Failed to challenge (${res.status}): ${await res.text()}`);
  }

  const challenge = JSON.parse(Buffer.from(raw402, 'base64').toString('utf8'));
  const accept = challenge.accepts?.[0];
  if (!accept) throw new Error('No acceptable x402 requirement found');

  const buyerAddress = await walletProvider.getAddress();
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
    from: buyerAddress,
    to: accept.payTo,
    value: BigInt(accept.amount),
    validAfter,
    validBefore,
    nonce,
  };

  // Sign typed data with AgentKit wallet
  let signature;
  if (typeof walletProvider.signTypedData === 'function') {
    signature = await walletProvider.signTypedData({
      domain,
      types,
      primaryType: 'TransferWithAuthorization',
      message,
    });
  } else {
    throw new Error('Wallet provider does not implement signTypedData');
  }

  const wirePayload = {
    x402Version: 2,
    payload: {
      authorization: {
        from: buyerAddress,
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

  const paymentHeader = Buffer.from(JSON.stringify(wirePayload)).toString('base64');

  const paidRes = await fetch(`${GATEWAY_URL}${route}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Payment-Signature': paymentHeader,
    },
    body: JSON.stringify(payload || {}),
  });

  if (!paidRes.ok) {
    throw new Error(`Paid execution failed (${paidRes.status}): ${await paidRes.text()}`);
  }

  const data = await paidRes.json();
  const receiptId = paidRes.headers.get('x-receipt-id') || paidRes.headers.get('x-x402-receipt-id');
  return { data, receiptId };
}

export function gptX402ActionProvider(config = {}) {
  return {
    name: 'gpt-x402-gateway',
    description: 'Autonomous GPT-6 intelligence and security guardrails payable via x402 on Base USDC',
    actions: [
      {
        name: 'guard_transaction',
        description: 'Pre-transaction security auditor and calldata decoder for autonomous agents ($0.15 USDC). Screens contracts, drainers, and approvals.',
        invoke: async (walletProvider, args) => {
          const { to, data = '0x', value = '0', chainId = 8453, context = '' } = args;
          return await payAndExecuteWithWallet(walletProvider, '/v1/guard/tx', { to, data, value, chainId, context });
        },
      },
      {
        name: 'guard_prompt',
        description: 'Real-time prompt injection firewall and jailbreak detector ($0.05 USDC). Sanitizes untrusted user inputs.',
        invoke: async (walletProvider, args) => {
          const { prompt, agentRole = 'Autonomous Agent', sensitivity = 'HIGH' } = args;
          return await payAndExecuteWithWallet(walletProvider, '/v1/guard/prompt', { prompt, agentRole, sensitivity });
        },
      },
      {
        name: 'audit_smart_contract',
        description: 'Exhaustive Solidity and smart contract security audit using GPT-6 ($2.50 USDC).',
        invoke: async (walletProvider, args) => {
          const { contractCode, protocolType = 'EVM/Solidity' } = args;
          return await payAndExecuteWithWallet(walletProvider, '/v1/audit/contract', { contractCode, protocolType });
        },
      },
      {
        name: 'gpt6_completions',
        description: 'OpenAI-compatible GPT-6 Sol completions ($0.05 USDC).',
        invoke: async (walletProvider, args) => {
          const { messages, model = 'gpt-6-sol' } = args;
          return await payAndExecuteWithWallet(walletProvider, '/v1/chat/completions', { messages, model });
        },
      },
    ],
  };
}

export default gptX402ActionProvider;
