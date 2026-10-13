/**
 * Tokenização pelo admin (contratos v2, Base Mainnet).
 *
 * Faz o mesmo que o script contracts/scripts/listObraV2.ts, assinado pela carteira conectada:
 *   1. cria o cofre da obra na ArtVaultFactoryV2 (as frações vão para a carteira que assina)
 *   2. autoriza o marketplace a pegar as frações (approve exato)
 *   3. lista a obra no FractionMarketplaceV2 com o preço pela cotação do dia
 * Cada passo é pulado se já foi feito, então dá para repetir sem duplicar nada.
 * Cada transação só conta como feita depois do recibo com status "success".
 */
import type { Hex, PublicClient } from 'viem'
import { MARKETPLACE_V2, ONE_FRACTION } from '@/lib/marketplaceV2'

export const FACTORY_V2 = '0x4B104A3Fb6c64f2e3fAC2Ce32364e80D51d948c1' as const
const ZERO = '0x0000000000000000000000000000000000000000'
const MAX_FX_DIVERGENCE = 0.01

export const FACTORY_V2_ABI = [
  {
    type: 'function', name: 'createVault', stateMutability: 'nonpayable',
    inputs: [{
      name: 'p', type: 'tuple', components: [
        { name: 'obraId', type: 'uint256' },
        { name: 'name', type: 'string' },
        { name: 'symbol', type: 'string' },
        { name: 'ipfsHash', type: 'string' },
        { name: 'artist', type: 'address' },
        { name: 'fractions', type: 'uint256' },
        { name: 'recipient', type: 'address' },
      ],
    }],
    outputs: [{ type: 'address' }],
  },
  {
    type: 'function', name: 'getVault', stateMutability: 'view',
    inputs: [{ name: 'obraId', type: 'uint256' }], outputs: [{ type: 'address' }],
  },
  { type: 'function', name: 'FOUNDER_ROLE', stateMutability: 'view', inputs: [], outputs: [{ type: 'bytes32' }] },
  {
    type: 'function', name: 'hasRole', stateMutability: 'view',
    inputs: [{ name: 'role', type: 'bytes32' }, { name: 'account', type: 'address' }], outputs: [{ type: 'bool' }],
  },
] as const

const MP_ABI = [
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
    type: 'function', name: 'listObra', stateMutability: 'nonpayable',
    inputs: [
      { name: 'obraId', type: 'uint256' },
      { name: 'vault', type: 'address' },
      { name: 'artist', type: 'address' },
      { name: 'priceUsd6', type: 'uint256' },
      { name: 'amountToSell', type: 'uint256' },
    ],
    outputs: [],
  },
  { type: 'function', name: 'FOUNDER_ROLE', stateMutability: 'view', inputs: [], outputs: [{ type: 'bytes32' }] },
  {
    type: 'function', name: 'hasRole', stateMutability: 'view',
    inputs: [{ name: 'role', type: 'bytes32' }, { name: 'account', type: 'address' }], outputs: [{ type: 'bool' }],
  },
] as const

const ERC20 = [
  {
    type: 'function', name: 'balanceOf', stateMutability: 'view',
    inputs: [{ name: 'a', type: 'address' }], outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function', name: 'allowance', stateMutability: 'view',
    inputs: [{ name: 'o', type: 'address' }, { name: 's', type: 'address' }], outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function', name: 'approve', stateMutability: 'nonpayable',
    inputs: [{ name: 's', type: 'address' }, { name: 'v', type: 'uint256' }], outputs: [{ type: 'bool' }],
  },
] as const

export type ObraToTokenize = {
  id: string
  title: string
  artistWallet: string
  totalFractions: number
  valorObra?: string | number
  moeda?: string
}

type WriteFn = (req: any) => Promise<Hex>

const isAddr = (a: unknown): a is `0x${string}` => typeof a === 'string' && /^0x[0-9a-fA-F]{40}$/.test(a)

/** Sugestão de símbolo: NA- + 3 primeiras letras do título, sem acentos */
export function suggestSymbol(title: string) {
  const letters = title.normalize('NFD').replace(/[^A-Za-z]/g, '').toUpperCase()
  return `NA-${(letters + 'XXX').slice(0, 3)}`
}
export const validSymbol = (s: string) => /^[A-Z0-9-]{2,11}$/.test(s)

/** Cotação USD/BRL de duas fontes; recusa se divergirem mais de 1% */
export async function fetchUsdBrl(): Promise<number> {
  const [ra, rb] = await Promise.all([
    fetch('https://api.exchangerate-api.com/v4/latest/USD', { cache: 'no-store' }),
    fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL', { cache: 'no-store' }),
  ])
  if (!ra.ok || !rb.ok) throw new Error('Uma das fontes de cotação não respondeu')
  const a = Number((await ra.json())?.rates?.BRL)
  const b = Number((await rb.json())?.USDBRL?.bid)
  if (!(a > 3 && a < 10) || !(b > 3 && b < 10)) throw new Error(`Cotação inválida (${a} / ${b})`)
  const div = Math.abs(a - b) / Math.min(a, b)
  if (div > MAX_FX_DIVERGENCE) throw new Error(`As fontes de cotação divergem ${(div * 100).toFixed(2)}%`)
  return (a + b) / 2
}

/** Relê até a condição ser verdadeira (o RPC público da Base pode responder com um nó atrasado) */
async function waitFor<T>(fn: () => Promise<T>, ok: (v: T) => boolean, tries = 10): Promise<T> {
  let v = await fn()
  for (let i = 1; i < tries && !ok(v); i++) {
    await new Promise(r => setTimeout(r, 2000))
    v = await fn()
  }
  return v
}

