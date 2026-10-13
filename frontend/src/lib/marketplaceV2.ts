/**
 * FractionMarketplaceV2 — Base Mainnet.
 * Endereços em contracts/deployments/v2-8453.json. Contrato verificado no BaseScan.
 */
export const MARKETPLACE_V2 = '0xf85eBecbb310715785dd2AbF3257b2531DD3710E' as const
export const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const
export const BASESCAN = 'https://basescan.org'

/** 1 fração = 1e18 unidades do token do cofre */
export const ONE_FRACTION = BigInt('1000000000000000000')

export const MARKETPLACE_V2_ABI = [
  {
    type: 'function', name: 'getListing', stateMutability: 'view',
    inputs: [{ name: 'obraId', type: 'uint256' }],
    outputs: [{
      type: 'tuple', components: [
        { name: 'vault', type: 'address' },
        { name: 'artist', type: 'address' },
        { name: 'priceUsd6', type: 'uint256' },
        { name: 'priceUpdatedAt', type: 'uint64' },
        { name: 'active', type: 'bool' },
      ],
    }],
  },
  {
    type: 'function', name: 'available', stateMutability: 'view',
    inputs: [{ name: 'obraId', type: 'uint256' }], outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function', name: 'isPriceFresh', stateMutability: 'view',
    inputs: [{ name: 'obraId', type: 'uint256' }], outputs: [{ type: 'bool' }],
  },
  { type: 'function', name: 'paused', stateMutability: 'view', inputs: [], outputs: [{ type: 'bool' }] },
  {
    type: 'function', name: 'quoteUSDC', stateMutability: 'view',
    inputs: [{ name: 'obraId', type: 'uint256' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function', name: 'quoteETH', stateMutability: 'view',
    inputs: [{ name: 'obraId', type: 'uint256' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function', name: 'buyWithUSDC', stateMutability: 'nonpayable',
    inputs: [
      { name: 'obraId', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
      { name: 'maxUsdc', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function', name: 'buyWithETH', stateMutability: 'payable',
    inputs: [{ name: 'obraId', type: 'uint256' }, { name: 'amount', type: 'uint256' }],
    outputs: [],
  },
] as const

export const ERC20_ABI = [
  {
    type: 'function', name: 'allowance', stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function', name: 'balanceOf', stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function', name: 'approve', stateMutability: 'nonpayable',
    inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }],
  },
] as const

/** Formata USDC (6 casas) para exibição */
export function fmtUsdc(v: bigint, digits = 2) {
  return (Number(v) / 1e6).toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

/** Formata wei para ETH com casas significativas */
export function fmtEth(v: bigint, digits = 6) {
  return (Number(v) / 1e18).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: digits })
}

/** Mensagem legível para erros comuns de carteira e contrato */
export function friendlyError(e: unknown): string {
  const any = e as { shortMessage?: string; message?: string; name?: string }
  const raw = `${any?.name ?? ''} ${any?.shortMessage ?? ''} ${any?.message ?? ''}`
  if (/User rejected|User denied|rejected the request/i.test(raw)) return 'Você cancelou a operação na carteira.'
  if (/insufficient funds/i.test(raw)) return 'Saldo insuficiente para o valor mais a taxa de rede.'
  if (/transfer amount exceeds balance|ERC20InsufficientBalance/i.test(raw)) return 'Saldo de USDC insuficiente.'
  if (/MP: stale price/.test(raw)) return 'O preço desta obra está sendo atualizado. Tente novamente mais tarde.'
  if (/MP: stale oracle|sequencer/.test(raw)) return 'A cotação do ETH está temporariamente indisponível. Tente pagar em USDC ou aguarde alguns minutos.'
  if (/MP: price above max/.test(raw)) return 'O preço mudou desde que você abriu a compra. Feche e abra de novo para ver o valor atualizado.'
  if (/MP: not enough fractions/.test(raw)) return 'Não há frações suficientes disponíveis. Escolha uma quantidade menor.'
  if (/EnforcedPause/.test(raw)) return 'As vendas estão pausadas no momento.'
  return any?.shortMessage ?? any?.message ?? 'Erro desconhecido.'
}