async function send(client: PublicClient, write: WriteFn, req: any): Promise<Hex> {
  const hash = await write(req)
  const rc = await client.waitForTransactionReceipt({ hash })
  if (rc.status !== 'success') throw new Error(`a transação ${hash} foi revertida`)
  return hash
}

/** Lê o cofre v2 de uma obra (endereço zero = ainda não existe) */
export async function getVaultV2(client: PublicClient, obraId: string): Promise<`0x${string}`> {
  return client.readContract({ address: FACTORY_V2, abi: FACTORY_V2_ABI, functionName: 'getVault', args: [BigInt(obraId)] })
}

export async function tokenizeAndList(opts: {
  client: PublicClient
  write: WriteFn
  account: `0x${string}`
  obra: ObraToTokenize
  ipfsHash: string
  symbol: string
  onStep: (msg: string) => void
  onVault: (vault: `0x${string}`, txHash?: Hex) => Promise<void> | void
}): Promise<{ vault: `0x${string}`; listed: boolean }> {
  const { client, write, account, obra, ipfsHash, symbol, onStep, onVault } = opts
  if (!/^\d+$/.test(obra.id)) throw new Error('ID da obra inválido')
  if (!isAddr(obra.artistWallet)) throw new Error(`Carteira da artista inválida: ${obra.artistWallet}`)
  const fractions = Number(obra.totalFractions)
  if (!Number.isInteger(fractions) || fractions < 1) throw new Error(`Número de frações inválido: ${obra.totalFractions}`)
  const valorBRL = Number(obra.valorObra)
  if ((obra.moeda ?? 'BRL') !== 'BRL' || !(valorBRL > 0)) throw new Error('A obra precisa ter valor em BRL maior que zero')
  const id = BigInt(obra.id)
  const amount = BigInt(fractions) * ONE_FRACTION

  // 0. permissões (o contrato recusaria de qualquer forma; aqui evitamos gastar gás à toa)
  onStep('Conferindo permissões…')
  const [fRole, mRole] = await Promise.all([
    client.readContract({ address: FACTORY_V2, abi: FACTORY_V2_ABI, functionName: 'FOUNDER_ROLE' }),
    client.readContract({ address: MARKETPLACE_V2, abi: MP_ABI, functionName: 'FOUNDER_ROLE' }),
  ])
  const [fOk, mOk] = await Promise.all([
    client.readContract({ address: FACTORY_V2, abi: FACTORY_V2_ABI, functionName: 'hasRole', args: [fRole, account] }),
    client.readContract({ address: MARKETPLACE_V2, abi: MP_ABI, functionName: 'hasRole', args: [mRole, account] }),
  ])
  if (!fOk || !mOk) throw new Error('Esta carteira não tem permissão de fundadora nos contratos v2')

  // 1. cofre
  let vault = await getVaultV2(client, obra.id)
  if (vault === ZERO) {
    if (!validSymbol(symbol)) throw new Error('Símbolo inválido (use maiúsculas, ex.: NA-OLV)')
    onStep('1/3 Criando o cofre da obra — confirme na MetaMask')
    const hash = await send(client, write, {
      address: FACTORY_V2, abi: FACTORY_V2_ABI, functionName: 'createVault',
      args: [{
        obraId: id, name: `NeuroArt ${obra.title}`, symbol, ipfsHash,
        artist: obra.artistWallet, fractions: BigInt(fractions), recipient: account,
      }],
    })
    vault = await waitFor(() => getVaultV2(client, obra.id), v => v !== ZERO)
    if (vault === ZERO) throw new Error(`Transação confirmada (${hash}), mas o cofre ainda não aparece. Recarregue e tente de novo.`)
    await onVault(vault, hash)
  } else {
    await onVault(vault)
  }

  // 2 e 3. listagem
  const listing = await client.readContract({ address: MARKETPLACE_V2, abi: MP_ABI, functionName: 'getListing', args: [id] })
  if (listing.active) {
    onStep('A obra já estava listada no marketplace.')
    return { vault, listed: true }
  }

  const bal = await client.readContract({ address: vault, abi: ERC20, functionName: 'balanceOf', args: [account] })
  if (bal < amount) throw new Error(`As frações não estão nesta carteira (tem ${Number(bal / ONE_FRACTION)} de ${fractions}).`)

  const allowance = await client.readContract({ address: vault, abi: ERC20, functionName: 'allowance', args: [account, MARKETPLACE_V2] })
  if (allowance < amount) {
    onStep('2/3 Autorizando o marketplace a receber as frações — confirme na MetaMask')
    await send(client, write, { address: vault, abi: ERC20, functionName: 'approve', args: [MARKETPLACE_V2, amount] })
  }

  onStep('Buscando a cotação do dia…')
  const rate = await fetchUsdBrl()
  const priceUsd6 = BigInt(Math.round((valorBRL / fractions / rate) * 1e6))
  if (priceUsd6 <= BigInt(0)) throw new Error('Preço calculado inválido')

  onStep(`3/3 Listando a US$ ${(Number(priceUsd6) / 1e6).toFixed(4)} por fração — confirme na MetaMask`)
  await send(client, write, {
    address: MARKETPLACE_V2, abi: MP_ABI, functionName: 'listObra',
    args: [id, vault, obra.artistWallet, priceUsd6, amount],
  })
  return { vault, listed: true }
}
